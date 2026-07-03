/**
 * Minimal RFC-4180 CSV parser.
 *
 * Handles the parts we actually need for spreadsheet exports: quoted fields,
 * embedded commas/newlines inside quotes, escaped double-quotes (""), a leading
 * UTF-8 BOM, and both LF and CRLF line endings. It intentionally avoids a
 * third-party dependency so the API stays install-free.
 *
 * Returns a matrix of rows -> cells. Fully empty lines are dropped so trailing
 * blank rows in a file do not produce phantom records.
 */
export function parseCsv(input: string): string[][] {
  // Strip a leading UTF-8 BOM if present.
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = '';
  };

  const pushRow = () => {
    pushField();
    // Drop rows that are entirely empty (e.g. a trailing newline).
    const isBlank = row.every((cell) => cell.trim() === '');
    if (!isBlank) rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          // Escaped quote inside a quoted field.
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    switch (char) {
      case '"':
        inQuotes = true;
        break;
      case ',':
        pushField();
        break;
      case '\r':
        // Swallow CR; the following LF (if any) closes the row.
        if (text[i + 1] === '\n') i++;
        pushRow();
        break;
      case '\n':
        pushRow();
        break;
      default:
        field += char;
    }
  }

  // Flush the final field/row if the file did not end with a newline.
  if (field !== '' || row.length > 0) pushRow();

  return rows;
}
