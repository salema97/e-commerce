import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';

export interface ChatBubbleProps {
  content: string;
  direction: 'inbound' | 'outbound';
  timestamp?: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  senderName?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  content,
  direction,
  timestamp,
  status,
  senderName,
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
      <View style={[styles.bubble, isOutbound ? styles.outboundBubble : styles.inboundBubble]}>
        <Text style={[styles.text, isOutbound ? styles.outboundText : styles.inboundText, textStyle]}>
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
    maxWidth: '80%',
    marginVertical: 4,
  },
  inboundContainer: {
    alignSelf: 'flex-start',
  },
  outboundContainer: {
    alignSelf: 'flex-end',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inboundBubble: {
    backgroundColor: '#f5f5f5',
    borderBottomLeftRadius: 4,
  },
  outboundBubble: {
    backgroundColor: '#171717',
    borderBottomRightRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  inboundText: {
    color: '#171717',
  },
  outboundText: {
    color: '#ffffff',
  },
  senderName: {
    fontSize: 12,
    color: '#737373',
    marginBottom: 4,
    marginLeft: 4,
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
    color: '#a3a3a3',
  },
  status: {
    fontSize: 11,
    color: '#a3a3a3',
    textTransform: 'capitalize',
  },
});
