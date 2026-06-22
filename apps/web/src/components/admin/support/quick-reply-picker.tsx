'use client';

import type { QuickReply } from '@repo/shared-types';

interface QuickReplyPickerProps {
  replies: QuickReply[];
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export function QuickReplyPicker({ replies, onSelect, disabled }: QuickReplyPickerProps) {
  return (
    <select
      aria-label="Respuestas rápidas"
      className="h-9 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
      disabled={disabled || replies.length === 0}
      onChange={(e) => {
        const reply = replies.find((r) => r.id === e.target.value);
        if (reply) onSelect(reply.text);
        e.target.value = '';
      }}
    >
      <option value="">Respuesta rápida</option>
      {replies.map((reply) => (
        <option key={reply.id} value={reply.id}>
          {reply.label}
        </option>
      ))}
    </select>
  );
}
