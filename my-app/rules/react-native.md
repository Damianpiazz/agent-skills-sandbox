# React Native Conventions
## Componentes
- Functional components con TypeScript explícito en props
- Evitar any — definir interfaces
- Estilos con StyleSheet.create() fuera del componente
- Preferir composición sobre herencia
## Navegación (Expo Router)
- app/ es file-based routing
- (tabs)/ para grupos con tabs
- _layout.tsx para layouts compartidos
- usar useRouter(), useLocalSearchParams() de expo-router
- unstable_settings para anchor de tabs
## Tema
- Colores definidos en constants/theme.ts
- Esquema claro/oscuro vía useColorScheme()
- ThemeProvider de @react-navigation/native
- Componentes acceden al tema via useThemeColor()
## Plataforma
- Archivos .ios.tsx / .android.tsx / .web.tsx para código platform-specific
- Usar Platform.select() de react-native
- UI components en components/ui/ con variantes por plataforma
## Performance
- Preferir useMemo/useCallback en listas grandes
- Usar FlashList en vez de FlatList para listas largas
- react-native-reanimated para animaciones en UI thread
- Evitar re-renders innecesarios