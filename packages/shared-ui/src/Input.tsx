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
          placeholderTextColor="#a3a3a3"
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
    fontSize: 14,
    fontWeight: '500',
    color: '#171717',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#171717',
    backgroundColor: '#ffffff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#737373',
  },
  error: {
    marginTop: 6,
    fontSize: 13,
    color: '#ef4444',
  },
  helper: {
    marginTop: 6,
    fontSize: 13,
    color: '#737373',
  },
});
