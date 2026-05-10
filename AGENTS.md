# agent-skills-sandbox — Monorepo

Este repositorio contiene dos proyectos independientes:

## my-app/
Aplicación React Native con Expo Router.
- Package manager: npm
- Stack: Expo 54, React Native 0.81, Expo Router, TypeScript
- Comandos: `npm start`, `npm run ios`, `npm run android`, `npm run lint`
- Path alias: `@/` → `./`
- Reglas específicas en `my-app/AGENTS.md` y `my-app/rules/react-native.md`

## my-backend/
API REST con Express + TypeScript + SQLite.
- Package manager: npm
- Stack: Express 5, TypeScript 6, ESM (NodeNext)
- Comandos: `npm run dev`, `npm run build`
- Reglas específicas en `my-backend/AGENTS.md` y `my-backend/rules/express-api.md`

Reglas:
1. Identifica siempre en qué proyecto estás trabajando antes de actuar
2. Lee el AGENTS.md del proyecto correspondiente al iniciar una tarea
3. Usa Tab para cambiar entre agentes rn-dev, backend-dev, plan y build
4. Verifica comandos antes de ejecutarlos (npm run dev, build, lint)
