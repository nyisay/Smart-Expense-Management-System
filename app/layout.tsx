import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Expense Management",
  description:
    "Understand personal spending, review receipts and split group expenses accurately.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme="dark"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <head><script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('smart-expense-theme');if(t==='frosted')document.documentElement.dataset.theme=t}catch{}` }} /></head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
