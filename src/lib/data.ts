export const cities = [
  "تهران",
  "اصفهان",
  "مشهد",
  "تبریز",
  "شیراز",
  "کرج",
  "اهواز",
  "قم",
  "کرمان",
  "یزد",
  "اراک",
  "بندرعباس",
  "زنجان",
  "همدان",
  "سنندج",
  "بیرجند",
  "بوشهر",
  "بجنورد",
  "چالوس",
  "رشت",
  "ساری",
  "قزوین",
  "ارومیه",
  "خرم‌آباد",
  "کرمانشاه",
  "گرگان",
  "سمنان",
  "شهرکرد",
  "ایلام",
  "یاسوج",
];

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("fa-IR").format(value);
}
