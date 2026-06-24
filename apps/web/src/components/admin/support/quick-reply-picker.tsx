'use client';

import * as React from 'react';
import type { QuickReply } from '@repo/shared-types';
import { FormSelect } from '@/components/ui/form-select';

interface QuickReplyPickerProps {
  replies: QuickReply[];
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export function QuickReplyPicker({ replies, onSelect, disabled }: QuickReplyPickerProps) {
  const [resetKey, setResetKey] = React.useState(0);

  return (
    <FormSelect
      key={resetKey}
      ariaLabel="Respuestas rápidas"
      placeholder="Respuesta rápida"
      disabled={disabled || replies.length === 0}
      triggerClassName="h-9"
      options={replies.map((reply) => ({
        value: reply.id,
        label: reply.label,
      }))}
      onValueChange={(replyId) => {
        const reply = replies.find((item) => item.id === replyId);
        if (reply) onSelect(reply.text);
        setResetKey((current) => current + 1);
      }}
    />
  );
}
