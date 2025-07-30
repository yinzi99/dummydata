const { Worker } = require('worker_threads');
const path = require('path');
const {BusinessError} = require('share-utils');
const db  = require('../config/db');
// 引入虚拟时间管理模块
const virtualDateManager = require('./virtualDateManager');

// 配置信息
const SIMULATION_CONFIGS = {
  stocks: {
    selectSql: 'SELECT stock_code, latest_price FROM stocks',
    updateSql: 'UPDATE stocks SET latest_price = ? WHERE stock_code = ?',
    insertTable: 'stock_history',
    insertColumns: '(stock_code, date, price, change_percent)',
    codeField: 'stock_code',
    valueField: 'latest_price', 
    fluctuation: 2,
    decimals: 2,
    chunkSize: 500
  },   
  funds: {
    selectSql: 'SELECT fund_code, latest_price FROM funds',
    updateSql: 'UPDATE funds SET latest_price = ? WHERE fund_code = ?',
    insertTable: 'fund_history',
    insertColumns: '(fund_code, date, price, change_percent)',
    codeField: 'fund_code',
    valueField: 'latest_price',
    fluctuation: 1,
    decimals: 4,
    chunkSize: 500
  }
};

// Worker处理函数
function processWithWorker(config, itemsChunk, dateStr) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, 'simulation-worker.js'), {
      workerData: { config, itemsChunk, dateStr }
    });
    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) reject(new BusinessError(`Worker stopped with exit code ${code}`));
    });
  });
}

// 分割数组为块
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// 处理单个模拟配置
async function processSimulation(config) {
  try {
    const items = db.prepare(config.selectSql).all();
    // 从模块获取格式化的虚拟时间
    const dateStr = virtualDateManager.getFormattedVirtualDate();
    const chunks = chunkArray(items, config.chunkSize);
    await Promise.all(chunks.map(chunk => processWithWorker(config, chunk, dateStr)));
  } catch (error) {
    console.error(`处理${config.insertTable}失败:`, error.message);
    throw new BusinessError(`处理${config.insertTable}失败:`, error.message);
  }
}

// 主模拟函数
async function simulateAll() {
  try {
    console.log(`Simulating date: ${virtualDateManager.getFormattedVirtualDate()}`);
    
    await Promise.all(
      Object.values(SIMULATION_CONFIGS).map(config => processSimulation(config))
    );
    
    // 通过模块方法更新虚拟时间
    virtualDateManager.incrementVirtualDate();
  } catch (error) {
    console.error('模拟失败:', error.message);
    throw new BusinessError('模拟失败', error.message);
  }
}

// 初始化虚拟时间
// 初始化虚拟时间（带错误处理）
try {
  virtualDateManager.initVirtualDate();
  console.log(`初始化虚拟时间成功: ${virtualDateManager.getFormattedVirtualDate()}`);
} catch (error) {
  console.error('虚拟时间初始化失败:', error.message);
  // 初始化失败时可以选择退出程序或使用默认值
  throw new BusinessError('程序初始化失败: 虚拟时间设置错误', error.message);
}

// 启动定时器（带错误处理的包装）
const startSimulation = async () => {
  try {
    await simulateAll();
  } catch (error) {
    console.error('定时任务执行失败:', error.message);
    // 可以在这里添加告警逻辑
    throw new BusinessError(error.message);
  }
};

// 立即执行一次，再开始定时
startSimulation().then(() => {
  setInterval(startSimulation, 60 * 1000);
});

module.exports = { simulateAll };
