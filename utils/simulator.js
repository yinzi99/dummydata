const db = require('../config/db');

// 初始化虚拟日期（从历史最大日期 + 1 天开始）
let virtualDate;

function initVirtualDate() {
  const stockRow = db.prepare('SELECT MAX(date) as maxDate FROM stock_history').get();
  const fundRow = db.prepare('SELECT MAX(date) as maxDate FROM fund_history').get();

  let maxDate = null;
  if (stockRow && stockRow.maxDate) maxDate = stockRow.maxDate;
  if (fundRow && fundRow.maxDate && (!maxDate || fundRow.maxDate > maxDate)) maxDate = fundRow.maxDate;

  if (maxDate) {
    virtualDate = new Date(maxDate);
    virtualDate.setDate(virtualDate.getDate() + 1);
  } else {
    virtualDate = new Date('2025-01-01'); // fallback 初始日期
  }
}

// 格式化为 yyyy-mm-dd（按中国时区）
function formatDate(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
}

// 通用模拟函数
function simulate({
  selectSql,
  updateSql,
  insertSql,
  codeField,
  valueField,
  fluctuation,
  decimals
}) {
  const items = db.prepare(selectSql).all();

  items.forEach(item => {
    const changePercent = (Math.random() * fluctuation * 2 - fluctuation).toFixed(2); // ±x%
    const oldValue = item[valueField];
    const newValue = +(oldValue * (1 + changePercent / 100)).toFixed(decimals);

    try {
      db.prepare(updateSql).run(newValue, item[codeField]);
      db.prepare(insertSql).run(item[codeField], formatDate(virtualDate), newValue);
    } catch (err) {
      console.error(`Failed to simulate ${item[codeField]}:`, err.message);
    }
  });
}

// 模拟股票价格
function simulateStocks() {
  simulate({
    selectSql: 'SELECT code, latest_price FROM stocks',
    updateSql: 'UPDATE stocks SET latest_price = ? WHERE code = ?',
    insertSql: 'INSERT INTO stock_history (stock_code, date, price) VALUES (?, ?, ?)',
    codeField: 'code',
    valueField: 'latest_price',
    fluctuation: 2,
    decimals: 2
  });
}

// 模拟基金净值
function simulateFunds() {
  simulate({
    selectSql: 'SELECT fund_code, latest_net_value FROM funds',
    updateSql: 'UPDATE funds SET latest_net_value = ? WHERE fund_code = ?',
    insertSql: 'INSERT INTO fund_history (fund_code, date, net_value) VALUES (?, ?, ?)',
    codeField: 'fund_code',
    valueField: 'latest_net_value',
    fluctuation: 1,
    decimals: 4
  });
}

// 每天模拟一次：两个模拟函数 + 虚拟时间递增
function simulateAll() {
  console.log(`Simulating date: ${formatDate(virtualDate)}`);
  simulateStocks();
  simulateFunds();
  virtualDate.setDate(virtualDate.getDate() + 1);
}

initVirtualDate();

// 每分钟模拟一天的数据（开发用）
setInterval(simulateAll, 60 * 1000);

// 如果你要手动调用也支持：
module.exports = { simulateAll };
