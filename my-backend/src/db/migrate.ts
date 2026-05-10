import Database from "better-sqlite3"
import { getDb } from "./connection.js"

interface Migration {
  name: string
  up: (db: Database.Database) => void
  down: (db: Database.Database) => void
}

const migrations: Migration[] = []

async function loadMigrations(): Promise<Migration[]> {
  const fs = await import("fs")
  const path = await import("path")
  const { fileURLToPath } = await import("url")

  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const migrationsDir = path.join(__dirname, "migrations")
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".ts") || f.endsWith(".js"))

  for (const file of files.sort()) {
    const mod = await import(`./migrations/${file}`)
    migrations.push({ name: file.replace(/\.(ts|js)$/, ""), up: mod.up, down: mod.down })
  }

  return migrations
}

export async function runMigrations(): Promise<void> {
  const db = getDb()

  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT DEFAULT (datetime('now'))
    )
  `)

  const applied = new Set(
    (db.prepare("SELECT name FROM _migrations").all() as { name: string }[]).map((r) => r.name)
  )

  const allMigrations = await loadMigrations()

  for (const m of allMigrations) {
    if (!applied.has(m.name)) {
      console.log(`[migrate] Running ${m.name}...`)
      m.up(db)
      db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(m.name)
      console.log(`[migrate] ${m.name} applied`)
    }
  }
}

export function rollbackLast(): void {
  const db = getDb()
  const last = db.prepare("SELECT name FROM _migrations ORDER BY applied_at DESC LIMIT 1").get() as { name: string } | undefined

  if (!last) {
    console.log("[migrate] No migrations to rollback")
    return
  }

  console.log(`[migrate] Rollback not implemented for dynamic imports`)
  console.log(`[migrate] Last migration: ${last.name}`)
}
