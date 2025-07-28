const xlsx = require('xlsx');
const db = require('../config/db');

async function importXLSX(filePath, tableName, fieldMap) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet);

  for (const row of rows) {
    const mapped = {};
    for (const [excelKey, dbKey] of Object.entries(fieldMap)) {
      mapped[dbKey] = row[excelKey];
    }
    const columns = Object.keys(mapped).join(',');
    const placeholders = Object.keys(mapped).map(() => '?').join(',');
    const values = Object.values(mapped);

    await db.runAsync(
      `INSERT OR IGNORE INTO ${tableName} (${columns}) VALUES (${placeholders})`,
      values
    );
  }
}

module.exports = { importXLSX };