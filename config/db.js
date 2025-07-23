const Database = require('better-sqlite3');
const db = new Database('./db/dummy.db');

// 简单的异步封装
db.runAsync = (sql, params=[]) => Promise.resolve(db.prepare(sql).run(...params));
db.closeAsync = () => Promise.resolve(db.close());

module.exports = db;