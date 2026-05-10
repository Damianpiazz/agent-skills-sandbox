---
name: react-native-screen
description: Crea pantallas con Expo Router siguiendo file-based routing, incluyendo layouts, navegación entre tabs, modales, y paso de parámetros. Úsalo cuando necesites crear una nueva pantalla o ruta en my-app.
license: MIT
---

# React Native Screen — Expo Router

Guía para crear pantallas con Expo Router (file-based routing) en my-app.

## Estructura de routing

```
app/
├── _layout.tsx           # Layout raíz (Stack principal)
├── (tabs)/
│   ├── _layout.tsx       # Layout de tabs
│   ├── index.tsx         → /
│   └── explore.tsx       → /explore
└── modal.tsx             → /modal (presentación modal)
```

## 1. Pantalla básica

```typescript
// app/profile.tsx
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
});
```

## 2. Pantalla con parámetros de ruta

```typescript
// app/user/[id].tsx
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Usuario: {id}</Text>
    </View>
  );
}
```

Navegar a ella:
```typescript
router.push(`/user/${userId}`);
// o con query params:
router.push({ pathname: "/user/[id]", params: { id: "123" } });
```

## 3. Pantalla con tabs

Agregar un nuevo tab en `(tabs)/_layout.tsx`:
```typescript
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function TabLayout() {
  const tint = useThemeColor("tint");

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: tint }}>
      <Tabs.Screen
        name="index"
        options={{ title: "Inicio", tabBarIcon: ({ color }) => (
          <Ionicons name="home" size={24} color={color} />
        )}}
      />
      <Tabs.Screen
        name="explore"
        options={{ title: "Explorar", tabBarIcon: ({ color }) => (
          <Ionicons name="search" size={24} color={color} />
        )}}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Perfil", tabBarIcon: ({ color }) => (
          <Ionicons name="person" size={24} color={color} />
        )}}
      />
    </Tabs>
  );
}
```

## 4. Pantalla modal

```typescript
// app/settings-modal.tsx
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function SettingsModal() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configuración</Text>
    </View>
  );
}
```

Registrarla en `app/_layout.tsx`:
```typescript
<Stack.Screen
  name="settings-modal"
  options={{ presentation: "modal", title: "Configuración" }}
/>
```

## Convenciones

- Nombres en kebab-case para archivos de ruta
- Componente exportado como `default`
- Layouts en `_layout.tsx` con `Stack`, `Tabs`, o `Drawer`
- Parámetros dinámicos con `[param]`
- Grupos de rutas con `(grupo)` para organización sin afectar la URL
