// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
export type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  // Navigation
  'house.fill': 'home',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'app.grid': 'dashboard',
  // Actions
  'paperplane.fill': 'send',
  'plus': 'add',
  'minus': 'remove',
  'trash.fill': 'delete',
  'arrow.up': 'arrow-upward',
  'arrow.down': 'arrow-downward',
  'arrow.left.arrow.right': 'swap-horiz',
  // UI / Status
  'eye.fill': 'visibility',
  'eye.slash.fill': 'visibility-off',
  'gearshape.fill': 'settings',
  'sparkles': 'auto-awesome',
  'wifi.slash': 'wifi-off',
  'tray.fill': 'inbox',
  'clock.fill': 'schedule',
  'circle.fill': 'lens',
  // Charts
  'chart.bar.fill': 'bar-chart',
  'chart.pie.fill': 'pie-chart',
  'chart.pie': 'pie-chart',
  // Dev
  'chevron.left.forwardslash.chevron.right': 'code',
  // Category icons
  'fork.knife': 'restaurant',
  'car.fill': 'directions-car',
  'bag.fill': 'shopping-bag',
  'cross.fill': 'local-hospital',
  'gamecontroller.fill': 'sports-esports',
  'banknote.fill': 'payments',
  'laptopcomputer': 'laptop',
  'square.grid.2x2.fill': 'apps',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
