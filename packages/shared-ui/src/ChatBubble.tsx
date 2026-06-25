import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { neo } from './theme.js';

export interface ChatBubbleProps {
  content: string;
  direction: 'inbound' | 'outbound';
  timestamp?: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  senderName?: string;
  isBot?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  content,
  direction,
  timestamp,
  status,
  senderName,
  isBot = false,
  style,
  textStyle,
}) => {
  const isOutbound = direction === 'outbound';

  return (
    <View
      style={[
        styles.container,
        isOutbound ? styles.outboundContainer : styles.inboundContainer,
        style,
      ]}
    >
      {senderName ? <Text style={styles.senderName}>{senderName}</Text> : null}
      <View
        style={[
          styles.bubble,
          isOutbound
            ? isBot
              ? styles.botBubble
              : styles.outboundBubble
            : styles.inboundBubble,
        ]}
      >
        {isBot ? <Text style={styles.botLabel}>Bot</Text> : null}
        <Text
          style={[
            styles.text,
            isOutbound ? styles.outboundText : styles.inboundText,
            textStyle,
          ]}
        >
          {content}
        </Text>
      </View>
      <View style={styles.footer}>
        {timestamp ? <Text style={styles.timestamp}>{timestamp}</Text> : null}
        {status ? <Text style={styles.status}>{status}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: '85%',
    marginVertical: 4,
  },
  inboundContainer: {
    alignSelf: 'flex-start',
  },
  outboundContainer: {
    alignSelf: 'flex-end',
  },
  bubble: {
    borderWidth: 3,
    borderColor: neo.onyx,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: neo.onyx,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  inboundBubble: {
    backgroundColor: neo.white,
  },
  outboundBubble: {
    backgroundColor: neo.onyx,
  },
  botBubble: {
    backgroundColor: '#7c3aed',
  },
  botLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  inboundText: {
    color: neo.onyx,
  },
  outboundText: {
    color: neo.white,
  },
  senderName: {
    fontSize: 12,
    color: neo.muted,
    marginBottom: 4,
    marginLeft: 4,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 6,
  },
  timestamp: {
    fontSize: 11,
    color: neo.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  status: {
    fontSize: 11,
    color: neo.muted,
    textTransform: 'capitalize',
    fontWeight: '700',
  },
});
