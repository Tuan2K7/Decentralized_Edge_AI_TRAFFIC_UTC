import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MeshProviderWrapper from "../components/MeshProviderWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Traffic Grid Dashboard",
  description: "Mạng lưới AI Giao thông tự chữa lành - Nhóm T",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={inter.className} suppressHydrationWarning>
        <MeshProviderWrapper>
          {children}
        </MeshProviderWrapper>
      </body>
    </html>
  );
}