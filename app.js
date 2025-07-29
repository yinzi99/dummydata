const db = require('./config/db');
require('./utils/simulator'); // 引入模拟器
const express = require('express');
const cors = require('cors'); // 新增：导入cors模块
const  { errorHandler } = require('share-utils');
const dummyRouter = require('./router/dummyRouter');
const app = express();
console.log('errorHandler 是否为函数:', typeof errorHandler === 'function');
console.log('dummyRouter 是否为函数:', typeof dummyRouter === 'function'); 


app.use(express.json());
app.use(cors());

app.use('/api', dummyRouter);


// // 404处理：未匹配的路由
// app.use((req, res, next) => {
//   errorResponse(res, "Endpoint not found");
// });

// 注册全局错误处理中间件
app.use(errorHandler);

app.listen(3000, () => {
    console.log('API 服务已启动: http://localhost:3000');
});