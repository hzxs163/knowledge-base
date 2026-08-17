/**
 * D1 数据库操作封装
 */

// ============================================================
// 执行查询（返回所有行）
// ============================================================
async function query(db, sql, params = []) {
    try {
        const stmt = db.prepare(sql);
        const bound = stmt.bind(...params);
        const result = await bound.all();
        return {
            success: true,
            data: result.results || [],
            meta: result.meta
        };
    } catch (err) {
        console.error('[DB] query error:', err);
        return {
            success: false,
            error: err.message,
            data: []
        };
    }
}

// ============================================================
// 执行查询（返回第一行）
// ============================================================
async function queryFirst(db, sql, params = []) {
    try {
        const stmt = db.prepare(sql);
        const bound = stmt.bind(...params);
        const result = await bound.first();
        return {
            success: true,
            data: result || null
        };
    } catch (err) {
        console.error('[DB] queryFirst error:', err);
        return {
            success: false,
            error: err.message,
            data: null
        };
    }
}

// ============================================================
// 执行写入（INSERT / UPDATE / DELETE）
// ============================================================
async function execute(db, sql, params = []) {
    try {
        const stmt = db.prepare(sql);
        const bound = stmt.bind(...params);
        const result = await bound.run();
        return {
            success: true,
            data: result,
            meta: result.meta
        };
    } catch (err) {
        console.error('[DB] execute error:', err);
        return {
            success: false,
            error: err.message
        };
    }
}

// ============================================================
// 批量执行（事务）
// ============================================================
async function batch(db, operations) {
    try {
        const results = [];
        for (const op of operations) {
            const { sql, params = [] } = op;
            const stmt = db.prepare(sql);
            const bound = stmt.bind(...params);
            const result = await bound.run();
            results.push(result);
        }
        return {
            success: true,
            data: results
        };
    } catch (err) {
        console.error('[DB] batch error:', err);
        return {
            success: false,
            error: err.message
        };
    }
}

// ============================================================
// 构建 INSERT 语句
// ============================================================
function buildInsert(table, data) {
    const keys = Object.keys(data);
    const placeholders = keys.map(() => '?').join(', ');
    const columns = keys.join(', ');
    const values = Object.values(data);

    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
    return { sql, params: values };
}

// ============================================================
// 构建 UPDATE 语句
// ============================================================
function buildUpdate(table, data, where, whereParams = []) {
    const setClause = Object.keys(data)
        .map(key => `${key} = ?`)
        .join(', ');
    const values = Object.values(data);

    const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
    return { sql, params: [...values, ...whereParams] };
}

// ============================================================
// 构建 SELECT 语句（带分页）
// ============================================================
function buildSelect(table, options = {}) {
    const {
        where = '',
        whereParams = [],
        orderBy = 'created_at DESC',
        limit = 20,
        offset = 0,
        fields = '*'
    } = options;

    let sql = `SELECT ${fields} FROM ${table}`;

    if (where) {
        sql += ` WHERE ${where}`;
    }

    sql += ` ORDER BY ${orderBy}`;
    sql += ` LIMIT ${limit} OFFSET ${offset}`;

    return { sql, params: whereParams };
}

// ============================================================
// 构建 COUNT 语句
// ============================================================
function buildCount(table, where = '', whereParams = []) {
    let sql = `SELECT COUNT(*) as total FROM ${table}`;
    if (where) {
        sql += ` WHERE ${where}`;
    }
    return { sql, params: whereParams };
}

// ============================================================
// 导出
// ============================================================
module.exports = {
    query,
    queryFirst,
    execute,
    batch,
    buildInsert,
    buildUpdate,
    buildSelect,
    buildCount
};
