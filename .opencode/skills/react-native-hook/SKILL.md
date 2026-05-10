---
name: react-native-hook
description: Crea custom hooks en React Native con TypeScript, incluyendo hooks de estado, efectos, almacenamiento local, y conexiones a API. Úsalo cuando necesites extraer lógica reusable en hooks/ de my-app.
license: MIT
---

# React Native Hook

Guía para crear custom hooks en my-app.

## Estructura

```
hooks/
├── use-color-scheme.ts        # Hook existente: tema del dispositivo
├── use-color-scheme.web.ts    # Variante web
└── use-theme-color.ts         # Hook existente: colores del tema
```

## 1. Hook básico

```typescript
// hooks/use-toggle.ts
import { useState, useCallback } from "react";

export function useToggle(initial = false) {
  const [value, setValue] = useState(initial);

  const toggle = useCallback(() => setValue((v) => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return { value, toggle, setTrue, setFalse };
}
```

Uso:
```typescript
const { value, toggle } = useToggle();
```

## 2. Hook con almacenamiento local

```typescript
// hooks/use-storage.ts
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(key).then((stored) => {
      if (stored) setValue(JSON.parse(stored));
      setLoaded(true);
    });
  }, [key]);

  const update = async (newValue: T) => {
    setValue(newValue);
    await AsyncStorage.setItem(key, JSON.stringify(newValue));
  };

  return { value, update, loaded };
}
```

## 3. Hook de API

```typescript
// hooks/use-fetch.ts
import { useState, useEffect, useCallback } from "react";

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useFetch<T>(url: string) {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(url);
      const json = await res.json();
      setState({ data: json, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : "Error",
      });
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}
```

## 4. Hook con debounce

```typescript
// hooks/use-debounce.ts
import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
```

Uso típico:
```typescript
const [search, setSearch] = useState("");
const debouncedSearch = useDebounce(search, 500);

useEffect(() => {
  // llamar API con debouncedSearch
}, [debouncedSearch]);
```

## 5. Hook de permisos (ejemplo con cámara)

```typescript
// hooks/use-camera-permission.ts
import { useState, useEffect } from "react";
import { Camera } from "expo-camera";

export function useCameraPermission() {
  const [permission, requestPermission] = Camera.useCameraPermissions();

  const granted = permission?.granted ?? false;

  return {
    granted,
    request: requestPermission,
  };
}
```

## Convenciones

- Prefijo `use` obligatorio
- Tipar parámetros y retorno con TypeScript
- Un hook por archivo
- Nombre del archivo en kebab-case: `use-debounce.ts`
- Tests en `hooks/__tests__/use-debounce.test.ts`
- Dependencias correctas en useEffect/useCallback
- Estado loading/error/data para operaciones async
