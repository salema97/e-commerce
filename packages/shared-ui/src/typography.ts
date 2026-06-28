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
      lineHeight: 40,
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

/** Shared spacing scale for mobile + web neo layouts. */
export const neoSpacing = {
  screen: 24,
  section: 16,
  item: 12,
  tabBarClearance: 120,
  stickyFooterClearance: 200,
  detailFooterClearance: 180,
} as const;

/** Layout presets aligned with web neo panels and page headers. */
export function getNeoLayoutStyles(): Record<string, ViewStyle> {
  return {
    screen: {
      flex: 1,
      backgroundColor: neo.bg,
    },
    content: {
      padding: neoSpacing.screen,
    },
    contentPaddedBottom: {
      padding: neoSpacing.screen,
      paddingBottom: 40,
    },
    pageHeader: {
      borderBottomWidth: 6,
      borderBottomColor: neo.onyx,
      paddingBottom: neoSpacing.section,
      marginBottom: 20,
    },
    pageHeaderCompact: {
      borderBottomWidth: 3,
      borderBottomColor: neo.onyx,
      paddingBottom: neoSpacing.section,
      marginBottom: neoSpacing.section,
    },
    /** Header inside a padded ScrollView / list (no extra horizontal inset). */
    pageHeaderInList: {
      marginBottom: 0,
    },
    /** Standard inset for NeoPageHeader above a FlatList (outside scroll body). */
    pageHeaderInset: {
      paddingHorizontal: neoSpacing.screen,
      paddingTop: 12,
      marginBottom: 0,
    },
    /** FlatList / grid body on tab screens (clears tab bar). */
    listContent: {
      padding: neoSpacing.screen,
      paddingBottom: neoSpacing.tabBarClearance,
    },
    /** FlatList body when a sticky footer sits above the tab bar. */
    listContentWithFooter: {
      padding: neoSpacing.screen,
      paddingBottom: neoSpacing.stickyFooterClearance,
    },
    /** Product detail and similar scroll + sticky footer. */
    detailContent: {
      padding: neoSpacing.screen,
      paddingBottom: neoSpacing.detailFooterClearance,
    },
    screenInset: {
      paddingHorizontal: neoSpacing.screen,
    },
    horizontalInset: {
      paddingHorizontal: neoSpacing.screen,
      paddingBottom: 8,
      gap: 8,
    },
    section: {
      marginBottom: neoSpacing.section,
    },
    stackSection: {
      marginTop: 20,
    },
    actionsStack: {
      gap: neoSpacing.item,
      marginBottom: 20,
    },
    stickyFooter: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: neoSpacing.screen,
      backgroundColor: neo.bg,
      borderTopWidth: 3,
      borderTopColor: neo.onyx,
      gap: neoSpacing.item,
    },
    productGridRow: {
      justifyContent: 'space-between',
      marginBottom: neoSpacing.item,
      gap: neoSpacing.item,
    },
    productGridItem: {
      flex: 1,
      maxWidth: '48%',
    },
    totalRow: {
      borderTopWidth: 3,
      borderTopColor: neo.onyx,
      paddingTop: neoSpacing.item,
      marginTop: 8,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: neoSpacing.screen,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: neoSpacing.screen,
    },
  };
}
