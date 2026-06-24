import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Button, neo } from '@repo/shared-ui';
import type { Message } from '@repo/shared-types';
import { api } from '../../lib/api.js';

export function StoreChatWidget(): React.ReactElement {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);

  const createSession = api.hooks.useCreateChatSession({
    onSuccess: (session) => setSessionId(session.webSessionId),
  });

  const { data: messages = [] } = api.hooks.useChatMessages(sessionId ?? '', {
    enabled: Boolean(sessionId && open),
    refetchInterval: open ? 3_000 : false,
  });

  const sendMessage = api.hooks.useSendChatMessage();

  useEffect(() => {
    if (!open || sessionId || createSession.isPending) {
      return;
    }
    createSession.mutate({ contactName: 'Cliente móvil' });
  }, [open, sessionId, createSession]);

  async function handleSendMessage(): Promise<void> {
    if (!sessionId || !input.trim()) {
      return;
    }
    const content = input.trim();
    setInput('');
    await sendMessage.mutateAsync({ sessionId, content });
  }

  if (!open) {
    return (
      <Pressable style={styles.fab} onPress={() => setOpen(true)}>
        <Text style={styles.fabText}>¿Ayuda?</Text>
      </Pressable>
    );
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Soporte en línea</Text>
            <Pressable onPress={() => setOpen(false)}>
              <Text style={styles.close}>Cerrar</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.messages} contentContainerStyle={styles.messagesContent}>
            {messages.map((message: Message) => {
              const isOutbound = message.direction === 'OUTBOUND';
              const isBot = message.senderType === 'BOT';

              return (
                <View
                  key={message.id}
                  style={[styles.bubbleRow, isOutbound ? styles.rowEnd : styles.rowStart]}
                >
                  <View
                    style={[
                      styles.bubble,
                      isOutbound
                        ? isBot
                          ? styles.botBubble
                          : styles.agentBubble
                        : styles.userBubble,
                    ]}
                  >
                    {isBot ? <Text style={styles.botLabel}>Bot</Text> : null}
                    <Text
                      style={[
                        styles.bubbleText,
                        isOutbound && styles.bubbleTextLight,
                      ]}
                    >
                      {message.content}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Escribe tu mensaje..."
              placeholderTextColor={neo.muted}
              onSubmitEditing={() => void handleSendMessage()}
            />
            <Button
              onPress={() => void handleSendMessage()}
              disabled={sendMessage.isPending}
              size="sm"
            >
              Enviar
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 88,
    zIndex: 50,
    borderWidth: 3,
    borderColor: neo.onyx,
    backgroundColor: neo.gold,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: neo.onyx,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  fabText: {
    fontWeight: '800',
    textTransform: 'uppercase',
    color: neo.onyx,
    fontSize: 12,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  panel: {
    height: '70%',
    borderTopWidth: 3,
    borderColor: neo.onyx,
    backgroundColor: neo.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 3,
    borderBottomColor: neo.onyx,
    backgroundColor: neo.gold,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontWeight: '800',
    textTransform: 'uppercase',
    color: neo.onyx,
  },
  close: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    textDecorationLine: 'underline',
    color: neo.onyx,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: 12,
    gap: 8,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  rowEnd: {
    justifyContent: 'flex-end',
  },
  rowStart: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    borderWidth: 3,
    borderColor: neo.onyx,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  userBubble: {
    backgroundColor: '#fff',
  },
  agentBubble: {
    backgroundColor: neo.onyx,
  },
  botBubble: {
    backgroundColor: '#7c3aed',
  },
  botLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  bubbleText: {
    fontSize: 14,
    fontWeight: '600',
    color: neo.onyx,
  },
  bubbleTextLight: {
    color: '#fff',
  },
  composer: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 3,
    borderTopColor: neo.onyx,
    padding: 12,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 3,
    borderColor: neo.onyx,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontWeight: '600',
    color: neo.onyx,
    backgroundColor: '#fff',
  },
});
