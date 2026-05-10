---
name: tdd-workflow
description: Sigue Test-Driven Development: Red (escribe test que falla) → Green (implementación mínima) → Refactor (mejora código). Úsalo al iniciar cualquier nueva feature o bug fix en my-app o my-backend.
license: MIT
---

# TDD Workflow

Sigue el ciclo Red-Green-Refactor para todas las features.

## Ciclo TDD

### 1. RED — Escribe el test que falla

Antes de escribir cualquier implementación, escribe un test que describa el comportamiento esperado.

**Backend (Vitest):**
```typescript
// src/__tests__/habits/create-habit.test.ts
import { describe, it, expect } from "vitest";

describe("createHabit", () => {
  it("should create a habit with name and frequency", () => {
    // Arrange
    const input = { name: "Drink water", frequency: "daily" };
    // Act & Assert
    expect(createHabit(input)).toMatchObject({
      id: expect.any(String),
      name: "Drink water",
      frequency: "daily",
      streak: 0,
    });
  });
});
```

```bash
# Verificar que falla
npx vitest run
```

**Frontend (Testing Library):**
```typescript
// components/__tests__/habit-card.test.tsx
import { render, screen } from "@testing-library/react-native";
import HabitCard from "../habit-card";

describe("HabitCard", () => {
  it("should display habit name and streak", () => {
    render(<HabitCard name="Read" streak={5} />);
    expect(screen.getByText("Read")).toBeTruthy();
    expect(screen.getByText("5 days")).toBeTruthy();
  });
});
```

### 2. GREEN — Implementación mínima

Escribe el código mínimo necesario para que el test pase.

```typescript
function createHabit(input: { name: string; frequency: string }) {
  return {
    id: crypto.randomUUID(),
    name: input.name,
    frequency: input.frequency,
    streak: 0,
  };
}
```

```bash
# Verificar que pasa
npx vitest run
```

### 3. REFACTOR — Mejora sin cambiar comportamiento

Una vez que el test pasa, mejora el código:
- Extraer funciones duplicadas
- Mejorar nombres
- Agregar tipos
- Optimizar sin romper tests

```bash
# Verificar que sigue pasando
npx vitest run
```

## Estructura de tests

```
my-app/
├── components/
│   └── __tests__/
│       └── habit-card.test.tsx
└── hooks/
    └── __tests__/
        └── use-habits.test.ts

my-backend/
└── src/
    └── __tests__/
        ├── habits/
        ├── tasks/
        └── auth/
```

## Convenciones

- Archivos: `<nombre>.test.ts` o `<nombre>.test.tsx`
- Describir el comportamiento, no la implementación
- Un `describe` por función/módulo
- Un `it` por caso de uso
- Seguir AAA: Arrange, Act, Assert
- Tests deben ser deterministas (no depender de estado global)
