import type { Metadata } from 'next';
import './globals.css';
import { MeshProviderWrapper } from '@/components/MeshProviderWrapper';

export const metadata: Metadata = {
  title: 'Decentralized Edge-AI Traffic Grid',
  description: 'Hệ thống giám sát hạ tầng giao thông phi tập trung — AI + Blockchain',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body>
        <MeshProviderWrapper>{children}</MeshProviderWrapper>
      </body>
    </html>
  );
}
