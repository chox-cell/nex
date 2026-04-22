import type { ReactNode } from "react";

import { AppFrame } from "../../src/components/app-frame";

export const dynamic = "force-dynamic";

interface NexLayoutProps {
  children: ReactNode;
}

export default function NexLayout({ children }: NexLayoutProps) {
  return <AppFrame>{children}</AppFrame>;
}

