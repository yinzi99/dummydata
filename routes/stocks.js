const express = require('express');
const db = require('../config/db');
const router = express.Router();

// 获取所有股票列表，支持分页、按市值/涨跌幅排序
router.get('/', (req, res) => {
  const { page = 1, limit = 20, sort = 'market_cap', order = 'desc' } = req.query;
  const offset = (page - 1) * limit;

  // 只允许特定字段排序
  const allowedSort = ['market_cap', 'change_percent'];
  const sortField = allowedSort.includes(sort) ? sort : 'market_cap';
  const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  // 查询所有股票
  const stocks = db.prepare('SELECT * FROM stocks LIMIT ? OFFSET ?').all(Number(limit), Number(offset));

  // 动态计算涨跌幅
  const stocksWithChange = stocks.map(stock => {
    const prev = db.prepare(
      'SELECT price FROM stock_history WHERE stock_code = ? ORDER BY date DESC LIMIT 1 OFFSET 1'
    ).get(stock.code);
    let change_percent = null;
    if (prev && prev.price) {
      change_percent = Number(((stock.latest_price - prev.price) / prev.price * 100).toFixed(2));
    }
    return { ...stock, change_percent };
  });

  // 排序
  stocksWithChange.sort((a, b) => {
    if (sortField === 'market_cap') {
      // 市值排序（假设 market_cap 为数字，若为字符串需转换）
      return sortOrder === 'ASC'
        ? Number(a.market_cap) - Number(b.market_cap)
        : Number(b.market_cap) - Number(a.market_cap);
    } else {
      // 涨跌幅排序
      return sortOrder === 'ASC'
        ? (a.change_percent ?? -Infinity) - (b.change_percent ?? -Infinity)
        : (b.change_percent ?? -Infinity) - (a.change_percent ?? -Infinity);
    }
  });

  res.json(stocksWithChange);
});

// 获取单只股票详情（动态计算涨跌幅）
router.get('/:code', (req, res) => {
  const { code } = req.params;
  const stock = db.prepare('SELECT * FROM stocks WHERE code = ?').get(code);
  if (!stock) return res.status(404).json({ error: '未找到该股票' });

  const prev = db.prepare(
    'SELECT price FROM stock_history WHERE stock_code = ? ORDER BY date DESC LIMIT 1 OFFSET 1'
  ).get(code);

  let change_percent = null;
  if (prev && prev.price) {
    change_percent = Number(((stock.latest_price - prev.price) / prev.price * 100).toFixed(2));
  }

  res.json({ ...stock, change_percent });
});

// 获取股票简要信息（代码、名称、最新价、涨跌幅）
router.get('/:code/brief', (req, res) => {
  const { code } = req.params;
  const stock = db.prepare('SELECT code, name, latest_price FROM stocks WHERE code = ?').get(code);
  if (!stock) return res.status(404).json({ error: '未找到该股票' });

  const prev = db.prepare(
    'SELECT price FROM stock_history WHERE stock_code = ? ORDER BY date DESC LIMIT 1 OFFSET 1'
  ).get(code);

  let change_percent = null;
  if (prev && prev.price) {
    change_percent = Number(((stock.latest_price - prev.price) / prev.price * 100).toFixed(2));
  }

  res.json({ ...stock, change_percent });
});

// 获取单只股票历史价格，只返回日期和价格
router.get('/:code/history', (req, res) => {
  const { code } = req.params;
  const { start, end } = req.query;

  let sql = `
    SELECT date, price
    FROM stock_history
    WHERE stock_code = ?
  `;
  const params = [code];

  if (start && end) {
    sql += ' AND date BETWEEN ? AND ?';
    params.push(start, end);
  } else if (start) {
    sql += ' AND date >= ?';
    params.push(start);
  } else if (end) {
    sql += ' AND date <= ?';
    params.push(end);
  }

  sql += ' ORDER BY date ASC';

  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

module.exports = router;