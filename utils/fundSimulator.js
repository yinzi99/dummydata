const db = require('../config/db');

let virtualDate = new Date('2025-01-01'); // 初始虚拟日期

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function simulateFundNetValue() {
  const funds = db.prepare('SELECT fund_code, latest_net_value FROM funds').all();
  funds.forEach(fund => {
    // 随机波动 ±1%
    const changePercent = (Math.random() * 2 - 1).toFixed(2); // -1% ~ +1%
    const newNetValue = +(fund.latest_net_value * (1 + changePercent / 100)).toFixed(4);

    // 更新最新净值
    db.prepare('UPDATE funds SET latest_net_value = ? WHERE fund_code = ?')
      .run(newNetValue, fund.fund_code);

    // 插入历史净值
    db.prepare('INSERT INTO fund_history (fund_code, date, net_value) VALUES (?, ?, ?)')
      .run(fund.fund_code, formatDate(virtualDate), newNetValue);
  });

  // 虚拟日期加一天
  virtualDate.setDate(virtualDate.getDate() + 1);
  console.log(`模拟基金净值已更新: ${formatDate(virtualDate)}`);
}

// 每分钟模拟一次
setInterval(simulateFundNetValue, 60 * 1000);

module.exports = { simulateFundNetValue };