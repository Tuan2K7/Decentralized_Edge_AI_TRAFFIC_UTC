'use client'; // Dòng này cực kỳ quan trọng, báo cho Next.js biết đây là Client Component

import { MeshProvider } from "@meshsdk/react";

export default function MeshProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MeshProvider>{children}</MeshProvider>;
}