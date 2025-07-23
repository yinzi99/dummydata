const express = require('express');
const db = require('../config/db');
const router = express.Router();

// 获取所有基金列表，支持分页、类型筛选、规模/涨跌幅排序
router.get('/', (req, res) => {
  const { page = 1, limit = 20, type, sort = 'fund_size', order = 'desc' } = req.query;
  const offset = (page - 1) * limit;

  let sql = 'SELECT * FROM funds';
  const params = [];

  if (type) {
    sql += ' WHERE fund_type = ?';
    params.push(type);
  }

  sql += ` LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));

  const funds = db.prepare(sql).all(...params);

  // 动态计算涨跌幅
  const fundsWithChange = funds.map(fund => {
    const prev = db.prepare(
      'SELECT net_value FROM fund_history WHERE fund_code = ? ORDER BY date DESC LIMIT 1 OFFSET 1'
    ).get(fund.fund_code);
    let change_percent = null;
    if (prev && prev.net_value) {
      change_percent = Number(((fund.latest_net_value - prev.net_value) / prev.net_value * 100).toFixed(2));
    }
    return { ...fund, change_percent };
  });

  // 排序
  if (sort === 'change_percent') {
    fundsWithChange.sort((a, b) => {
      return order === 'asc'
        ? (a.change_percent ?? -Infinity) - (b.change_percent ?? -Infinity)
        : (b.change_percent ?? -Infinity) - (a.change_percent ?? -Infinity);
    });
  } else {
    fundsWithChange.sort((a, b) => {
      return order === 'asc'
        ? Number(a[sort]) - Number(b[sort])
        : Number(b[sort]) - Number(a[sort]);
    });
  }

  res.json(fundsWithChange);
});

// 获取单只基金详情（动态计算涨跌幅）
router.get('/:code', (req, res) => {
  const { code } = req.params;
  const fund = db.prepare('SELECT * FROM funds WHERE fund_code = ?').get(code);
  if (!fund) return res.status(404).json({ error: '未找到该基金' });

  const prev = db.prepare(
    'SELECT net_value FROM fund_history WHERE fund_code = ? ORDER BY date DESC LIMIT 1 OFFSET 1'
  ).get(code);

  let change_percent = null;
  if (prev && prev.net_value) {
    change_percent = Number(((fund.latest_net_value - prev.net_value) / prev.net_value * 100).toFixed(2));
  }

  res.json({ ...fund, change_percent });
});

// 获取基金简要信息（代码、简称、最新净值、涨跌幅）
router.get('/:code/brief', (req, res) => {
  const { code } = req.params;
  const fund = db.prepare('SELECT fund_code, short_name, latest_net_value FROM funds WHERE fund_code = ?').get(code);
  if (!fund) return res.status(404).json({ error: '未找到该基金' });

  const prev = db.prepare(
    'SELECT net_value FROM fund_history WHERE fund_code = ? ORDER BY date DESC LIMIT 1 OFFSET 1'
  ).get(code);

  let change_percent = null;
  if (prev && prev.net_value) {
    change_percent = Number(((fund.latest_net_value - prev.net_value) / prev.net_value * 100).toFixed(2));
  }

  res.json({ ...fund, change_percent });
});

// 获取单只基金历史净值，只返回日期和净值
router.get('/:code/history', (req, res) => {
  const { code } = req.params;
  const { start, end } = req.query;

  let sql = `
    SELECT date, net_value
    FROM fund_history
    WHERE fund_code = ?
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
