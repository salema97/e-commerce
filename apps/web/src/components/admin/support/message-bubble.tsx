'use client';

import { formatDateTime } from '@repo/shared-utils';
import { Check, CheckCheck, AlertCircle } from 'lucide-react';
import type { Message } from '@repo/shared-types';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === 'OUTBOUND';

  function statusIcon() {
    if (message.status === 'FAILED') {
      return <AlertCircle className="size-3 text-neo-scarlet" strokeWidth={3} />;
    }
    if (message.status === 'READ') {
      return <CheckCheck className="size-3 text-neo-gold" strokeWidth={3} />;
    }
    if (message.status === 'DELIVERED') {
      return <CheckCheck className="size-3 text-muted-foreground" strokeWidth={3} />;
    }
    return <Check className="size-3 text-muted-foreground" strokeWidth={3} />;
  }

  return (
    <div
      className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
      data-testid={`message-${message.id}`}
    >
      <div
        className={`max-w-[80%] border-[3px] border-neo-onyx px-4 py-2 text-sm shadow-[4px_4px_0_0_#111111] ${
          isOutbound
            ? 'bg-neo-onyx text-white'
            : 'bg-white text-neo-onyx'
        }`}
      >
        <p className="whitespace-pre-wrap font-medium">{message.content}</p>
        <div
          className={`mt-1 flex items-center justify-end gap-1 text-[10px] font-bold uppercase ${
            isOutbound ? 'text-white/70' : 'text-muted-foreground'
          }`}
        >
          <span>{message.sentAt ? formatDateTime(message.sentAt) : formatDateTime(message.createdAt)}</span>
          {isOutbound ? statusIcon() : null}
        </div>
        {message.errorMessage ? (
          <p className="mt-1 text-[10px] font-bold text-neo-scarlet">{message.errorMessage}</p>
        ) : null}
      </div>
    </div>
  );
}
