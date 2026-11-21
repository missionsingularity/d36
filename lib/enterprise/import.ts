import { z } from "zod";
import { db, uid, timestamp, atomic, insertRecord, log } from "./db";
import { WorkspaceError } from "./service";
import type { Employee } from "./types";
export function parseCsv(text: string) {
  if (text.length > 1000000) throw new WorkspaceError("CSV limit is 1 MB");
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (quoted) quoted = false;
      else if (!cell) quoted = true;
      else throw new WorkspaceError("Invalid CSV quote");
    } else if (ch === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (quoted) throw new WorkspaceError("Unclosed CSV quotation");
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  if (rows.length < 2 || rows.length > 501)
    throw new WorkspaceError("CSV must contain a header and 1–500 rows");
  const headers = rows.shift()!.map((s) => s.replace(/^\uFEFF/, ""));
  if (new Set(headers).size !== headers.length)
    throw new WorkspaceError("Duplicate CSV headers");
  return { headers, rows };
}
export function importCsv(u: Employee, input: unknown) {
  if (u.role !== "admin")
    throw new WorkspaceError("Administrator required", 403);
  const v = z
    .object({
      kind: z.enum(["Assets", "Projects", "Employees"]),
      csv: z.string(),
      mapping: z.record(z.string(), z.string()),
      confirm: z.boolean().default(false),
    })
    .parse(input);
  const parsed = parseCsv(v.csv);
  const normalized = parsed.rows.map((r, i) => {
    const get = (key: string) =>
      r[parsed.headers.indexOf(v.mapping[key] || key)] || "";
    return {
      row: i + 2,
      id: get("id"),
      title: get("title"),
      body: get("body"),
      department: get("department") || "Operations",
      email: get("email"),
    };
  });
  const seen = new Set<string>();
  const errors: string[] = [];
  for (const r of normalized) {
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(r.id) || !r.title || r.title.length > 200)
      errors.push(`Row ${r.row}: valid id and title required`);
    if (
      seen.has(r.id) ||
      db().prepare("SELECT id FROM records WHERE id=?").get(r.id) ||
      db().prepare("SELECT id FROM employees WHERE id=?").get(r.id)
    )
      errors.push(`Row ${r.row}: duplicate ID ${r.id}`);
    seen.add(r.id);
    if (
      v.kind === "Employees" &&
      (!z.email().safeParse(r.email).success ||
        db().prepare("SELECT id FROM employees WHERE email=?").get(r.email) ||
        normalized.filter((x) => x.email === r.email).length > 1)
    )
      errors.push(`Row ${r.row}: valid unique email required`);
  }
  const preview = { rows: normalized, errors, count: normalized.length };
  if (!v.confirm) return preview;
  if (errors.length)
    throw new WorkspaceError("Import validation failed: " + errors.join("; "));
  return atomic(() => {
    for (const r of normalized) {
      if (v.kind === "Employees")
        db()
          .prepare("INSERT INTO employees VALUES(?,?,?,?,?,?)")
          .run(r.id, r.title, r.email, r.department, "employee", 0);
      insertRecord({
        id: r.id,
        type:
          v.kind === "Assets"
            ? "IT"
            : v.kind === "Employees"
              ? "People"
              : "Projects",
        title: r.title,
        body: r.body || r.title,
        department: v.kind === "Employees" ? "Company" : r.department,
        owner: u.id,
        status: "Active",
        updated: timestamp(),
        data:
          v.kind === "Assets"
            ? { category: "Asset", ageYears: 0, failures: 0 }
            : v.kind === "Projects"
              ? { members: [u.id] }
              : {},
      });
    }
    const id = uid();
    const receipt = {
      id,
      count: normalized.length,
      kind: v.kind,
      created: timestamp(),
    };
    db()
      .prepare("INSERT INTO imports VALUES(?,?,?,?,?)")
      .run(id, u.id, v.kind, JSON.stringify(receipt), receipt.created);
    log(u.id, "CSV imported", JSON.stringify(receipt));
    return { ...preview, receipt };
  });
}
