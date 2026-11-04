import "server-only";
import { prisma } from "./prisma";
import type { Prisma } from "@/generated/prisma/client";
import type {
  AttachmentView,
  Category,
  OfferView,
  RequestView,
  SellerSummary,
} from "./types";
import { expireStaleRequests } from "./expire";
import { expandCategoryIds } from "./categories";

const sellerSelect = {
  id: true,
  shopName: true,
  city: true,
  phone: true,
  address: true,
  rating: true,
  totalSales: true,
  status: true,
  description: true,
} satisfies Prisma.SellerProfileSelect;

const offerInclude = {
  seller: { select: sellerSelect },
} satisfies Prisma.OfferInclude;

const attachmentSelect = {
  id: true,
  kind: true,
  mimeType: true,
  size: true,
  durationSeconds: true,
} satisfies Prisma.AttachmentSelect;

const requestInclude = {
  customer: { select: { id: true, name: true, phone: true } },
  items: {
    include: {
      category: { select: { id: true, name: true, icon: true } },
      attachments: { select: attachmentSelect, orderBy: { createdAt: "asc" as const } },
    },
    orderBy: { createdAt: "asc" as const },
  },
  attachments: {
    where: { itemId: null },
    select: attachmentSelect,
    orderBy: { createdAt: "asc" as const },
  },
  offers: { include: offerInclude, orderBy: { createdAt: "asc" as const } },
  acceptedOffer: { include: offerInclude },
  acceptedSeller: { select: sellerSelect },
} satisfies Prisma.PartRequestInclude;

type OfferPayload = Prisma.OfferGetPayload<{ include: typeof offerInclude }>;
type RequestPayload = Prisma.PartRequestGetPayload<{ include: typeof requestInclude }>;

export async function getCategoryTree(): Promise<Category[]> {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { requestItems: true, sellers: true } },
    },
  });

  const mapCategory = (category: (typeof categories)[number]): Category => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    icon: category.icon,
    parentId: category.parentId,
    sortOrder: category.sortOrder,
    requestCount: category._count.requestItems,
    sellerCount: category._count.sellers,
  });

  const parents = categories.filter((category) => !category.parentId);
  return parents.map((parent) => ({
    ...mapCategory(parent),
    children: categories
      .filter((category) => category.parentId === parent.id)
      .map(mapCategory),
  }));
}

export async function getCategoriesFlat(): Promise<Category[]> {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    icon: category.icon,
    parentId: category.parentId,
    sortOrder: category.sortOrder,
  }));
}

export async function getSellerCategories(sellerId: string) {
  const rows = await prisma.sellerCategory.findMany({
    where: { sellerId },
    include: { category: { select: { id: true, name: true, icon: true, parentId: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((row) => row.category);
}

export async function getSellerProfileByUserId(userId: string) {
  return prisma.sellerProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, city: true } },
      categories: {
        include: { category: { select: { id: true, name: true, icon: true, parentId: true } } },
      },
    },
  });
}

function mapSeller(seller: {
  id: string;
  shopName: string;
  city: string | null;
  phone: string | null;
  address: string | null;
  rating: number;
  totalSales: number;
  status: string;
  description: string | null;
}): SellerSummary {
  return {
    id: seller.id,
    shopName: seller.shopName,
    city: seller.city,
    phone: seller.phone,
    address: seller.address,
    rating: seller.rating,
    totalSales: seller.totalSales,
    status: seller.status as SellerSummary["status"],
    description: seller.description,
  };
}

function mapAttachment(attachment: {
  id: string;
  kind: string;
  mimeType: string;
  size: number;
  durationSeconds: number | null;
}): AttachmentView {
  return {
    id: attachment.id,
    kind: attachment.kind as AttachmentView["kind"],
    mimeType: attachment.mimeType,
    size: attachment.size,
    durationSeconds: attachment.durationSeconds,
    url: `/api/attachments/${attachment.id}`,
  };
}

function mapOffer(offer: OfferPayload, viewerSellerId?: string | null): OfferView {
  return {
    id: offer.id,
    totalPrice: offer.totalPrice,
    deliveryFee: offer.deliveryFee,
    estimatedDeliveryHours: offer.estimatedDeliveryHours,
    note: offer.note,
    status: offer.status,
    createdAt: offer.createdAt.toISOString(),
    seller: mapSeller(offer.seller),
    isMine: viewerSellerId ? offer.sellerId === viewerSellerId : undefined,
  };
}

export function mapRequest(
  request: RequestPayload,
  options: { viewerSellerId?: string | null } = {}
): RequestView {
  const allOffers = request.offers;
  const visibleOffers = options.viewerSellerId
    ? allOffers.filter((offer) => offer.sellerId === options.viewerSellerId)
    : allOffers;
  const myOffer = options.viewerSellerId
    ? visibleOffers.find((offer) => offer.sellerId === options.viewerSellerId)
    : undefined;

  return {
    id: request.id,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    expiresAt: request.expiresAt.toISOString(),
    closedAt: request.closedAt?.toISOString() ?? null,
    city: request.city,
    address: request.address,
    phone: request.phone,
    plateNumber: request.plateNumber,
    carMake: request.carMake,
    carModel: request.carModel,
    carYear: request.carYear,
    notes: request.notes,
    customer: request.customer,
    items: request.items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      brand: item.brand,
      partNumber: item.partNumber,
      quantity: item.quantity,
      notes: item.notes,
      category: item.category,
      attachments: item.attachments.map(mapAttachment),
    })),
    attachments: request.attachments.map(mapAttachment),
    offers: visibleOffers.map((offer) => mapOffer(offer, options.viewerSellerId)),
    offerCount: allOffers.length,
    myOffer: myOffer ? mapOffer(myOffer, options.viewerSellerId) : null,
    acceptedOffer: request.acceptedOffer ? mapOffer(request.acceptedOffer, options.viewerSellerId) : null,
    acceptedSeller: request.acceptedSeller ? mapSeller(request.acceptedSeller) : null,
  };
}

