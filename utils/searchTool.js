const { validateCode, BusinessError } = require("share-utils")
const { virtualDataManager, getVirtualDate, formatDate } = require("./virtualDateManager")
// 在文件顶部添加
const db = require('../config/db'); // 路径根据实际项目结构调整
function validateResCode(req) {
    try {
        const code = req.params.code;
        const day = req.query.day;
        console.log("validateResCode is running", code, day);
        console.log(typeof (code));

        validateCode(code); // 验证 code 合法性

        // 统一返回对象，day 不存在时为 undefined
        return {
            code,
            day: day !== undefined ? parseInt(day, 10) : undefined
        };
    } catch (err) {
        throw new BusinessError(err.message);
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
        from ${historyTableName}
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


module.exports = {
    validateResCode,
    getHistory,
    getItemFromJoinSearch
}