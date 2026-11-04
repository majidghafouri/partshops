import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const parentCategories = [
  { name: "قطعات موتوری", slug: "engine-parts", icon: "⚙️", sortOrder: 1 },
  { name: "سیستم ترمز", slug: "brake-system", icon: "🛑", sortOrder: 2 },
  { name: "قطعات بدنه", slug: "body-parts", icon: "🚗", sortOrder: 3 },
  { name: "چراغ و روشنایی", slug: "lighting", icon: "💡", sortOrder: 4 },
  { name: "جلوبندی و تعلیق", slug: "suspension", icon: "🔧", sortOrder: 5 },
  { name: "لوازم برقی", slug: "electrical", icon: "⚡", sortOrder: 6 },
  { name: "لاستیک و رینگ", slug: "tires-rims", icon: "🛞", sortOrder: 7 },
  { name: "فیلتر و صافی", slug: "filters", icon: "🔄", sortOrder: 8 },
  { name: "روغن و مایعات", slug: "oils-fluids", icon: "🛢️", sortOrder: 9 },
  { name: "لوازم جانبی", slug: "accessories", icon: "📱", sortOrder: 10 },
  { name: "سیستم فرمان", slug: "steering", icon: "🎯", sortOrder: 11 },
  {
    name: "گیربکس و انتقال قدرت",
    slug: "transmission",
    icon: "⚙️",
    sortOrder: 12,
  },
];

const subCategories: Record<string, { name: string; slug: string }[]> = {
  "engine-parts": [
    { name: "واشر سرسیلندر", slug: "cylinder-head-gasket" },
    { name: "شمع موتور", slug: "spark-plug" },
    { name: "تسمه تایم", slug: "timing-belt" },
    { name: "واتر پمپ", slug: "water-pump" },
    { name: "رادیاتور", slug: "radiator" },
    { name: "دینام و استارت", slug: "alternator-starter" },
  ],
  "brake-system": [
    { name: "لنت ترمز", slug: "brake-pad" },
    { name: "دیسک ترمز", slug: "brake-disc" },
    { name: "سیلندر ترمز", slug: "brake-cylinder" },
    { name: "روغن ترمز", slug: "brake-fluid" },
    { name: "بوستر ترمز", slug: "brake-booster" },
  ],
  "body-parts": [
    { name: "سپر", slug: "bumper" },
    { name: "گلگیر", slug: "fender" },
    { name: "درب جانبی", slug: "door" },
    { name: "آینه بغل", slug: "side-mirror" },
    { name: "جلوپنجره", slug: "grille" },
    { name: "کاپوت", slug: "hood" },
  ],
  lighting: [
    { name: "چراغ جلو", slug: "headlight" },
    { name: "چراغ عقب", slug: "taillight" },
    { name: "چراغ مه شکن", slug: "fog-light" },
    { name: "لامپ", slug: "bulb" },
  ],
  suspension: [
    { name: "کمک فنر", slug: "shock-absorber" },
    { name: "طبق", slug: "control-arm" },
    { name: "سیبک", slug: "ball-joint" },
    { name: "میل تعادل", slug: "sway-bar" },
    { name: "بوش طبق", slug: "control-arm-bush" },
  ],
  electrical: [
    { name: "باتری", slug: "battery" },
    { name: "دینام", slug: "alternator" },
    { name: "استارت", slug: "starter" },
    { name: "سنسور", slug: "sensor" },
    { name: "کوئل", slug: "ignition-coil" },
  ],
  "tires-rims": [
    { name: "لاستیک", slug: "tire" },
    { name: "رینگ", slug: "rim" },
    { name: "تویی", slug: "wheel-cover" },
  ],
  filters: [
    { name: "فیلتر روغن", slug: "oil-filter" },
    { name: "فیلتر هوا", slug: "air-filter" },
    { name: "فیلتر کابین", slug: "cabin-filter" },
    { name: "فیلتر سوخت", slug: "fuel-filter" },
  ],
  "oils-fluids": [
    { name: "روغن موتور", slug: "engine-oil" },
    { name: "روغن گیربکس", slug: "gearbox-oil" },
    { name: "مایع خنک‌کننده", slug: "coolant" },
    { name: "مایع شیشه‌شور", slug: "windshield-fluid" },
  ],
  steering: [
    { name: "پمپ هیدرولیک", slug: "power-steering-pump" },
    { name: "غربیلک فرمان", slug: "steering-wheel" },
    { name: "جعبه فرمان", slug: "steering-box" },
  ],
  transmission: [
    { name: "دیسک و صفحه کلاچ", slug: "clutch-kit" },
    { name: "بلبرینگ کلاچ", slug: "clutch-bearing" },
    { name: "پلوس", slug: "cv-axle" },
  ],
  accessories: [
    { name: "کفپوش", slug: "floor-mat" },
    { name: "روکش صندلی", slug: "seat-cover" },
    { name: "دوربین خودرو", slug: "dashcam" },
    { name: "شارژر و کابل", slug: "car-charger" },
  ],
};

