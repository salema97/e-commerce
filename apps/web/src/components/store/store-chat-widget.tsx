'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatMessage {
  id: string;
  content: string;
  direction: 'INBOUND' | 'OUTBOUND';
  senderType?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/v1';

export function StoreChatWidget() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || sessionId) {
      return;
    }

    void fetch(`${API_BASE}/chat/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactName: 'Visitante' }),
    })
      .then((response) => response.json())
      .then((data: { webSessionId: string }) => setSessionId(data.webSessionId));
  }, [open, sessionId]);

  useEffect(() => {
    if (!sessionId || !open) {
      return;
    }

    const interval = setInterval(() => {
      void fetch(`${API_BASE}/chat/sessions/${sessionId}/messages`)
        .then((response) => response.json())
        .then((data: ChatMessage[]) => setMessages(data));
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionId, open]);

  async function sendMessage() {
    if (!sessionId || !input.trim()) {
      return;
    }

    const content = input.trim();
    setInput('');

    const response = await fetch(`${API_BASE}/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    const data = (await response.json()) as ChatMessage[];
    setMessages(data);
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
        {messages.map((message) => (
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
        <Button type="button" onClick={() => void sendMessage()}>
          Enviar
        </Button>
      </div>
    </div>
  );
}
