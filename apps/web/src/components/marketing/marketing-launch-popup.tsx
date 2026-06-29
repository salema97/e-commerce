'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { MarketingPlacementPublic } from '@repo/shared-types';

interface MarketingLaunchPopupProps {
  placement: MarketingPlacementPublic;
  onDismiss: () => void;
  onCta: () => void;
}

export function MarketingLaunchPopup({ placement, onDismiss, onCta }: MarketingLaunchPopupProps) {
  const [open, setOpen] = React.useState(true);
  const triggerRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    triggerRef.current = document.activeElement as HTMLElement | null;
    return () => {
      triggerRef.current?.focus();
    };
  }, []);

  function close() {
    setOpen(false);
    onDismiss();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DialogContent
        className="max-w-lg"
        role="dialog"
        aria-labelledby="marketing-popup-title"
        data-testid="marketing-launch-popup"
        onEscapeKeyDown={() => {
          if (placement.dismissible) close();
        }}
      >
        <DialogHeader>
          <DialogTitle id="marketing-popup-title">{placement.title}</DialogTitle>
          {placement.body ? <DialogDescription>{placement.body}</DialogDescription> : null}
        </DialogHeader>
        {placement.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={placement.imageUrl} alt="" className="w-full border-[3px] border-neo-onyx object-cover" />
        ) : null}
        <DialogFooter className="gap-2 sm:justify-start">
          {placement.ctaLabel ? (
            <Button type="button" onClick={onCta}>
              {placement.ctaLabel}
            </Button>
          ) : null}
          {placement.dismissible ? (
            <Button type="button" variant="outline" onClick={close} data-testid="marketing-popup-dismiss">
              Cerrar
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
