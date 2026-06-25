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

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helper?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
  errorStyle?: StyleProp<TextStyle>;
}

export const Input = React.forwardRef<TextInput, InputProps>(
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
          placeholderTextColor="rgba(17,17,17,0.45)"
          style={[
            styles.input,
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

Input.displayName = 'Input';

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
