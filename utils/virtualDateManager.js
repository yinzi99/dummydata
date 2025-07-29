const db = require('../config/db');
const { BusinessError } = require('share-utils');
// 全局虚拟时间变量（模块内部维护）
let virtualDate;

// 格式化日期为 YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// 初始化虚拟时间（仅启动时执行一次）
function initVirtualDate() {
  const stockRow = db.prepare('SELECT MAX(date) as maxDate FROM stock_history').get();
  
  if (stockRow && stockRow.maxDate) {
    virtualDate = new Date(stockRow.maxDate);
    virtualDate.setDate(virtualDate.getDate() + 1);
  } else {
    virtualDate = new Date('2025-01-01');
  }
  
  console.log(`初始化虚拟时间: ${formatDate(virtualDate)}`);
}

// 更新虚拟时间（每次模拟后 +1 天）
function incrementVirtualDate() {
  if (!virtualDate) {
    throw new BusinessError('虚拟时间尚未初始化，请先调用initVirtualDate()');
  }
  virtualDate.setDate(virtualDate.getDate() + 1);
}

// 获取当前虚拟时间（原始Date对象）
function getVirtualDate() {
  if (!virtualDate) {
    throw new BusinessError('虚拟时间尚未初始化，请先调用initVirtualDate()');
  }
  // 返回副本防止外部直接修改原对象
  return new Date(virtualDate);
}

// 获取格式化后的虚拟时间（YYYY-MM-DD）
function getFormattedVirtualDate() {
  return formatDate(getVirtualDate());
}

// 导出方法供其他文件使用
module.exports = {
  formatDate,
  initVirtualDate,
  incrementVirtualDate,
  getVirtualDate,
  getFormattedVirtualDate
};
