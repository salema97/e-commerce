import type { TextStyle, ViewStyle } from 'react-native';
import { neo } from './theme.js';

/** Font families loaded by each app (Anton + Space Grotesk on web/mobile). */
export type NeoFontFamilies = {
  display: string;
  sans: string;
};

export const defaultNeoFonts: NeoFontFamilies = {
  display: 'System',
  sans: 'System',
};

let activeFonts: NeoFontFamilies = defaultNeoFonts;

export function setNeoFontFamilies(fonts: NeoFontFamilies): void {
  activeFonts = fonts;
}

export function getNeoFontFamilies(): NeoFontFamilies {
  return activeFonts;
}

/** Text presets aligned with web globals.css (.neo-page-title, NeoPageHeader, etc.). */
export function getNeoTextStyles(): Record<string, TextStyle> {
  const f = activeFonts;

  return {
    pageTitle: {
      fontFamily: f.display,
      fontSize: 36,
      fontWeight: '400',
      lineHeight: 34,
      letterSpacing: -0.5,
      textTransform: 'uppercase',
      color: neo.onyx,
    },
    pageSubtitle: {
      fontFamily: f.sans,
      fontSize: 14,
      fontWeight: '500',
      color: neo.muted,
    },
    eyebrow: {
      fontFamily: f.sans,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 3,
      textTransform: 'uppercase',
      color: neo.muted,
    },
    sectionTitle: {
      fontFamily: f.display,
      fontSize: 22,
      fontWeight: '400',
      textTransform: 'uppercase',
      color: neo.onyx,
      marginBottom: 12,
    },
    body: {
      fontFamily: f.sans,
      fontSize: 16,
      fontWeight: '600',
      color: neo.onyx,
    },
    bodyMuted: {
      fontFamily: f.sans,
      fontSize: 14,
      fontWeight: '500',
      color: neo.muted,
    },
    label: {
      fontFamily: f.sans,
      fontSize: 14,
      fontWeight: '700',
      textTransform: 'uppercase',
      color: neo.onyx,
    },
    link: {
      fontFamily: f.sans,
      fontSize: 14,
      fontWeight: '700',
      color: neo.onyx,
      textDecorationLine: 'underline',
    },
    error: {
      fontFamily: f.sans,
      fontSize: 14,
      fontWeight: '600',
      color: neo.scarlet,
    },
    totalLabel: {
      fontFamily: f.sans,
      fontSize: 16,
      fontWeight: '800',
      textTransform: 'uppercase',
      color: neo.onyx,
    },
    totalValue: {
      fontFamily: f.display,
      fontSize: 24,
      color: neo.onyx,
    },
    mono: {
      fontFamily: 'monospace',
      fontSize: 20,
      fontWeight: '700',
      color: neo.onyx,
    },
  };
}

/** Layout presets aligned with web neo panels and page headers. */
export function getNeoLayoutStyles(): Record<string, ViewStyle> {
  return {
    screen: {
      flex: 1,
      backgroundColor: neo.bg,
    },
    content: {
      padding: 24,
    },
    contentPaddedBottom: {
      padding: 24,
      paddingBottom: 40,
    },
    pageHeader: {
      borderBottomWidth: 6,
      borderBottomColor: neo.onyx,
      paddingBottom: 16,
      marginBottom: 20,
    },
    pageHeaderCompact: {
      borderBottomWidth: 3,
      borderBottomColor: neo.onyx,
      paddingBottom: 16,
      marginBottom: 16,
    },
    totalRow: {
      borderTopWidth: 3,
      borderTopColor: neo.onyx,
      paddingTop: 12,
      marginTop: 8,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
  };
}
