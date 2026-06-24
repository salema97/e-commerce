import React from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
  type TextStyle,
  type StyleProp,
} from 'react-native';
import { neo } from './theme.js';

export interface TextareaProps extends Omit<TextInputProps, 'style' | 'multiline'> {
  label?: string;
  error?: string;
  helper?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
  errorStyle?: StyleProp<TextStyle>;
  rows?: number;
}

export const Textarea = React.forwardRef<TextInput, TextareaProps>(
  (
    {
      label,
      error,
      helper,
      containerStyle,
      inputStyle,
      labelStyle,
      errorStyle,
      editable = true,
      rows = 4,
      ...textInputProps
    },
    ref,
  ) => {
    return (
      <View style={[styles.container, containerStyle]}>
        {label ? <Text style={[styles.label, labelStyle]}>{label}</Text> : null}
        <TextInput
          ref={ref}
          editable={editable}
          multiline
          numberOfLines={rows}
          textAlignVertical="top"
          placeholderTextColor="rgba(17,17,17,0.45)"
          style={[
            styles.input,
            { minHeight: rows * 24 },
            error ? styles.inputError : null,
            !editable ? styles.inputDisabled : null,
            inputStyle,
          ]}
          {...textInputProps}
        />
        {error ? (
          <Text style={[styles.error, errorStyle]}>{error}</Text>
        ) : helper ? (
          <Text style={styles.helper}>{helper}</Text>
        ) : null}
      </View>
    );
  },
);

Textarea.displayName = 'Textarea';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: 6,
    fontSize: 12,
    fontWeight: '700',
    color: neo.onyx,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 3,
    borderColor: neo.onyx,
    borderRadius: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    color: neo.onyx,
    backgroundColor: neo.white,
  },
  inputError: {
    borderColor: neo.scarlet,
  },
  inputDisabled: {
    backgroundColor: neo.bg,
    color: neo.muted,
  },
  error: {
    marginTop: 6,
    fontSize: 13,
    color: neo.scarlet,
    fontWeight: '600',
  },
  helper: {
    marginTop: 6,
    fontSize: 13,
    color: neo.muted,
  },
});
