import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar, NavbarFallback } from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Easy Exchange",
  description: "Exchange physical CDs",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<NavbarFallback />}>
          <Navbar />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
