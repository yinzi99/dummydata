const { validateCode, BusinessError } = require("share-utils")
const { virtualDataManager, getVirtualDate, formatDate } = require("./virtualDateManager")
    // 在文件顶部添加
const db = require('../config/db'); // 路径根据实际项目结构调整
function validateResCode(req) {
    try {
        let { code } = req.params;
        let { day } = req.query;
        console.log(code, day);
        console.log(typeof(code));
        validateCode(code);
        if (day !== undefined) {
            day = parseInt(day, 10);
            console.log("验证成功", code, day);
            return { code, day };
        }
        console.log("验证成功", code);
        return code;
    } catch (err) {
        throw new BusinessError(err.message)

    }
}

function getHistory(code, fieldName, day, tableName) {
    try {
        let rows = searchHistroyFromDB(code, fieldName, day, tableName);
        return rows.map(row => row.price);
    } catch (err) {
        throw new BusinessError(err.message)
    }
}

function searchHistroyFromDB(code, fieldName, day, historyTableName) {
    try {
        const virtualDate = getVirtualDate();
        console.log("获取虚拟时间错误");
        const startDate = new Date(virtualDate);
        startDate.setDate(startDate.getDate() - day);

        let sql = `
        SELECT price
        FROM ${historyTableName}
        WHERE ${fieldName} = ?
            AND date >= ?
            AND date <= ?
        ORDER BY date ASC`;
        return db.prepare(sql).all(code, formatDate(startDate), formatDate(virtualDate));
    } catch (err) {
        throw new BusinessError(err.message)
    }
}

const getItemFromJoinSearch = (code, codeName, tableName, historyTableName) => {
    console.log("getItemfromJoinSearch is running");
    console.log(code, codeName, tableName, historyTableName);
    try {
        const sql =
            `select t.*, h.change_percent
        from ${tableName} t
        left join (
        select ${codeName} , change_percent
        from ${historyTableName}l
        where ${codeName} = ?  
        order by date desc
        limit 1
        ) h on t.${codeName} = h.${codeName}  
        where t.${codeName} = ?  `;
        let result = db.prepare(sql).get(code, code);
        console.log("getItemfromJoinSearch is running", result);
        return result;
    } catch (err) {
        console.log("get失败");
        throw new BusinessError(err.message);
    }

}

function getRecommendedStock(days = 30, top = 5, maxPE = 100, minTurnover = 0) {
    console.log("调用 getRecommendedStock 函数，参数如下：", {
        days,
        top,
        maxPE,
        minTurnover
    });

    // 1. 查询基础股票
    const baseStocks = db.prepare(`
        SELECT * FROM stocks 
        WHERE pe_ratio <= ? AND turnover_rate >= ?
    `).all(maxPE, minTurnover);

    console.log("获取基础股票成功，共", baseStocks.length, "条");
    if (baseStocks.length === 0) {
        console.warn("警告：没有符合条件的基础股票，请检查筛选条件！");
    }

    const scoredStocks = [];

    // 2. 遍历每个基础股票，计算评分
    baseStocks.forEach((stock, idx) => {
        console.log(`\n[${idx + 1}/${baseStocks.length}] 处理股票 ${stock.stock_code} (${stock.name})`);

        // 获取历史价格
        const rows = db.prepare(`
            SELECT price FROM stock_history
            WHERE stock_code = ?
            ORDER BY date DESC
            LIMIT ?
        `).all(stock.stock_code, days);

        const prices = rows.map(r => Number(r.price)).filter(p => !isNaN(p));
        console.log(`  ➤ 获取历史价格：共 ${rows.length} 条，有效价格 ${prices.length} 条`);

        if (prices.length < days) {
            console.log(`  ⛔ 跳过：历史价格不足 ${days} 天`);
            return;
        }

        const latest = prices[0];
        const earliest = prices[prices.length - 1];

        if (!earliest || earliest <= 0) {
            console.log(`  ⛔ 跳过：起始价格为 0，避免除以零`);
            return;
        }

        // 3. 计算各项指标
        const returnRate = (latest - earliest) / earliest;

        const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
        const stddev = Math.sqrt(prices.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / prices.length);

        let maxPrice = prices[0];
        let maxDrawdown = 0;
        for (const price of prices) {
            if (price > maxPrice) maxPrice = price;
            const drawdown = (maxPrice - price) / maxPrice;
            if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        }

        const peScore = stock.pe_ratio > 0 ? 1 / stock.pe_ratio : 0;

        const score = (
            returnRate * 100 * 0.4 +
            (1 - stddev) * 100 * 0.25 +
            (1 - maxDrawdown) * 100 * 0.2 +
            peScore * 100 * 0.15
        );

        const recommend_reason = score > 85 ?
            '收益高，估值低，表现优异' :
            score > 70 ?
            '稳健上升，值得关注' :
            '波动大，需谨慎';

        // 4. 构造结果
        const stockResult = {
            ...stock,
            score: Number(score.toFixed(2)),
            return_rate: Number(returnRate.toFixed(4)),
            volatility: Number(stddev.toFixed(4)),
            max_drawdown: Number(maxDrawdown.toFixed(4)),
            pe_inverse: Number(peScore.toFixed(4)),
            recommend_reason
        };

        console.log(`  ✅ 评分成功：score = ${stockResult.score}, 推荐理由：${recommend_reason}`);

        scoredStocks.push(stockResult);
    });

    // 5. 排序并截取
    scoredStocks.sort((a, b) => b.score - a.score);
    const finalResult = scoredStocks.slice(0, top);

    console.log("\n最终推荐股票如下：");
    console.table(finalResult.map(s => ({
        股票: s.name,
        代码: s.stock_code,
        评分: s.score,
        收益率: s.return_rate,
        波动率: s.volatility,
        最大回撤: s.max_drawdown,
        推荐: s.recommend_reason
    })));

    return finalResult;
}

