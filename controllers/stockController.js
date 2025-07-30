const db = require('../config/db');
const { validateOfGetAllStock, validateCode, BusinessError, successResponse } = require('share-utils');
const { generateResonse } = require('../utils/responser');
const { validateResCode, getHistory, getItemFromJoinSearch } = require('../utils/searchTool');

/**
 * 获取所有股票列表，支持分页、排序
 */
exports.getAllStocks = (req, res) => {
  validateOfGetAllStock(req);
  try {
    let stocks = getStocksBySearch(req);
    console.log(stocks);
    successResponse(res, stocks);
  } catch (err) {
    throw new BusinessError(err.message);
  }

  function getStocksBySearch(req) {
    const { page, limit, sort, order } = req.query;
    const offset = (page - 1) * limit;

    switch (sort) {
      case 'market_cap':
        return getAllStocksOrderByMarketCap(limit, order, offset);
      case 'change_percent':
        return getAllStocksOrderByChangePercent(limit, order, offset);
      default:
        return getAllStocksOrderByOther(limit, sort, order, offset);
    }
  }

  function getAllStocksOrderByOther(limit, sort, order, offset) {
    // 防止 SQL 注入，限制排序字段

    const sql = `SELECT * FROM stocks ORDER BY ${sort} ${order === 'desc' ? 'DESC' : 'ASC'} LIMIT ? OFFSET ?`;
    return db.prepare(sql).all(Number(limit), Number(offset));
  }

  function getAllStocksOrderByChangePercent(limit, order, offset) {
    const sql = `
      SELECT s.*, h.change_percent
      FROM stocks s
      JOIN (
        SELECT stock_code, MAX(date) AS max_date
        FROM stock_history
        GROUP BY stock_code
      ) latest ON s.stock_code = latest.stock_code
      JOIN stock_history h 
        ON latest.stock_code = h.stock_code 
        AND latest.max_date = h.date
      ORDER BY h.change_percent ${order === 'desc' ? 'DESC' : 'ASC'}
      LIMIT ? OFFSET ?
    `;
    return db.prepare(sql).all(Number(limit), Number(offset));
  }

  function getAllStocksOrderByMarketCap(limit, order, offset) {
    const sortOrder = order === 'desc' ? 'DESC' : 'ASC';
    const sql = `
      SELECT * FROM stocks
      ORDER BY 
        CASE
          WHEN market_cap LIKE '%万亿' THEN CAST(REPLACE(REPLACE(market_cap, '万亿', ''), ',', '') AS REAL) * 1000000000000
          WHEN market_cap LIKE '%亿' THEN CAST(REPLACE(REPLACE(market_cap, '亿', ''), ',', '') AS REAL) * 100000000
          ELSE 0
        END ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    return db.prepare(sql).all(Number(limit), Number(offset));
  }
};

/**
 * 获取单只股票详情
 */
exports.getStockDetail = (req, res) => {
  let { code, day } = validateResCode(req);
  try {
    var stock = getItemFromJoinSearch(code, 'stock_code', 'stocks', 'stock_history');

    successResponse(res, stock);
  } catch (err) {
    throw new BusinessError(err.message);
  }
};

/**
 * 获取单只股票历史价格
 */
exports.getStockHistory = (req, res) => {
  let { code, day } = validateResCode(req);
  try {
    var stockHistory = getHistory(code, "stock_code", day, 'stock_history');
    successResponse(res, stockHistory);
  } catch (err) {
    throw new BusinessError(err.message);
  }
};
