const db = require('./config/db');
require('./utils/priceSimulator');
require('./utils/fundSimulator');
const express = require('express');
const stocksRouter = require('./routes/stocks');
const fundsRouter = require('./routes/funds'); // 加入基金路由
const app = express();

app.use(express.json());
app.use('/api/stocks', stocksRouter);
app.use('/api/funds', fundsRouter); // 注册基金路由

app.listen(3000, () => {
  console.log('API 服务已启动: http://localhost:3000');
});