function getRecommendedFund(days = 30, top = 5, minSize = 1e9) {
    console.log("调用 getRecommendedFund 函数，参数如下：", {
        days,
        top,
        minSize
    });

    // 1. 构建 SQL 查询（已去除 fund_type）
    const sql = `SELECT * FROM funds WHERE fund_size >= ?`;
    const params = [minSize];

    // 2. 查询基金列表
    const funds = db.prepare(sql).all(...params);
    console.log("获取基础基金成功，共", funds.length, "条");
    if (funds.length === 0) {
        console.warn("⚠️ 没有符合条件的基金，请检查筛选条件！");
    }

    const result = [];

    // 3. 遍历每只基金
    funds.forEach((fund, idx) => {
        console.log(`\n[${idx + 1}/${funds.length}] 处理基金 ${fund.fund_code} (${fund.short_name})`);

        const rows = db.prepare(`
            SELECT price FROM fund_history
            WHERE fund_code = ?
            ORDER BY date DESC
            LIMIT ?
        `).all(fund.fund_code, days);

        const history = rows.map(r => Number(r.price)).filter(v => !isNaN(v));
        console.log(`  ➤ 获取历史净值：共 ${rows.length} 条，有效净值 ${history.length} 条`);

        if (history.length < days) {
            console.log(`  ⛔ 跳过：历史净值不足 ${days} 天`);
            return;
        }

        const latest = history[0];
        const earliest = history[history.length - 1];
        if (!earliest || earliest <= 0) {
            console.log(`  ⛔ 跳过：起始净值为 0，避免除以零`);
            return;
        }

        // 4. 计算指标
        const returnRate = (latest - earliest) / earliest;
        const avg = history.reduce((a, b) => a + b, 0) / history.length;
        const volatility = Math.sqrt(history.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / history.length);

        let max = history[0];
        let maxDrawdown = 0;
        for (const v of history) {
            if (v > max) max = v;
            const drawdown = (max - v) / max;
            if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        }

        // 5. 计算评分（去掉基金规模项，重新分配权重）
        const score = (
            returnRate * 100 * 0.5 +
            (1 - volatility) * 100 * 0.3 +
            (1 - maxDrawdown) * 100 * 0.2
        );

        const recommend_reason = score > 85 ? '收益稳定，回撤低' :
            score > 70 ? '表现良好' :
            '波动较大';

        const fundResult = {
            ...fund,
            score: Number(score.toFixed(2)),
            return_rate: Number((returnRate * 100).toFixed(2)),
            volatility: Number(volatility.toFixed(4)),
            max_drawdown: Number((maxDrawdown * 100).toFixed(2)),
            recommend_reason
        };

        console.log(`  ✅ 评分成功：score = ${fundResult.score}, 推荐理由：${recommend_reason}`);
        result.push(fundResult);
    });

    // 6. 排序并返回
    result.sort((a, b) => b.score - a.score);
    const finalResult = result.slice(0, top);

    console.log("\n最终推荐基金如下：");
    console.table(finalResult.map(f => ({
        基金: f.short_name,
        代码: f.fund_code,
        评分: f.score,
        收益率: f.return_rate,
        波动率: f.volatility,
        最大回撤: f.max_drawdown,
        推荐: f.recommend_reason
    })));

    return finalResult;
}





module.exports = {
    validateResCode,
    getHistory,
    getItemFromJoinSearch,
    getRecommendedStock,
    getRecommendedFund
}