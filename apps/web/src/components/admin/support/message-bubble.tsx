'use client';

import Image from 'next/image';
import { formatDateTime } from '@repo/shared-utils';
import { Check, CheckCheck, AlertCircle } from 'lucide-react';
import type { Message } from '@repo/shared-types';

interface MessageBubbleProps {
  message: Message;
}

const MEDIA_PLACEHOLDERS = new Set(['[image]', '[video]', '[audio]', '[document]']);

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === 'OUTBOUND';
  const isBot = message.senderType === 'BOT';
  const showCaption =
    Boolean(message.content) && !MEDIA_PLACEHOLDERS.has(message.content);

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
            ? isBot
              ? 'bg-violet-600 text-white'
              : 'bg-neo-onyx text-white'
            : 'bg-white text-neo-onyx'
        }`}
      >
        {isBot ? (
          <p className="mb-1 text-[10px] font-bold uppercase opacity-80">Bot</p>
        ) : null}
        {message.contentType === 'IMAGE' && message.mediaUrl ? (
          <a
            href={message.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-2 block"
          >
            <Image
              src={message.mediaUrl}
              alt={showCaption ? message.content : 'Imagen de WhatsApp'}
              width={400}
              height={288}
              unoptimized
              className="max-h-72 max-w-full border-2 border-neo-onyx object-contain"
            />
          </a>
        ) : null}
        {showCaption ? (
          <p className="whitespace-pre-wrap font-medium">{message.content}</p>
        ) : message.contentType === 'IMAGE' && !message.mediaUrl ? (
          <p className="whitespace-pre-wrap font-medium italic opacity-70">Imagen no disponible</p>
        ) : null}
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
