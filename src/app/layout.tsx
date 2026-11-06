import type { Metadata } from "next";
import "./globals.css";
import HeaderServer from "@/components/HeaderServer";
import Footer from "@/components/Footer";
import ToastProvider from "@/components/ToastProvider";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

export const metadata: Metadata = {
  metadataBase: new URL("https://partshops.ir"),
  title: "پارت شاپ | بازار درخواست قطعات یدکی خودرو",
  description: "قطعه مورد نیاز خودروی خود را ثبت کنید و از فروشندگان معتبر لوازم یدکی، پیشنهاد قیمت دریافت کنید.",
  applicationName: "پارت شاپ",
  appleWebApp: { capable: true, title: "پارت شاپ", statusBarStyle: "black-translucent" },
  themeColor: "#f97316",
  icons: { apple: "/apple-touch-icon.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground" style={{ fontFamily: "Dana, Tahoma, sans-serif" }}>
        <ToastProvider>
          <ServiceWorkerRegistrar />
          <HeaderServer />
          <main className="flex-1">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
