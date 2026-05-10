---
name: express-sqlite-setup
description: Configura SQLite con better-sqlite3 en Express + TypeScript incluyendo conexión singleton, esquemas, migraciones y helper queries. Úsalo cuando inicies un nuevo proyecto backend con SQLite o necesites agregar base de datos a un Express existente.
license: MIT
---

# Express + SQLite Setup

Configuración de SQLite con better-sqlite3 para Express + TypeScript (ESM).

## Instalación

```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

## Estructura de archivos

```
src/
└── db/
    ├── connection.ts      # Conexión singleton
    ├── migrations/
    │   └── 001_init.ts    # Migraciones versionadas
    └── index.ts           # Re-export
```

## 1. Conexión Singleton

```typescript
// src/db/connection.ts
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "../../data/app.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
```

## 2. Migraciones

```typescript
// src/db/migrations/001_init.ts
import Database from "better-sqlite3";

export function up(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.prepare("INSERT OR IGNORE INTO _migrations (name) VALUES (?)").run(
    "001_init"
  );
}

export function down(db: Database.Database): void {
  db.exec(`
    DROP TABLE IF EXISTS users;
    DELETE FROM _migrations WHERE name = '001_init';
  `);
}
```

## 3. Runner de migraciones

```typescript
// src/db/migrate.ts
import { getDb } from "./connection.js";
import { up as initUp } from "./migrations/001_init.js";

const migrations = [{ name: "001_init", up: initUp }];

export function runMigrations(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT DEFAULT (datetime('now'))
    )
  `);

  const applied = new Set(
    db
      .prepare("SELECT name FROM _migrations")
      .all()
      .map((r: any) => r.name)
  );

  for (const m of migrations) {
    if (!applied.has(m.name)) {
      console.log(`Running migration: ${m.name}`);
      m.up(db);
    }
  }
}
```

## 4. Uso en Express

```typescript
// src/app.ts
import express from "express";
import { getDb, closeDb } from "./db/connection.js";
import { runMigrations } from "./db/migrate.js";

const app = express();
app.use(express.json());

// Inicializar DB al arrancar
runMigrations();

// Ejemplo: ruta que usa SQLite
app.get("/users", (req, res) => {
  const db = getDb();
  const users = db.prepare("SELECT id, name, email FROM users").all();
  res.json({ success: true, data: users });
});

app.post("/users", (req, res) => {
  const { name, email } = req.body;
  const db = getDb();
  const stmt = db.prepare(
    "INSERT INTO users (id, name, email) VALUES (?, ?, ?)"
  );
  const id = crypto.randomUUID();
  stmt.run(id, name, email);
  res.status(201).json({ success: true, data: { id, name, email } });
});

// Cleanup al cerrar
process.on("SIGINT", () => {
  closeDb();
  process.exit(0);
});
```

## Buenas prácticas

- Usar consultas parametrizadas (previene SQL injection)
- Migraciones versionadas con timestamp
- WAL mode para mejor rendimiento en lecturas concurrentes
- Foreign keys ON siempre
- Cerrar conexión en shutdown graceful
- Datos en `data/` (gitignorear)
