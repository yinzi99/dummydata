const express = require('express');
const db = require('../config/db');
const router = express.Router();

// 获取所有基金列表，支持分页、类型筛选、规模/涨跌幅排序
router.get('/', (req, res) => {
    const { page = 1, limit = 20, type, sort = 'fund_size', order = 'desc' } = req.query;
    const offset = (page - 1) * limit;

    // 允许排序的字段
    const allowedSort = ['fund_size', 'change_percent'];
    const sortField = allowedSort.includes(sort) ? sort : 'fund_size';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // 基础查询
    let sql = 'SELECT * FROM funds';
    const params = [];

    // 类型筛选
    if (type) {
        sql += ' WHERE fund_type = ?';
        params.push(type);
    }

    // 数据库层面排序（仅fund_size）
    if (sortField === 'fund_size') {
        sql += ` ORDER BY 
      CASE
        WHEN fund_size LIKE '%亿' THEN CAST(REPLACE(fund_size, '亿', '') AS REAL) * 100000000
        WHEN fund_size LIKE '%万' THEN CAST(REPLACE(fund_size, '万', '') AS REAL) * 10000
        ELSE 0
      END ${sortOrder}`;
    }

    // 分页
    sql += ` LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const funds = db.prepare(sql).all(...params);

    // 批量查询前一天净值（解决N+1问题）
    const fundCodes = funds.map(f => f.fund_code);
    let prevNetValues = {};

    if (fundCodes.length > 0) {
        const placeholders = fundCodes.map(() => '?').join(',');
        const prevRows = db.prepare(
            `SELECT fund_code, net_value 
       FROM (
         SELECT fund_code, net_value, 
                ROW_NUMBER() OVER (PARTITION BY fund_code ORDER BY date DESC) as rn
         FROM fund_history 
         WHERE fund_code IN (${placeholders})
       ) 
       WHERE rn = 2`
        ).all(...fundCodes);

        prevRows.forEach(row => {
            prevNetValues[row.fund_code] = row.net_value;
        });
    }

    // 计算涨跌幅
    const fundsWithChange = funds.map(fund => {
        const prevValue = prevNetValues[fund.fund_code];
        let change_percent = null;
        if (prevValue && prevValue > 0) {
            change_percent = Number(((fund.latest_net_value - prevValue) / prevValue * 100).toFixed(2));
        }
        return {
            ...fund,
            change_percent,
            // 添加计算后的规模数值（可选）
            fund_size_value: fund.fund_size.includes('亿') ?
                parseFloat(fund.fund_size.replace('亿', '')) * 100000000 : parseFloat(fund.fund_size.replace('万', '')) * 10000
        };
    });

    // 内存排序（仅change_percent需要）
    let result;
    if (sortField === 'change_percent') {
        result = fundsWithChange.sort((a, b) => {
            const aVal = (a.change_percent === null || a.change_percent === undefined) ?
                (sortOrder === 'ASC' ? Infinity : -Infinity) :
                a.change_percent;
            const bVal = (b.change_percent === null || b.change_percent === undefined) ?
                (sortOrder === 'ASC' ? Infinity : -Infinity) :
                b.change_percent;
            return sortOrder === 'ASC' ? aVal - bVal : bVal - aVal;
        }).slice(offset, offset + Number(limit));
    } else {
        result = fundsWithChange;
    }

    res.json(result);
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

    res.json({...fund, change_percent });
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

    res.json({...fund, change_percent });
});

// 获取单只基金历史净值，只返回日期和净值，支持 day 参数
router.get('/:code/history', (req, res) => {
    const { code } = req.params;
    const { day } = req.query;

    // 查询历史净值（注意这里是 ASC）
    let sql = `
    SELECT date, net_value
    FROM fund_history
    WHERE fund_code = ?
    ORDER BY date ASC
  `;
    const params = [code];

    if (day && !isNaN(Number(day))) {
        sql += ' LIMIT ?';
        params.push(Number(day));
    }

    const rows = db.prepare(sql).all(...params);

    // 在代码层面做降序（最新日期在前）
    res.json(rows.reverse());
});

module.exports = router;