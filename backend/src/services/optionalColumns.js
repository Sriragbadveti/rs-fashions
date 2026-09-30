/**
 * Writes that tolerate columns added after the original schema.sql. If a deployment has not
 * run the migration yet, the write is retried without the missing column (and a warning is
 * returned) instead of failing the whole save.
 */

function missingOptionalColumn(error, optionalColumns) {
  if (!error) return null;
  const text = `${error.message || ""} ${error.details || ""} ${error.hint || ""}`;
  const isMissingColumn = error.code === "PGRST204" || error.code === "42703" || /column/i.test(text);
  if (!isMissingColumn) return null;
  return optionalColumns.find((col) => text.includes(`'${col}'`) || text.includes(`.${col}`) || text.includes(` ${col} `)) || null;
}

/**
 * Runs `buildQuery(row)`; if it fails only because one of `optionalColumns` is missing in this
 * database, that column is dropped and the write retried. Returns { data, error, warnings }.
 */
export async function writeWithOptionalColumns(table, row, buildQuery, optionalColumns) {
  const warnings = [];
  let currentRow = { ...row };

  for (let attempt = 0; attempt <= optionalColumns.length; attempt++) {
    const { data, error } = await buildQuery(currentRow);
    if (!error) return { data, error: null, warnings };

    const missing = missingOptionalColumn(error, optionalColumns);
    if (!missing || !(missing in currentRow)) {
      return { data: null, error, warnings };
    }

    const message = `${table}.${missing} was not saved: the column is missing in the database (run the ALTER TABLE lines in backend/src/database/schema.sql).`;
    console.warn(`[OptionalColumns] ${message}`);
    warnings.push(message);
    const { [missing]: _dropped, ...rest } = currentRow;
    currentRow = rest;
  }

  return { data: null, error: new Error(`${table} write failed after optional column retries`), warnings };
}
