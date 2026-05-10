# Express API Conventions
## Rutas
- Router de Express para agrupar endpoints
- Handlers asíncronos (async/await) con try/catch
- Middleware de errores global al final de la cadena
- NO usar callbacks — promesas o async/await
## Respuestas JSON
Formato consistente:
  { success: true, data: ... }          → éxito
  { success: false, error: "mensaje" }  → error
- Códigos HTTP correctos (200, 201, 400, 404, 500)
- Errores de validación: 400 con mensaje descriptivo
## Estructura de archivos (futura)
- src/routes/ — definición de rutas
- src/controllers/ — lógica de handlers
- src/models/ — tipos e interfaces
- src/db/ — conexión, esquemas, migraciones
- src/middleware/ — middleware personalizado
- src/utils/ — utilidades
## SQLite
- Conexión en src/db/connection.ts (singleton)
- Migraciones en src/db/migrations/ con timestamp
- Consultas parametrizadas (evitar SQL injection)
- Tabla _migrations para tracking
## ESM
- type: "module" en package.json
- import con extensión .js en archivos .ts (tsx lo resuelve)
- No usar __dirname — usar:
    import { fileURLToPath } from 'url'
    const __filename = fileURLToPath(import.meta.url)