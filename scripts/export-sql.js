import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

function sqlValue(value) {
  if (value === null || value === undefined) return "NULL";
  if (Buffer.isBuffer(value)) return `X'${value.toString("hex")}'`;
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  const text = String(value).replace(/'/g, "''");
  return `'${text}'`;
}

function main() {
  const root = process.cwd();
  const dbPath = path.join(root, "euleuk.db");
  const outPath = path.join(root, "euleuk.sql");

  if (!fs.existsSync(dbPath)) {
    throw new Error(`Database not found at ${dbPath}`);
  }

  const db = new Database(dbPath, { readonly: true });
  const tables = db
    .prepare(
      "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
    .all();

  const lines = [];
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
  fs.writeFileSync(outPath, lines.join("\n") + "\n", "utf8");
  db.close();
  console.log(`Wrote ${outPath}`);
}

try {
  main();
} catch (error) {
  console.error(error?.message || error);
  process.exit(1);
}
