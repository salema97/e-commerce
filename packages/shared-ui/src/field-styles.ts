import { StyleSheet } from 'react-native';
import { neo } from './theme.js';

/** Shared field styles aligned with web `components/ui/input.tsx`. */
export const neoFieldStyles = StyleSheet.create({
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
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '700',
    color: neo.onyx,
    backgroundColor: neo.white,
    textTransform: 'uppercase',
  },
  inputFocused: {
    backgroundColor: neo.gold,
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
