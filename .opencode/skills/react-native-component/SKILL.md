---
name: react-native-component
description: Crea componentes reutilizables en React Native con TypeScript, StyleSheet, y soporte para tema claro/oscuro. Úsalo cuando necesites crear un nuevo componente en components/ de my-app.
license: MIT
---

# React Native Component

Guía para crear componentes reutilizables en my-app.

## Estructura

```
components/
├── ui/                          # Componentes base de UI
│   ├── collapsible.tsx
│   ├── icon-symbol.tsx
│   └── icon-symbol.ios.tsx
├── external-link.tsx
├── haptic-tab.tsx
├── hello-wave.tsx
├── parallax-scroll-view.tsx
├── themed-text.tsx
└── themed-view.tsx
```

## 1. Componente funcional básico

```typescript
// components/avatar.tsx
import { View, Text, Image, StyleSheet } from "react-native";

interface AvatarProps {
  uri: string;
  name: string;
  size?: number;
}

export default function Avatar({ uri, name, size = 48 }: AvatarProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image source={{ uri }} style={styles.image} />
      <Text style={styles.initials}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 9999,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e0e0e0",
  },
  image: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  initials: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
  },
});
```

## 2. Componente con tema claro/oscuro

```typescript
// components/card.tsx
import { View, Text, StyleSheet } from "react-native";
import { useThemeColor } from "@/hooks/use-theme-color";

interface CardProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export default function Card({ title, description, children }: CardProps) {
  const background = useThemeColor("background");
  const text = useThemeColor("text");

  return (
    <View style={[styles.card, { backgroundColor: background }]}>
      <Text style={[styles.title, { color: text }]}>{title}</Text>
      {description && (
        <Text style={[styles.description, { color: text }]}>
          {description}
        </Text>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    opacity: 0.7,
  },
});
```

## 3. Componente platform-specific

```typescript
// components/picker.tsx
import { Platform } from "react-native";

// iOS: usar Picker nativo
// Android/web: alternativa

const Picker = Platform.select({
  ios: () => require("./picker.ios").default,
  android: () => require("./picker.android").default,
  default: () => require("./picker.web").default,
})();
```

O archivos separados:
- `components/icon-symbol.ios.tsx` — solo iOS
- `components/icon-symbol.tsx` — Android y web

## 4. Componente con forwardRef

```typescript
// components/input.tsx
import {
  forwardRef,
  TextInput,
  TextInputProps,
  StyleSheet,
} from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
}

const Input = forwardRef<TextInput, InputProps>(
  ({ label, style, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        style={[styles.input, style]}
        placeholder={label}
        placeholderTextColor="#999"
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export default Input;

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
});
```

## Convenciones

- Props tipadas con interface (nunca `any`)
- Un componente por archivo
- Export default
- StyleSheet.create() fuera del componente
- Usar `useThemeColor()` para colores del tema
- Nombres en kebab-case para archivos
- Archivos `.ios.tsx` / `.android.tsx` para código platform-specific
