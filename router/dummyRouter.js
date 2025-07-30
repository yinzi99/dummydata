const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const fundController = require('../controllers/fundController');

// 股票相关路由
router.get('/stock/recommend', stockController.getRecommendedStocks);
router.get('/stocks', stockController.getAllStocks);
router.get('/stocks/:code', stockController.getStockDetail);
router.get('/stocks/:code/history', stockController.getStockHistory);

// 基金相关路由
router.get('/fund/recommend', fundController.getFundRecommendFunds);
router.get('/funds', fundController.getAllFunds);
router.get('/funds/:code', fundController.getFundDetail);
router.get('/funds/:code/history', fundController.getFundHistory);


module.exports = router;