---
name: express-db-migration
description: Crea y ejecuta migraciones SQLite versionadas con up/down, runner automático al iniciar la app, y CLI para gestionar migraciones. Úsalo cuando necesites modificar el esquema de la base de datos en my-backend.
license: MIT
---

# Express DB Migration

Guía para manejar migraciones SQLite con better-sqlite3 en my-backend.

## Estructura

```
src/db/
├── connection.ts              # Conexión singleton
├── migrate.ts                 # Runner de migraciones
├── migrations/
│   ├── 001_create_users.ts
│   ├── 002_create_posts.ts
│   └── 003_add_status_to_users.ts
└── index.ts                   # Re-export
```

## 1. Migración simple

```typescript
// src/db/migrations/001_create_users.ts
import Database from "better-sqlite3";

export function up(db: Database.Database): void {
  db.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX idx_users_email ON users(email);
    CREATE INDEX idx_users_status ON users(status);
  `);
}

export function down(db: Database.Database): void {
  db.exec(`DROP TABLE IF EXISTS users`);
}
```

## 2. Migración con alter table

```typescript
// src/db/migrations/002_add_bio_to_users.ts
import Database from "better-sqlite3";

export function up(db: Database.Database): void {
  db.exec(`
    ALTER TABLE users ADD COLUMN bio TEXT DEFAULT '';
  `);
}

export function down(db: Database.Database): void {
  // SQLite no soporta DROP COLUMN directamente
  // Se debe recrear la tabla
  db.exec(`
    CREATE TABLE users_new (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    INSERT INTO users_new SELECT id, name, email, status, created_at, updated_at FROM users;

    DROP TABLE users;
    ALTER TABLE users_new RENAME TO users;
  `);
}
```

## 3. Migración con seed data

```typescript
// src/db/migrations/003_seed_admin.ts
import Database from "better-sqlite3";
import crypto from "crypto";

export function up(db: Database.Database): void {
  const adminId = crypto.randomUUID();
  db.prepare(`
    INSERT OR IGNORE INTO users (id, name, email, status)
    VALUES (?, 'Admin', 'admin@example.com', 'active')
  `).run(adminId);
}

export function down(db: Database.Database): void {
  db.prepare("DELETE FROM users WHERE email = ?").run("admin@example.com");
}
```

## 4. Runner de migraciones

```typescript
// src/db/migrate.ts
import Database from "better-sqlite3";
import { getDb } from "./connection.js";

// Importar migraciones
import { up as m001_up, down as m001_down } from "./migrations/001_create_users.js";
import { up as m002_up, down as m002_down } from "./migrations/002_add_bio_to_users.js";
import { up as m003_up, down as m003_down } from "./migrations/003_seed_admin.js";

interface Migration {
  id: string;
  name: string;
  up: (db: Database.Database) => void;
  down: (db: Database.Database) => void;
}

const migrations: Migration[] = [
  { id: "001", name: "001_create_users", up: m001_up, down: m001_down },
  { id: "002", name: "002_add_bio_to_users", up: m002_up, down: m002_down },
  { id: "003", name: "003_seed_admin", up: m003_up, down: m003_down },
];

export function runMigrations(): void {
  const db = getDb();

  // Crear tabla de control si no existe
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Obtener migraciones ya aplicadas
  const applied = new Set(
    db.prepare("SELECT id FROM _migrations").all().map((r: any) => r.id)
  );

  // Aplicar pendientes en orden
  for (const m of migrations) {
    if (!applied.has(m.id)) {
      console.log(`[migrate] Running ${m.name}...`);
      m.up(db);
      db.prepare("INSERT INTO _migrations (id, name) VALUES (?, ?)").run(m.id, m.name);
      console.log(`[migrate] ${m.name} applied`);
    }
  }
}

export function rollbackLast(): void {
  const db = getDb();
  const last = db.prepare("SELECT * FROM _migrations ORDER BY applied_at DESC LIMIT 1").get() as any;

  if (!last) {
    console.log("[migrate] No migrations to rollback");
    return;
  }

  const migration = migrations.find((m) => m.id === last.id);
  if (!migration) {
    console.log(`[migrate] Migration ${last.id} not found in code`);
    return;
  }

  console.log(`[migrate] Rolling back ${migration.name}...`);
  migration.down(db);
  db.prepare("DELETE FROM _migrations WHERE id = ?").run(migration.id);
  console.log(`[migrate] ${migration.name} rolled back`);
}

export function migrationStatus(): void {
  const db = getDb();

  const applied = new Map(
    (db.prepare("SELECT id, name, applied_at FROM _migrations ORDER BY applied_at").all() as any[]).map(
      (r) => [r.id, r]
    )
  );

  console.log("\nMigration Status:");
  console.log("─".repeat(60));

  for (const m of migrations) {
    const a = applied.get(m.id);
    const status = a ? "✓ APPLIED" : "○ PENDING";
    const time = a ? ` (${a.applied_at})` : "";
    console.log(`  ${status}  ${m.name}${time}`);
  }

  console.log("─".repeat(60));
}
```

## 5. Script CLI para migraciones

```typescript
// src/db/cli.ts
// Ejecutar con: npx tsx src/db/cli.ts migrate|rollback|status

import { runMigrations, rollbackLast, migrationStatus } from "./migrate.js";
import { closeDb } from "./connection.js";

const command = process.argv[2];

async function main() {
  switch (command) {
    case "migrate":
      runMigrations();
      console.log("Migrations complete");
      break;
    case "rollback":
      rollbackLast();
      break;
    case "status":
      migrationStatus();
      break;
    default:
      console.log("Usage: npx tsx src/db/cli.ts [migrate|rollback|status]");
  }
  closeDb();
}

main().catch(console.error);
```

Agregar al `package.json`:
```json
{
  "scripts": {
    "db:migrate": "tsx src/db/cli.ts migrate",
    "db:rollback": "tsx src/db/cli.ts rollback",
    "db:status": "tsx src/db/cli.ts status"
  }
}
```

## 6. Auto-migrar al iniciar la app

```typescript
// src/app.ts
import { runMigrations } from "./db/migrate.js";

runMigrations(); // <-- al inicio, antes de los routers

const app = express();
// ...
```

## Buenas prácticas

- Migraciones versionadas con número secuencial (`001_`, `002_`)
- Nunca modificar migraciones ya aplicadas — crear una nueva
- `up()` y `down()` como funciones separadas
- La tabla `_migrations` lleva el registro
- Migrations idempotentes (usar `IF NOT EXISTS`, `OR IGNORE`)
- En SQLite, `ALTER TABLE DROP COLUMN` requiere recrear la tabla
- Commits de migraciones atómicos (SQLite lo garantiza por ser embebido)
