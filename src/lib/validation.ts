import { z } from "zod";

const labels: Record<string, string> = {
  name: "نام و نام خانوادگی",
  email: "ایمیل",
  phone: "شماره موبایل",
  password: "رمز عبور",
  confirmPassword: "تکرار رمز عبور",
  identifier: "ایمیل یا شماره موبایل",
  role: "نوع حساب",
  city: "شهر",
  address: "آدرس",
  description: "توضیحات",
  shopName: "نام فروشگاه",
  sellerPhone: "شماره تماس فروشگاه",
  categoryIds: "دسته‌بندی‌ها",
  categories: "دسته‌بندی‌ها",
  categoryId: "دسته‌بندی",
  parentId: "دسته‌بندی والد",
  title: "نام قطعه",
  brand: "برند / سازنده",
  partNumber: "شماره فنی قطعه",
  quantity: "تعداد",
  notes: "یادداشت",
  attachments: "پیوست‌ها",
  durationSeconds: "مدت فایل",
  plateNumber: "شماره پلاک",
  carMake: "برند خودرو",
  carModel: "مدل خودرو",
  carYear: "سال ساخت",
  items: "قطعات",
  totalPrice: "قیمت پیشنهادی",
  deliveryFee: "هزینه ارسال",
  estimatedDeliveryHours: "زمان آماده‌سازی",
  note: "توضیحات پیشنهاد",
  id: "شناسه",
  code: "کد تایید",
  icon: "آیکون",
  slug: "نامک",
  sortOrder: "ترتیب نمایش",
  action: "عملیات",
  status: "وضعیت",
  all: "همه",
};

const itemLabels: Record<string, string> = {
  categoryId: "دسته‌بندی",
  title: "نام قطعه",
  brand: "برند / سازنده",
  partNumber: "شماره فنی قطعه",
  quantity: "تعداد",
  description: "توضیح کوتاه",
  notes: "یادداشت",
  attachments: "پیوست‌ها",
  durationSeconds: "مدت فایل",
};

function fa(value: number | bigint) {
  return new Intl.NumberFormat("fa-IR").format(Number(value));
}

function labelFor(path: PropertyKey[]) {
  const parts = path.map(String);
  if (parts.length === 0) return "فرم";

  if (parts[0] === "items") {
    const index = Number(parts[1]);
    const key = parts[2] ?? "";
    const prefix = Number.isFinite(index) ? `قطعه ${fa(index + 1)}` : "قطعه";
    return `${prefix} - ${itemLabels[key] ?? labels[key] ?? "مقدار"}`;
  }

  return labels[parts[0]] ?? "مقدار";
}

type RawIssue = {
  code: string;
  path: PropertyKey[];
  message: string;
  minimum?: number | bigint;
  maximum?: number | bigint;
  origin?: string;
  input?: unknown;
  keys?: string[];
};

export function firstIssue(error: z.ZodError): { error: string; field: string } {
  const issue = error.issues[0] as unknown as RawIssue;
  const field = issue.path.map(String).join(".");
  const label = labelFor(issue.path);
  const required = issue.input === undefined || issue.input === null || issue.input === "";

  switch (issue.code) {
    case "invalid_type":
      return {
        error: required ? `«${label}» الزامی است` : `«${label}» معتبر نیست`,
        field,
      };
    case "too_small":
      if (issue.origin === "string" && Number(issue.minimum) === 1) {
        return { error: `«${label}» الزامی است`, field };
      }
      if (issue.origin === "array") {
        return { error: `حداقل ${fa(issue.minimum ?? 0)} مورد برای «${label}» لازم است`, field };
      }
      return {
        error: `«${label}» باید حداقل ${fa(issue.minimum ?? 0)} باشد`,
        field,
      };
    case "too_big":
      if (issue.origin === "array") {
        return { error: `حداکثر ${fa(issue.maximum ?? 0)} مورد برای «${label}» مجاز است`, field };
      }
      return {
        error: `«${label}» باید حداکثر ${fa(issue.maximum ?? 0)} باشد`,
        field,
      };
    case "invalid_format":
    case "invalid_string":
    case "invalid_value":
    case "invalid_enum_value":
    case "invalid_union":
      return { error: `«${label}» معتبر نیست`, field };
    case "unrecognized_keys":
      return { error: `فیلد ناشناخته در «${label}» وجود دارد`, field };
    case "custom":
      return { error: issue.message, field };
    default:
      return {
        error: /[\u0600-\u06FF]/.test(issue.message)
          ? issue.message
          : `«${label}» معتبر نیست`,
        field,
      };
  }
}

export function validationError(error: z.ZodError) {
  return firstIssue(error);
}
