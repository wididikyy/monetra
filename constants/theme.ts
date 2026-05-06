import { Platform } from 'react-native';

export const AppColors = {
  primary: '#fd6f2b',
  primaryLight: '#ff8f56',
  primaryDark: '#e55a18',
  income: '#10B981',
  expense: '#EF4444',
  incomeLight: '#D1FAE5',
  expenseLight: '#FEE2E2',
  warning: '#F59E0B',
  info: '#3B82F6',
};

export const Theme = {
  text: '#11181C',
  subtext: '#6B7280',
  background: '#F9FAFB',
  card: '#FFFFFF',
  border: '#E5E7EB',
  tint: AppColors.primary,
  icon: '#687076',
  tabIconDefault: '#9CA3AF',
  tabIconSelected: AppColors.primary,
  skeleton: '#E5E7EB',
};

// Kept for backward compat with use-theme-color.ts / ThemedText / ThemedView
export const Colors = {
  light: Theme,
  dark: Theme,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
