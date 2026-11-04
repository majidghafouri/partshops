export type RequestStatus =
  | "OPEN"
  | "ACCEPTED"
  | "SHIPPED"
  | "DELIVERED"
  | "EXPIRED"
  | "CANCELLED";

export type OfferStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";

export type SellerStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  children?: Category[];
  requestCount?: number;
  sellerCount?: number;
}

export interface SellerSummary {
  id: string;
  shopName: string;
  city?: string | null;
  phone?: string | null;
  address?: string | null;
  rating: number;
  totalSales: number;
  status: SellerStatus;
  description?: string | null;
  categories?: { id: string; name: string }[];
}

export type AttachmentKind = "IMAGE" | "AUDIO" | "VIDEO";

export interface AttachmentView {
  id: string;
  kind: AttachmentKind;
  mimeType: string;
  size: number;
  durationSeconds?: number | null;
  url: string;
}

export interface RequestItemView {
  id: string;
  title: string;
  description?: string | null;
  brand?: string | null;
  partNumber?: string | null;
  quantity: number;
  notes?: string | null;
  category: { id: string; name: string; icon?: string | null };
  attachments: AttachmentView[];
}

export interface OfferView {
  id: string;
  totalPrice: number;
  deliveryFee: number;
  estimatedDeliveryHours?: number | null;
  note?: string | null;
  status: OfferStatus;
  createdAt: string;
  seller: SellerSummary;
  isMine?: boolean;
}

export interface RequestView {
  id: string;
  status: RequestStatus;
  createdAt: string;
  expiresAt: string;
  closedAt?: string | null;
  city?: string | null;
  address: string;
  phone?: string | null;
  plateNumber?: string | null;
  carMake?: string | null;
  carModel?: string | null;
  carYear?: number | null;
  notes?: string | null;
  customer: { id: string; name: string; phone?: string | null };
  items: RequestItemView[];
  attachments: AttachmentView[];
  offers: OfferView[];
  offerCount: number;
  myOffer?: OfferView | null;
  acceptedOffer?: OfferView | null;
  acceptedSeller?: SellerSummary | null;
  hasMatchingCategory?: boolean;
}

export interface NotificationView {
  id: string;
  type: string;
  title: string;
  message: string;
  requestId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface RealtimeEvent {
  type: string;
  title?: string;
  message?: string;
  requestId?: string | null;
  payload?: Record<string, unknown>;
  at?: number;
}
