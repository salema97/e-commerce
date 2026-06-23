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
      return <AlertCircle className="size-3 text-destructive" />;
    }
    if (message.status === 'READ') {
      return <CheckCheck className="size-3 text-primary" />;
    }
    if (message.status === 'DELIVERED') {
      return <CheckCheck className="size-3 text-muted-foreground" />;
    }
    return <Check className="size-3 text-muted-foreground" />;
  }

  return (
    <div
      className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
      data-testid={`message-${message.id}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
          isOutbound
            ? 'bg-primary text-primary-foreground rounded-br-none'
            : 'bg-muted text-foreground rounded-bl-none'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isOutbound ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          <span>{message.sentAt ? formatDateTime(message.sentAt) : formatDateTime(message.createdAt)}</span>
          {isOutbound ? statusIcon() : null}
        </div>
        {message.errorMessage ? (
          <p className="mt-1 text-[10px] text-destructive">{message.errorMessage}</p>
        ) : null}
      </div>
    </div>
  );
}
