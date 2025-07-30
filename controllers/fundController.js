const db = require('../config/db');
const { validateOfGetAllFund, validateLimit, validateCode, BusinessError, successResponse } = require('share-utils');
const { generateResonse } = require('../utils/responser');
const { validateResCode, getHistory, getItemFromJoinSearch } = require('../utils/searchTool');

/**
 * 获取所有基金列表，支持分页、排序
 */
exports.getAllFunds = (req, res) => {
  validateOfGetAllFund(req);
  try {
    const funds = getFundsBySearch(req);
    console.log("----funds is ", funds);
    successResponse(res, funds);
  } catch (error) {
    throw new BusinessError(error.message);
  }

  function getFundsBySearch(req) {
    let { page, limit, sort, order } = req.query;
    let offset = (page - 1) * limit;
    console.log("----getFundsBySearch  ", page, limit, sort, order, offset);
    switch (sort) {
      case 'fund_size':
        return getAllFundsOrderByFundSize(limit, order, offset);
      case 'change_percent':
        return getAllFundsOrderByChangePercent(limit, order, offset);
      default:
        // 默认查询（可根据需求补充）
        const defaultSql = 'SELECT * FROM funds LIMIT ? OFFSET ?';
        return db.prepare(defaultSql).all(Number(limit), Number(offset));
    }
  }

  function getAllFundsOrderByFundSize(limit, order, offset) {
    const params = [];
    let sql = `
      SELECT * FROM funds ORDER BY 
      CASE
        WHEN fund_size LIKE '%亿' THEN CAST(REPLACE(fund_size, '亿', '') AS REAL) * 100000000
        WHEN fund_size LIKE '%万' THEN CAST(REPLACE(fund_size, '万', '') AS REAL) * 10000
        ELSE 0
      END ${order === 'desc' ? 'DESC' : 'ASC'}
      LIMIT ? OFFSET ?
    `;
    params.push(Number(limit), Number(offset));
    return db.prepare(sql).all(...params);
  }

  function getAllFundsOrderByChangePercent(limit, order, offset) {
    const sql = `
      SELECT f.*, h.change_percent
      FROM funds f
      JOIN (
        SELECT fund_code, MAX(date) AS max_date
        FROM fund_history
        GROUP BY fund_code
      ) latest ON f.fund_code = latest.fund_code
      JOIN fund_history h 
        ON latest.fund_code = h.fund_code 
        AND latest.max_date = h.date 
      ORDER BY h.change_percent ${order}
      LIMIT ? OFFSET ?
    `;
    let result = db.prepare(sql).all(Number(limit), Number(offset));
    console.log("----000result is ", result);
    return result;
  }
};

/**
 * 获取单只基金详情
 */
exports.getFundDetail = (req, res) => {
  let { code, day } = validateResCode(req);
  console.log("----===code is " + code)
  try {
    var fund = getItemFromJoinSearch(code, 'fund_code', 'funds', 'fund_history');
    console.log("fund is " + fund);
    successResponse(res, fund);
  } catch (err) {
    throw new BusinessError(err.message);
  }
};

/**
 * 获取单只基金历史净值
 */
exports.getFundHistory = (req, res) => {
  let { code, day } = validateResCode(req);
  try {
    console.log("getFundHistory", code, day);
    var fundHistory = getHistory(code, 'fund_code', day, 'fund_history');
    console.log("fundHistory is " + fundHistory);
    successResponse(res, fundHistory);
  } catch (err) {
    throw new BusinessError(err.message);
  }
};
