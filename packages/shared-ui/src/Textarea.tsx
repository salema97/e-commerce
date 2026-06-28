import React, { useState } from 'react';
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
import { neoFieldStyles } from './field-styles.js';

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
      onFocus,
      onBlur,
      ...textInputProps
    },
    ref,
  ) => {
    const [focused, setFocused] = useState(false);

    return (
      <View style={[styles.container, containerStyle]}>
        {label ? <Text style={[neoFieldStyles.label, labelStyle]}>{label}</Text> : null}
        <TextInput
          ref={ref}
          editable={editable}
          multiline
          numberOfLines={rows}
          textAlignVertical="top"
          placeholderTextColor="rgba(17,17,17,0.45)"
          style={[
            neoFieldStyles.input,
            { minHeight: rows * 24, textTransform: 'none' },
            focused && editable ? neoFieldStyles.inputFocused : null,
            error ? neoFieldStyles.inputError : null,
            !editable ? neoFieldStyles.inputDisabled : null,
            inputStyle,
          ]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...textInputProps}
        />
        {error ? (
          <Text style={[neoFieldStyles.error, errorStyle]}>{error}</Text>
        ) : helper ? (
          <Text style={neoFieldStyles.helper}>{helper}</Text>
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
});
