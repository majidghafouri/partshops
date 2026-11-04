import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg">
                پ
              </div>
              <span className="text-xl font-bold">پارت شاپ</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              بازار درخواست قطعات یدکی خودرو؛ نیاز خود را ثبت کنید و از بین پیشنهادهای فروشندگان معتبر، بهترین قیمت را انتخاب کنید.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-sm mb-4">خدمات</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/request/new" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  ثبت درخواست قطعه
                </Link>
              </li>
              <li>
                <Link href="/account/requests" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  پیگیری درخواست‌ها
                </Link>
              </li>
              <li>
                <Link href="/auth/register?role=seller" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  عضویت فروشندگان
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-sm mb-4">دسترسی سریع</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  صفحه اصلی
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  ورود به حساب
                </Link>
              </li>
              <li>
                <Link href="/seller/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  پنل فروشنده
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-sm mb-4">پشتیبانی</h3>
            <ul className="space-y-2">
              <li className="text-sm text-muted-foreground">ایمیل: support@partshops.ir</li>
              <li className="text-sm text-muted-foreground">ساعات پاسخگویی: ۹ الی ۱۸</li>
              <li className="text-sm text-muted-foreground">پاسخگویی از طریق اعلان‌های حساب</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted">© ۱۴۰۵ پارت شاپ. تمامی حقوق محفوظ است.</p>
          <div className="flex items-center gap-4 text-xs text-muted">
            <span>حریم خصوصی</span>
            <span>شرایط استفاده</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