async function upsertUser(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "CUSTOMER" | "SELLER" | "ADMIN";
  city?: string;
}) {
  const password = await bcrypt.hash(input.password, 12);
  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      name: input.name,
      phone: input.phone,
      password,
      role: input.role,
      city: input.city ?? null,
    },
    create: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      password,
      role: input.role,
      city: input.city ?? null,
    },
  });
}

async function main() {
  console.log("Seeding database...");

  const categories: Record<string, string> = {};
  for (const category of parentCategories) {
    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        icon: category.icon,
        sortOrder: category.sortOrder,
        parentId: null,
      },
      create: category,
    });
    categories[category.slug] = row.id;
  }

  for (const [parentSlug, children] of Object.entries(subCategories)) {
    const parentId = categories[parentSlug];
    let sortOrder = 0;
    for (const child of children) {
      const row = await prisma.category.upsert({
        where: { slug: child.slug },
        update: { name: child.name, parentId, sortOrder },
        create: { name: child.name, slug: child.slug, parentId, sortOrder },
      });
      categories[child.slug] = row.id;
      sortOrder += 1;
    }
  }

  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";
  const demoPassword = process.env.DEMO_PASSWORD || "Demo@12345";
  const seedDemo = process.env.SEED_DEMO !== "false";

  const admin = await upsertUser({
    name: "مدیر پارت شاپ",
    email: "admin@partshops.ir",
    phone: "09120000000",
    password: adminPassword,
    role: "ADMIN",
    city: "تهران",
  });

  if (seedDemo) {
    await upsertUser({
      name: "مشتری نمونه",
      email: "customer@partshops.ir",
      phone: "09120000001",
      password: demoPassword,
      role: "CUSTOMER",
      city: "تهران",
    });

    const sellerUser = await upsertUser({
      name: "فروشنده نمونه",
      email: "seller@partshops.ir",
      phone: "09120000002",
      password: demoPassword,
      role: "SELLER",
      city: "تهران",
    });

    const seller = await prisma.sellerProfile.upsert({
      where: { userId: sellerUser.id },
      update: {
        shopName: "یدک‌پارت تهران",
        description:
          "تامین‌کننده قطعات موتوری، ترمز و فیلتر خودروهای ایرانی و خارجی.",
        phone: "09120000002",
        city: "تهران",
        address: "تهران، خیابان امیرکبیر، بازار قطعات یدکی",
        status: "APPROVED",
        approvedAt: new Date(),
        rejectionReason: null,
      },
      create: {
        userId: sellerUser.id,
        shopName: "یدک‌پارت تهران",
        description:
          "تامین‌کننده قطعات موتوری، ترمز و فیلتر خودروهای ایرانی و خارجی.",
        phone: "09120000002",
        city: "تهران",
        address: "تهران، خیابان امیرکبیر، بازار قطعات یدکی",
        status: "APPROVED",
        approvedAt: new Date(),
      },
    });

    const pendingUser = await upsertUser({
      name: "فروشنده در انتظار",
      email: "pending@partshops.ir",
      phone: "09120000003",
      password: demoPassword,
      role: "SELLER",
      city: "اصفهان",
    });

    const pendingSeller = await prisma.sellerProfile.upsert({
      where: { userId: pendingUser.id },
      update: { status: "PENDING", shopName: "قطعات اصفهان", city: "اصفهان" },
      create: {
        userId: pendingUser.id,
        shopName: "قطعات اصفهان",
        description: "فروشنده قطعات بدنه و روشنایی",
        city: "اصفهان",
        status: "PENDING",
      },
    });

    await prisma.sellerCategory.deleteMany({
      where: { sellerId: { in: [seller.id, pendingSeller.id] } },
    });

    const sellerCategorySlugs = [
      "engine-parts",
      "brake-system",
      "filters",
      "electrical",
      "spark-plug",
      "brake-pad",
      "oil-filter",
      "battery",
    ];
    const pendingCategorySlugs = [
      "body-parts",
      "lighting",
      "bumper",
      "headlight",
    ];

    await prisma.sellerCategory.createMany({
      data: sellerCategorySlugs.map((slug) => ({
        sellerId: seller.id,
        categoryId: categories[slug],
      })),
    });
    await prisma.sellerCategory.createMany({
      data: pendingCategorySlugs.map((slug) => ({
        sellerId: pendingSeller.id,
        categoryId: categories[slug],
      })),
    });

    const existingNotification = await prisma.notification.findFirst({
      where: { userId: admin.id, title: "فروشنده نمونه در انتظار تایید" },
    });
    if (!existingNotification) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: "SELLER_REGISTERED",
          title: "فروشنده نمونه در انتظار تایید",
          message: "فروشگاه «قطعات اصفهان» ثبت‌نام کرده و در انتظار بررسی است.",
        },
      });
    }
  }

  console.log("Seed complete.");
  console.log("Admin:", "admin@partshops.ir", "/", adminPassword);
  if (seedDemo) {
    console.log("Customer:", "customer@partshops.ir", "/", demoPassword);
    console.log("Seller:", "seller@partshops.ir", "/", demoPassword);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed error:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
