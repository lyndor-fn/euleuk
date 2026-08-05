import fs from "node:fs";
import Database from "better-sqlite3";

function sqlValue(value: unknown) {
  if (value === null || value === undefined) return "NULL";
  if (Buffer.isBuffer(value)) return `X'${value.toString("hex")}'`;
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  const text = String(value).replace(/'/g, "''");
  return `'${text}'`;
}

export function persistToSql(db: Database.Database, sqlPath: string) {
  const tables = db
    .prepare(
      "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
    .all();

  const lines: string[] = [];
  lines.push("PRAGMA foreign_keys=OFF;");
  lines.push("BEGIN TRANSACTION;");

  for (const table of tables) {
    if (!table.sql) continue;
    lines.push(`${table.sql};`);

    const rows = db.prepare(`SELECT * FROM ${table.name}`).all();
    if (rows.length === 0) continue;

    const columns = Object.keys(rows[0]).map((c) => `"${c}"`).join(", ");
    for (const row of rows) {
      const values = Object.values(row).map(sqlValue).join(", ");
      lines.push(`INSERT INTO "${table.name}" (${columns}) VALUES (${values});`);
    }
  }

  lines.push("COMMIT;");
  fs.writeFileSync(sqlPath, lines.join("\n") + "\n", "utf8");
}

export function initDb(sqlPath: string, schemaSql: string) {
  const db = new Database(":memory:");
  if (fs.existsSync(sqlPath)) {
    const sql = fs.readFileSync(sqlPath, "utf8");
    if (sql.trim()) {
      db.exec(sql);
    } else {
      db.exec(schemaSql);
      persistToSql(db, sqlPath);
    }
  } else {
    db.exec(schemaSql);
    persistToSql(db, sqlPath);
  }
  db.pragma("foreign_keys = ON");
  return db;
}
