import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Button, ChatBubble, Input, neo, neoSpacing } from '@repo/shared-ui';
import type { Message } from '@repo/shared-types';
import { useApiQueryHooks } from '../../lib/api';

export function StoreChatWidget(): React.ReactElement {
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
      <Button
        variant="secondary"
        size="sm"
        onPress={() => setOpen(true)}
        style={styles.fab}
        testID="store-chat-open"
      >
        ¿Ayuda?
      </Button>
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
            <Button
              variant="ghost"
              size="sm"
              onPress={() => setOpen(false)}
              textStyle={styles.close}
            >
              Cerrar
            </Button>
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
                  <ChatBubble
                    content={message.content}
                    direction={isOutbound ? 'outbound' : 'inbound'}
                    isBot={isBot}
                  />
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.composer}>
            <Input
              value={input}
              onChangeText={setInput}
              placeholder="Escribe tu mensaje..."
              onSubmitEditing={() => void handleSendMessage()}
              containerStyle={styles.inputContainer}
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
    right: neoSpacing.screen,
    bottom: neoSpacing.screen,
    zIndex: 50,
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
    paddingVertical: 8,
  },
  headerTitle: {
    fontWeight: '800',
    textTransform: 'uppercase',
    color: neo.onyx,
  },
  close: {
    fontSize: 12,
    textDecorationLine: 'underline',
    textTransform: 'uppercase',
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
  composer: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 3,
    borderTopColor: neo.onyx,
    padding: 12,
    alignItems: 'flex-end',
  },
  inputContainer: {
    flex: 1,
  },
});
