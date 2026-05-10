# agent-skills-sandbox

Monorepo de aprendizaje y experimentación con [opencode](https://opencode.ai), agentes especializados y skills reutilizables para desarrollo de una app React Native (Expo) y una API REST (Express + TypeScript + SQLite).

---

## Estructura del proyecto

```
agent-skills-sandbox/
├── .opencode/                    # Configuración de opencode
│   ├── agents/                   # Definiciones de agentes especializados
│   │   ├── rn-dev.md             # Agente frontend React Native
│   │   └── backend-dev.md        # Agente backend Express
│   └── skills/                   # Skills reutilizables (20 skills)
│       ├── tdd-workflow/
│       ├── react-native-component/
│       ├── react-native-screen/
│       ├── react-native-hook/
│       ├── express-api-route/
│       ├── express-db-migration/
│       ├── express-sqlite-setup/
│       └── ...
├── shared/                       # Tipos compartidos frontend/backend
│   └── types/
├── my-app/                       # React Native + Expo Router
│   ├── app/                      # File-based routing (Expo Router)
│   ├── components/               # Componentes reutilizables
│   ├── hooks/                    # Custom hooks
│   ├── constants/                # Tema, colores, config
│   └── AGENTS.md                 # Instrucciones para el agente rn-dev
├── my-backend/                   # Express + TypeScript + SQLite
│   ├── src/
│   │   ├── app.ts                # Entry point
│   │   ├── routes/               # Rutas Express
│   │   ├── controllers/          # Handlers
│   │   ├── db/                   # Conexión y migraciones SQLite
│   │   ├── middleware/           # Middleware personalizado
│   │   └── models/               # Tipos e interfaces
│   └── AGENTS.md                 # Instrucciones para el agente backend-dev
├── AGENTS.md                     # Reglas globales del monorepo
└── README.md                     # Este archivo
```

---

## Agentes (`.opencode/agents/`)

Los agentes son asistentes de IA especializados con roles y restricciones definidas. Cada agente tiene acceso exclusivo a su proyecto y sigue reglas específicas.

| Agente        | Archivo                        | Proyecto      | Stack                                |
|---------------|--------------------------------|---------------|--------------------------------------|
| `rn-dev`      | `.opencode/agents/rn-dev.md`   | `my-app/`     | Expo 54, RN 0.81, Expo Router, TS    |
| `backend-dev` | `.opencode/agents/backend-dev.md` | `my-backend/` | Express 5, TypeScript 6, SQLite (ESM) |

**Uso:** Cambia entre agentes con `Tab` en opencode. Cada agente solo modifica archivos dentro de su directorio asignado.

### rn-dev
- File-based routing con Expo Router en `app/`
- `StyleSheet.create()` para estilos (sin Nativewind/Tamagui)
- Tema claro/oscuro vía `useThemeColor()` desde `constants/theme.ts`
- Componentes platform-specific con sufijo `.ios.tsx` / `.tsx`
- Animaciones con `react-native-reanimated`
- Iconos con `@expo/vector-icons`
- Path alias `@/` → `./`

### backend-dev
- Módulos ESM (`import` con extensión `.js`)
- Rutas asíncronas con `try/catch` y `next(error)`
- Respuestas JSON consistentes: `{ success, data }` o `{ success, error }`
- Validación con Zod
- Consultas SQL parametrizadas
- Sin `__dirname` — usar `import.meta.url`

---

## Skills (`.opencode/skills/`)

Los skills son instrucciones reutilizables que se cargan bajo demanda para tareas específicas. Se invocan con `skill <nombre>` en opencode.

### Skills para my-app (frontend)

| Skill                    | Descripción                                              |
|--------------------------|----------------------------------------------------------|
| `react-native-component` | Crear componentes reutilizables con TypeScript + tema    |
| `react-native-screen`    | Crear pantallas con Expo Router (file-based routing)     |
| `react-native-hook`      | Crear custom hooks con estado, efectos, API              |
| `react-native-best-practices` | Optimización de rendimiento (FPS, memoria, re-renders) |

### Skills para my-backend (backend)

| Skill                    | Descripción                                              |
|--------------------------|----------------------------------------------------------|
| `express-api-route`      | Crear rutas REST con Router + Zod + Controller-Route     |
| `express-db-migration`   | Migraciones SQLite versionadas con up/down               |
| `express-sqlite-setup`   | Configurar SQLite con better-sqlite3 (singleton, esquemas)|

### Skills transversales

| Skill                    | Descripción                                              |
|--------------------------|----------------------------------------------------------|
| `tdd-workflow`           | Ciclo Red-Green-Refactor para TDD                        |
| `shared-contracts`       | Tipos y schemas compartidos frontend/backend             |
| `git-release`            | Crear releases y changelogs con versionado semver        |
| `github`                 | PRs, code review, branching strategies                   |
| `github-actions`         | CI/CD builds para iOS simulator y Android emulator       |
| `api-design-principles`  | Principios de diseño REST/GraphQL                        |
| `typescript-advanced-types` | Tipos avanzados (genéricos, condicionales, mapeados)  |
| `javascript-testing-patterns` | Testing con Jest, Vitest, Testing Library           |
| `modern-javascript-patterns` | ES6+, async/await, patrones funcionales              |
| `nodejs-backend-patterns` | Patrones Express/Fastify, middleware, auth, DB           |
| `sql-optimization-patterns` | Optimización de queries, índices, EXPLAIN             |
| `upgrading-react-native` | Actualización de RN versión (rn-diff-purge)              |
| `react-native-brownfield-migration` | Migración incremental de apps nativas a RN/Expo |

**Uso:** Cuando inicies una tarea que coincida con un skill, opencode lo carga automáticamente. También puedes cargarlo manualmente.

---

## Reglas globales (`AGENTS.md`)

El archivo `AGENTS.md` raíz define reglas que aplican a ambos proyectos:

1. Identifica siempre en qué proyecto estás trabajando antes de actuar
2. Lee el `AGENTS.md` del proyecto correspondiente al iniciar una tarea
3. Usa `Tab` para cambiar entre agentes `rn-dev`, `backend-dev`, `plan` y `build`
4. Verifica comandos antes de ejecutarlos (`npm run dev`, `build`, `lint`)

Cada proyecto tiene su propio `AGENTS.md` con reglas específicas, y un archivo de reglas en `rules/`:

- `my-app/AGENTS.md` + `my-app/rules/react-native.md`
- `my-backend/AGENTS.md` + `my-backend/rules/express-api.md`

---

## Tipos compartidos (`shared/`)

El directorio `shared/types/` contiene tipos y schemas que cruzan frontend y backend:

- En `my-app/`: importar como `@/shared/types/...`
- En `my-backend/`: importar como `../../shared/types/...`

Al modificar tipos compartidos, se debe cargar el skill `shared-contracts` y actualizar ambos proyectos.

---

## Comandos principales

### my-app
| Comando            | Descripción                    |
|--------------------|--------------------------------|
| `npm start`        | Iniciar Expo dev server        |
| `npm run ios`      | Abrir en iOS simulator         |
| `npm run android`  | Abrir en Android emulator      |
| `npm run lint`     | Ejecutar linter (expo lint)    |

### my-backend
| Comando            | Descripción                    |
|--------------------|--------------------------------|
| `npm run dev`      | Iniciar en modo desarrollo (tsx watch) |
| `npm run build`    | Compilar TypeScript a dist/    |

---

## Flujo de trabajo recomendado

1. **Planificar** — Usa el agente `plan` para diseñar la solución
2. **Cargar skill** — Invoca el skill correspondiente (`tdd-workflow`, `react-native-component`, etc.)
3. **Implementar** — Cambia al agente adecuado (`rn-dev` o `backend-dev`) con `Tab`
4. **Testear** — Sigue TDD: escribe test → implementa → refactoriza
5. **Verificar** — Ejecuta `npm run lint` y `npm run build` según corresponda
6. **Release** — Usa el skill `git-release` para versionar y publicar
