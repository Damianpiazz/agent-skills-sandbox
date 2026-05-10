---
name: shared-contracts
description: Define tipos y schemas compartidos entre my-app (frontend) y my-backend (backend) en shared/. Los cambios aquí requieren actualizar ambos proyectos. Úsalo cuando crees o modifiques tipos que cruzan frontend y backend.
license: MIT
---

# Shared Contracts

Tipos y schemas compartidos entre frontend y backend.

## Estructura

```
shared/
├── types/
│   ├── auth.ts          # LoginDTO, RegisterDTO, Session
│   ├── habit.ts         # Habit, CreateHabitDTO, Streak
│   ├── task.ts          # Task, CreateTaskDTO, Priority
│   └── user.ts          # User, Profile, Preferences
└── index.ts             # Re-export
```

## Reglas

1. **Los tipos en `shared/` son la fuente de verdad** — frontend y backend los importan
2. **Nunca duplicar un tipo** — si existe en `shared/`, úsalo desde ahí
3. **DTOs de entrada/salida van en shared** — CreateUserDTO, LoginResponse, etc.
4. **Backend importa**: `import type { User } from "../../shared/types/user.js"`
5. **Frontend importa**: `import type { User } from "@/shared/types/user"`
6. **Al cambiar shared/**, correr tests en ambos proyectos

## Cómo usar en cada proyecto

### Backend (TypeScript con ESM)

```typescript
// Importar con extensión .js (ESM)
import type { User, CreateUserDTO } from "../../shared/types/user.js";
import type { Habit, CreateHabitDTO } from "../../shared/types/habit.js";
```

### Frontend (React Native con path alias @/)

```typescript
// Importar sin extensión (Metro lo resuelve)
import type { User, CreateUserDTO } from "@/shared/types/user";
import type { Habit, CreateHabitDTO } from "@/shared/types/habit";
```