export async function getCustomerRequests(customerId: string) {
  await expireStaleRequests();
  const requests = await prisma.partRequest.findMany({
    where: { customerId },
    include: requestInclude,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return requests.map((request) => mapRequest(request));
}

export async function getCustomerRequest(id: string, customerId: string) {
  const request = await prisma.partRequest.findUnique({
    where: { id },
    include: requestInclude,
  });
  if (!request || request.customerId !== customerId) return null;
  return mapRequest(request);
}

export async function getSellerRequest(id: string, sellerId: string) {
  const request = await prisma.partRequest.findUnique({
    where: { id },
    include: requestInclude,
  });
  if (!request) return null;

  const selectedCategoryIds = (
    await prisma.sellerCategory.findMany({
      where: { sellerId },
      select: { categoryId: true },
    })
  ).map((row) => row.categoryId);
  const categorySet = new Set(await expandCategoryIds(selectedCategoryIds));
  const hasMatchingCategory = request.items.some((item) => categorySet.has(item.categoryId));
  const isAcceptedSeller = request.acceptedSellerId === sellerId;

  if (request.status !== "OPEN" && !isAcceptedSeller) return null;
  if (!hasMatchingCategory && !isAcceptedSeller) return null;

  const mapped = mapRequest(request, { viewerSellerId: sellerId });
  if (!isAcceptedSeller) {
    return {
      ...mapped,
      address: "پس از پذیرش پیشنهاد، آدرس تحویل نمایش داده می‌شود.",
      phone: null,
      customer: { ...mapped.customer, phone: null },
      hasMatchingCategory,
    };
  }

  return { ...mapped, hasMatchingCategory };
}

export async function getAvailableRequestsForSeller(sellerId: string) {
  await expireStaleRequests();
  const selectedCategoryIds = (
    await prisma.sellerCategory.findMany({
      where: { sellerId },
      select: { categoryId: true },
    })
  ).map((row) => row.categoryId);

  if (selectedCategoryIds.length === 0) return [];
  const categoryIds = await expandCategoryIds(selectedCategoryIds);

  const requests = await prisma.partRequest.findMany({
    where: {
      status: "OPEN",
      expiresAt: { gt: new Date() },
      items: { some: { categoryId: { in: categoryIds } } },
    },
    include: requestInclude,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return requests.map((request) => ({
    ...mapRequest(request, { viewerSellerId: sellerId }),
    hasMatchingCategory: true,
  }));
}

export async function getSellerOffers(sellerId: string) {
  await expireStaleRequests();
  return prisma.offer.findMany({
    where: { sellerId },
    include: {
      request: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          expiresAt: true,
          city: true,
          items: {
            include: { category: { select: { id: true, name: true, icon: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getSellerAcceptedRequests(sellerId: string) {
  await expireStaleRequests();
  const requests = await prisma.partRequest.findMany({
    where: {
      acceptedSellerId: sellerId,
      status: { in: ["ACCEPTED", "SHIPPED", "DELIVERED"] },
    },
    include: requestInclude,
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
  return requests.map((request) => mapRequest(request, { viewerSellerId: sellerId }));
}

export async function getAdminSellers(status?: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED") {
  return prisma.sellerProfile.findMany({
    where: status ? { status } : undefined,
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      categories: {
        include: { category: { select: { id: true, name: true, icon: true } } },
      },
      _count: { select: { offers: true, acceptedRequests: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function getAdminRequests(limit = 50) {
  await expireStaleRequests();
  const requests = await prisma.partRequest.findMany({
    include: requestInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return requests.map((request) => mapRequest(request));
}

export async function getAdminStats() {
  const [customers, sellers, pendingSellers, openRequests, totalOffers, acceptedRequests] =
    await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.sellerProfile.count({ where: { status: "APPROVED" } }),
      prisma.sellerProfile.count({ where: { status: "PENDING" } }),
      prisma.partRequest.count({ where: { status: "OPEN", expiresAt: { gt: new Date() } } }),
      prisma.offer.count(),
      prisma.partRequest.count({ where: { status: "ACCEPTED" } }),
    ]);

  return { customers, sellers, pendingSellers, openRequests, totalOffers, acceptedRequests };
}

export async function getSellerUserIdsForCategories(categoryIds: string[]) {
  const expanded = await expandCategoryIds(categoryIds);
  const rows = await prisma.sellerCategory.findMany({
    where: {
      categoryId: { in: expanded },
      seller: { status: "APPROVED" },
    },
    select: { seller: { select: { userId: true } } },
  });
  return [...new Set(rows.map((row) => row.seller.userId))];
}

export async function getAdminUserIds() {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  return admins.map((admin) => admin.id);
}

export async function getRequestForAdmin(id: string) {
  const request = await prisma.partRequest.findUnique({
    where: { id },
    include: requestInclude,
  });
  if (!request) return null;
  return mapRequest(request);
}
