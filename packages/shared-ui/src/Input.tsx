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
          placeholderTextColor="rgba(17,17,17,0.45)"
          style={[
            neoFieldStyles.input,
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

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
