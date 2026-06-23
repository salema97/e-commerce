import type { ReactNode } from 'react';
import { StoreChatWidget } from '@/components/store/store-chat-widget';

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <StoreChatWidget />
    </>
  );
}
