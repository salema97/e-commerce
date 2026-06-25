'use client';

import { Toaster as Sonner, type ToasterProps } from 'sonner';

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast border-[3px] border-neo-onyx bg-white text-neo-onyx shadow-[6px_6px_0_#111111] font-bold uppercase text-sm',
          description: 'group-[.toast]:text-muted-foreground normal-case font-medium',
          actionButton:
            'group-[.toast]:bg-neo-gold group-[.toast]:text-neo-onyx group-[.toast]:border-[3px] group-[.toast]:border-neo-onyx',
          cancelButton:
            'group-[.toast]:bg-white group-[.toast]:text-neo-onyx group-[.toast]:border-[3px] group-[.toast]:border-neo-onyx',
          success: 'group-[.toast]:border-neo-green',
          error: 'group-[.toast]:border-neo-scarlet',
        },
      }}
      {...props}
    />
  );
}
