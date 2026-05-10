import Database from "better-sqlite3"

export function up(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      frequency TEXT NOT NULL DEFAULT 'daily' CHECK(frequency IN ('daily', 'weekly', 'weekdays', 'weekends')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);

    CREATE TABLE IF NOT EXISTS habit_completions (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL,
      completed_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON habit_completions(habit_id);
    CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON habit_completions(completed_at);
  `)
}

export function down(db: Database.Database): void {
  db.exec("DROP TABLE IF EXISTS habit_completions")
  db.exec("DROP TABLE IF EXISTS habits")
}
