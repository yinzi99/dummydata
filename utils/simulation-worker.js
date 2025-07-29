// simulation-worker.js
const { parentPort, workerData } = require('worker_threads');
const db = require('../config/db'); // 导入数据库实例

// 从主线程接收参数（config配置、数据块、日期）
const { config, itemsChunk, dateStr } = workerData;

try {
  // 1. 验证必要参数
  if (!config || !itemsChunk || !dateStr) {
    throw new Error('缺少必要的处理参数');
  }

  // 2. 计算价格波动并生成待插入数据
  const processedData = itemsChunk.map(item => {
    // 获取当前值（股票用latest_price，基金用latest_net_value）
    const currentValue = item[config.valueField];
    if (currentValue === undefined) {
      throw new Error(`数据中缺少字段 ${config.valueField}`);
    }

    // 计算波动（-fluctuation% 到 +fluctuation% 之间的随机波动）
    const fluctuationRange = config.fluctuation / 100; // 转换为百分比
    const randomChange = (Math.random() - 0.5) * 2 * fluctuationRange; // -range 到 +range
    const newValue = Number((currentValue * (1 + randomChange)).toFixed(config.decimals));
    const changePercent = Number((randomChange * 100).toFixed(2)); // 转换为百分比

    return {
      code: item[config.codeField], // 股票代码或基金代码
      oldValue: currentValue,
      newValue,
      changePercent
    };
  });

  // 3. 批量执行更新和插入（使用事务确保原子性）
  if (processedData.length > 0) {
    // 准备更新和插入语句（根据config动态生成）
    const updateStmt = db.prepare(config.updateSql);
    const insertStmt = db.prepare(`
      INSERT INTO ${config.insertTable} ${config.insertColumns}
      VALUES (?, ?, ?, ?)
    `);

    // 开启事务批量处理（提高性能，避免多次IO）
    const transaction = db.transaction(() => {
      processedData.forEach(data => {
        // 更新最新价格（stocks表或funds表）
        updateStmt.run(data.newValue, data.code);

        // 插入历史记录（stock_history表或fund_history表）
        // 注意：参数顺序必须与 config.insertColumns 定义的字段顺序一致
        insertStmt.run(
          data.code,        // 对应 stock_code 或 fund_code
          dateStr,          // 对应 date
          data.newValue,    // 对应 price 或 net_value
          data.changePercent // 对应 change_percent
        );
      });
    });

    // 执行事务
    transaction();
    console.log(`Worker 成功处理 ${processedData.length} 条数据，已写入 ${config.insertTable}`);
  }

  // 4. 向主线程返回成功信息
  parentPort.postMessage({
    success: true,
    table: config.insertTable,
    count: processedData.length
  });

} catch (error) {
  // 错误时记录并通知主线程
  console.error(`Worker 处理失败: ${error.message}`);
  parentPort.postMessage({
    success: false,
    error: error.message,
    table: config.insertTable
  });
}