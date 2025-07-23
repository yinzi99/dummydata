const db = require('../config/db');
const { importXLSX } = require('../utils/importXlsx');

const SCHEMAS = [
  `CREATE TABLE IF NOT EXISTS stocks (
    code TEXT PRIMARY KEY,
    name TEXT,
    latest_price REAL,
    market_cap TEXT,
    turnover_rate REAL,
    pe_ratio REAL,
    pb_ratio REAL
  )`,

  `CREATE TABLE IF NOT EXISTS stock_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stock_code TEXT,
    date TEXT,
    price REAL,
    high REAL,
    low REAL,
    volume TEXT,
    FOREIGN KEY(stock_code) REFERENCES stocks(code)
  )`,

  `CREATE TABLE IF NOT EXISTS funds (
    fund_code TEXT PRIMARY KEY,
    short_name TEXT,
    fund_type TEXT,
    fund_size TEXT,
    industries TEXT,
    managers TEXT,
    latest_net_value REAL
  )`,

  `CREATE TABLE IF NOT EXISTS fund_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fund_code TEXT,
    date TEXT,
    net_value REAL,
    change_percent REAL,
    FOREIGN KEY(fund_code) REFERENCES funds(fund_code)
  )`
];

// 字段映射 (适配您的Excel)
const FIELD_MAPS = {
  stocks: {
    '代码': 'code',
    '名称': 'name',
    '最新价': 'latest_price',
    '总市值': 'market_cap',
    '换手率': 'turnover_rate',
    '市盈率': 'pe_ratio',
    '市净率': 'pb_ratio'
  },
  funds: {
    '基金代码': 'fund_code',
    '基金简称': 'short_name',
    '基金类型': 'fund_type',
    '基金规模': 'fund_size',
    '重仓行业': 'industries',
    '基金经理': 'managers',
    '基金净值': 'latest_net_value'
  }
};

async function initialize() {
  try {
    await db.runAsync('BEGIN TRANSACTION');
    for (const schema of SCHEMAS) {
      await db.runAsync(schema);
    }
    await db.runAsync('COMMIT');

    await importXLSX('./data/stock.xlsx', 'stocks', FIELD_MAPS.stocks);
    await importXLSX('./data/fund.xlsx', 'funds', FIELD_MAPS.funds);

    console.log('✅ 数据库初始化完成 (4个表已创建)');
  } catch (err) {
    try { await db.runAsync('ROLLBACK'); } catch (e) {}
    console.error('❌ 初始化失败:', err);
  } finally {
    await db.closeAsync();
  }
}

initialize();