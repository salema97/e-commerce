'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApiQueryHooks } from '@/lib/client-api';
import type { Message } from '@repo/shared-types';
import { cn } from '@/lib/utils';

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
    refetchInterval: open ? 3_000 : false,
  });

  const sendMessage = hooks.useSendChatMessage();

  function handleOpenChat() {
    setOpen(true);
    if (!sessionId && !createSession.isPending) {
      createSession.mutate({ contactName: 'Visitante' });
    }
  }

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
        data-testid="store-chat-open"
        onClick={handleOpenChat}
        className="fixed bottom-6 right-6 z-50 border-[3px] border-neo-onyx bg-neo-gold px-5 py-3 font-bold uppercase shadow-[4px_4px_0_#111] transition-transform hover:-translate-y-0.5"
      >
        ¿Necesitas ayuda?
      </button>
    );
  }

  return (
    <div
      data-testid="store-chat-panel"
      className="fixed bottom-6 right-6 z-50 flex h-[28rem] w-80 flex-col border-[3px] border-neo-onyx bg-neo-lace shadow-[8px_8px_0_#111]"
    >
      <div className="flex items-center justify-between border-b-[3px] border-neo-onyx bg-neo-gold px-4 py-3">
        <p className="font-bold uppercase">Soporte en línea</p>
        <button
          type="button"
          className="text-xs font-bold uppercase underline-offset-4 hover:underline"
          onClick={() => setOpen(false)}
        >
          Cerrar
        </button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.map((message: Message) => {
          const isOutbound = message.direction === 'OUTBOUND';
          const isBot = message.senderType === 'BOT';

          return (
            <div
              key={message.id}
              className={cn('flex', isOutbound ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[85%] border-[3px] border-neo-onyx px-3 py-2 text-sm shadow-[3px_3px_0_#111]',
                  isOutbound
                    ? isBot
                      ? 'bg-violet-600 text-white'
                      : 'bg-neo-onyx text-white'
                    : 'bg-white text-neo-onyx',
                )}
              >
                {isBot ? (
                  <p className="mb-1 text-[10px] font-bold uppercase opacity-80">Bot</p>
                ) : null}
                <p className="whitespace-pre-wrap font-medium">{message.content}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 border-t-[3px] border-neo-onyx p-3">
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Escribe tu mensaje..."
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void handleSendMessage();
            }
          }}
        />
        <Button
          type="button"
          onClick={() => void handleSendMessage()}
          disabled={sendMessage.isPending || createSession.isPending || !sessionId}
        >
          Enviar
        </Button>
      </div>
    </div>
  );
}
