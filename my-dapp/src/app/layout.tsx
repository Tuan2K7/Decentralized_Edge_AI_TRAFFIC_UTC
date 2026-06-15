import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Import Wrapper bạn vừa tạo ở Bước 1 thay vì import trực tiếp từ @meshsdk/react
import MeshProviderWrapper from "../components/MeshProviderWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Decentralized Edge-AI Traffic Grid",
  description: "Mạng lưới AI Giao thông tự chữa lành",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        {/* Bọc ứng dụng bằng Wrapper */}
        <MeshProviderWrapper>
          {children}
        </MeshProviderWrapper>
      </body>
    </html>
  );
}