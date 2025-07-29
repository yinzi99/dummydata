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

    let stocks;
    if (sortField === 'market_cap') {
        // 修复市值排序问题
        stocks = db.prepare(
            `SELECT * FROM stocks
             ORDER BY 
               CASE
                 WHEN market_cap LIKE '%万亿' THEN CAST(REPLACE(REPLACE(market_cap, '万亿', ''), ',', '') AS REAL) * 1000000000000
                 WHEN market_cap LIKE '%亿' THEN CAST(REPLACE(REPLACE(market_cap, '亿', ''), ',', '') AS REAL) * 100000000
                 ELSE 0
               END ${sortOrder}
             LIMIT ? OFFSET ?`
        ).all(Number(limit), Number(offset));
    } else {
        stocks = db.prepare('SELECT * FROM stocks').all();
    }

    // 批量查找前一天价格
    const codes = stocks.map(s => s.code);
    let prevMap = {};
    if (codes.length > 0) {
        const placeholders = codes.map(() => '?').join(',');
        const prevRows = db.prepare(
            `SELECT stock_code, price
             FROM (
               SELECT stock_code, price, ROW_NUMBER() OVER (PARTITION BY stock_code ORDER BY date DESC) as rn
               FROM stock_history
               WHERE stock_code IN (${placeholders})
             )
             WHERE rn = 2`
        ).all(...codes);
        prevRows.forEach(row => { prevMap[row.stock_code] = row.price; });
    }

    // 计算涨跌幅
    const stocksWithChange = stocks.map(stock => {
        const prevPrice = prevMap[stock.code];
        let change_percent = null;
        if (prevPrice !== undefined && prevPrice !== 0) { // 避免除以0
            change_percent = Number(((stock.latest_price - prevPrice) / prevPrice * 100).toFixed(2));
        }
        return {...stock, change_percent };
    });

    // 处理涨跌幅排序
    let result;
    if (sortField === 'change_percent') {
        result = stocksWithChange
            .sort((a, b) => {
                const aVal = (a.change_percent === null || a.change_percent === undefined) ?
                    (sortOrder === 'ASC' ? Infinity : -Infinity) :
                    a.change_percent;
                const bVal = (b.change_percent === null || b.change_percent === undefined) ?
                    (sortOrder === 'ASC' ? Infinity : -Infinity) :
                    b.change_percent;

                return sortOrder === 'ASC' ? aVal - bVal : bVal - aVal;
            })
            .slice(offset, offset + Number(limit));
    } else {
        result = stocksWithChange;
    }

    res.json(result);
});

// 获取推荐股票列表
router.get('/recommend', (req, res) => {
    const days = parseInt(req.query.days || 30);
    const top = parseInt(req.query.top || 5);
    const maxPE = parseFloat(req.query.maxPE || 100);
    const minTurnover = parseFloat(req.query.minTurnover || 0);

    const baseStocks = db.prepare(`
    SELECT * FROM stocks 
    WHERE pe_ratio <= ? AND turnover_rate >= ?
  `).all(maxPE, minTurnover);

    const scoredStocks = [];

    baseStocks.forEach(stock => {
        const rows = db.prepare(`
      SELECT price FROM stock_history
      WHERE stock_code = ?
      ORDER BY date DESC
      LIMIT ?
    `).all(stock.code, days);

        const prices = rows.map(r => r.price).filter(p => p != null);
        if (prices.length < days) return;

        const latest = prices[0];
        const earliest = prices[prices.length - 1];
        const returnRate = (latest - earliest) / earliest;

        const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
        const stddev = Math.sqrt(prices.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / prices.length);

        const maxDrawdown = Math.max(...prices.map((v, i) => {
            const maxBefore = Math.max(...prices.slice(0, i + 1));
            return (maxBefore - v) / maxBefore;
        }));

        const peScore = stock.pe_ratio > 0 ? 1 / stock.pe_ratio : 0;

        const score = (
            returnRate * 100 * 0.4 +
            (1 - stddev) * 100 * 0.25 +
            (1 - maxDrawdown) * 100 * 0.2 +
            peScore * 100 * 0.15
        );

        scoredStocks.push({
            ...stock,
            score: Number(score.toFixed(2)),
            return_rate: Number(returnRate.toFixed(4)),
            volatility: Number(stddev.toFixed(4)),
            max_drawdown: Number(maxDrawdown.toFixed(4)),
            pe_inverse: Number(peScore.toFixed(4)),
            recommend_reason: score > 85 ? '收益高，估值低，表现优异' : score > 70 ? '稳健上升，值得关注' : '波动大，需谨慎'
        });
    });

    scoredStocks.sort((a, b) => b.score - a.score);
    res.json(scoredStocks.slice(0, top));
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

    res.json({...stock, change_percent });
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

    res.json({...stock, change_percent });
});

// 获取单只股票历史价格，只返回日期和价格，支持 day 参数
router.get('/:code/history', (req, res) => {
    const { code } = req.params;
    const { day } = req.query;

    // 查询历史价格（注意这里是 ASC）
    let sql = `
    SELECT date, price
    FROM stock_history
    WHERE stock_code = ?
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