---
name: express-api-route
description: Crea rutas REST en Express + TypeSig con Router, handlers asíncronos, validación Zod, y estructura Controller-Route. Úsalo cuando necesites crear un nuevo endpoint o grupo de rutas en my-backend.
license: MIT
---

# Express API Route

Guía para crear rutas REST en Express + TypeScript (ESM) en my-backend.

## Estructura de archivos

```
src/
├── routes/
│   ├── users.ts
│   └── index.ts          # Agregador de rutas
├── controllers/
│   └── user.controller.ts
├── middleware/
│   ├── auth.ts
│   └── validate.ts
├── types/
│   └── user.types.ts
└── app.ts                # Entry point
```

## 1. Ruta básica

```typescript
// src/routes/health.ts
import { Router, Request, Response } from "express";

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.json({ success: true, message: "OK", timestamp: new Date().toISOString() });
});

export default router;
```

Registrar en `app.ts`:
```typescript
import healthRouter from "./routes/health.js";
app.use("/api", healthRouter);
```

## 2. CRUD completo con Controller

**Types:**
```typescript
// src/types/user.types.ts
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface CreateUserDTO {
  name: string;
  email: string;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
}
```

**Controller:**
```typescript
// src/controllers/user.controller.ts
import { Request, Response, NextFunction } from "express";
import { getDb } from "../db/connection.js";
import { CreateUserDTO, UpdateUserDTO } from "../types/user.types.js";

export class UserController {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const db = getDb();
      const users = db.prepare("SELECT id, name, email, created_at FROM users").all();
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const db = getDb();
      const user = db.prepare("SELECT id, name, email, created_at FROM users WHERE id = ?").get(req.params.id);
      if (!user) {
        res.status(404).json({ success: false, error: "User not found" });
        return;
      }
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email } = req.body as CreateUserDTO;
      const db = getDb();
      const id = crypto.randomUUID();
      db.prepare("INSERT INTO users (id, name, email) VALUES (?, ?, ?)").run(id, name, email);
      res.status(201).json({ success: true, data: { id, name, email } });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email } = req.body as UpdateUserDTO;
      const db = getDb();
      const result = db.prepare("UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?").run(name ?? null, email ?? null, req.params.id);
      if (result.changes === 0) {
        res.status(404).json({ success: false, error: "User not found" });
        return;
      }
      const user = db.prepare("SELECT id, name, email, created_at FROM users WHERE id = ?").get(req.params.id);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const db = getDb();
      const result = db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
      if (result.changes === 0) {
        res.status(404).json({ success: false, error: "User not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
```

**Router:**
```typescript
// src/routes/users.ts
import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";

const router = Router();
const controller = new UserController();

router.get("/", controller.list.bind(controller));
router.get("/:id", controller.getById.bind(controller));
router.post("/", controller.create.bind(controller));
router.patch("/:id", controller.update.bind(controller));
router.delete("/:id", controller.remove.bind(controller));

export default router;
```

**Registrar:**
```typescript
// src/routes/index.ts
import { Router } from "express";
import userRouter from "./users.js";
import healthRouter from "./health.js";

const router = Router();
router.use("/users", userRouter);
router.use(healthRouter);

export default router;
```

```typescript
// src/app.ts
import router from "./routes/index.js";
app.use("/api", router);
```

## 3. Validación con Zod

```typescript
// src/middleware/validate.ts
import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: result.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
```

```typescript
// src/routes/users.ts (con validación)
import { z } from "zod";
import { validate } from "../middleware/validate.js";

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});

router.post("/", validate(createUserSchema), controller.create.bind(controller));
```

## 4. Middleware de autenticación

```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || token !== process.env.API_TOKEN) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }
  next();
}
```

```typescript
router.use(requireAuth); // Aplica a todas las rutas del router
// o por ruta:
router.post("/", requireAuth, validate(createUserSchema), controller.create.bind(controller));
```

## 5. Manejo de errores global

```typescript
// middleware/error-handler.ts (ya agregar en app.ts)
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: err.message || "Internal server error" });
});
```

## Convenciones

- Handlers asíncronos con try/catch y next(error)
- Respuestas consistentes: `{ success: true, data }` o `{ success: false, error }`
- Códigos HTTP correctos: 200, 201, 204, 400, 401, 404, 500
- Router separado del controller
- Validación en middleware, no en el controller
- Un archivo por recurso en routes/
- Importar con extensión `.js` (ESM)
