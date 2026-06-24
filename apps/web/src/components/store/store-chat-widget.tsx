'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApiQueryHooks } from '@/lib/client-api';
import type { Message } from '@repo/shared-types';

export function StoreChatWidget() {
  const hooks = useApiQueryHooks();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);

  const createSession = hooks.useCreateChatSession({
    onSuccess: (session) => setSessionId(session.webSessionId),
  });

  const { data: messages = [] } = hooks.useChatMessages(sessionId ?? '', {
    enabled: Boolean(sessionId && open),
  });

  const sendMessage = hooks.useSendChatMessage();

  useEffect(() => {
    if (!open || sessionId || createSession.isPending) {
      return;
    }
    createSession.mutate({ contactName: 'Visitante' });
  }, [open, sessionId, createSession]);

  async function handleSendMessage() {
    if (!sessionId || !input.trim()) {
      return;
    }
    const content = input.trim();
    setInput('');
    await sendMessage.mutateAsync({ sessionId, content });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg"
      >
        ¿Necesitas ayuda?
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-96 w-80 flex-col rounded-xl border bg-background shadow-xl">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <p className="font-medium">Soporte en línea</p>
        <button type="button" className="text-sm text-muted-foreground" onClick={() => setOpen(false)}>
          Cerrar
        </button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((message: Message) => (
          <div
            key={message.id}
            className={`text-sm ${message.direction === 'OUTBOUND' ? 'text-right' : 'text-left'}`}
          >
            <span
              className={`inline-block rounded-lg px-3 py-2 ${
                message.direction === 'OUTBOUND' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              {message.content}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t p-3">
        <Input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Escribe tu mensaje..." />
        <Button type="button" onClick={() => void handleSendMessage()} disabled={sendMessage.isPending}>
          Enviar
        </Button>
      </div>
    </div>
  );
}
