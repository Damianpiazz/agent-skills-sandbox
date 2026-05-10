# my-app — React Native / Expo
- Expo 54 + React Native 0.81 + TypeScript ~5.9
- Expo Router con file-based routing en app/
- Tabs en app/(tabs)/ con layouts anidados
- Modal en app/modal.tsx
- Sin Nativewind ni Tamagui — usar StyleSheet.create()
- Tema: light/dark vía @react-navigation/native + constants/theme.ts
- Iconos: @expo/vector-icons + componentes platform-specific en components/ui/
  (icon-symbol.ios.tsx para iOS, icon-symbol.tsx para resto)
- Hooks globales en hooks/: useColorScheme, useThemeColor
- Animaciones: react-native-reanimated
- Gestos: react-native-gesture-handler
- Path alias: @/ → ./
- Lint: npm run lint (expo lint)
- No usar react-native-worklets-core directamente