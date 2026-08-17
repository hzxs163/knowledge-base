/**
 * 全局中间件
 * 1. 加载所有工具函数，挂载到 context
 * 2. JWT 解析 + 用户信息注入
 * 3. CORS 处理
 * 4. 权限拦截
 */

// ============================================================
// 工具函数：数据库
// ============================================================
const dbUtils = {
    async query(db, sql, params = []) {
        try {
            const stmt = db.prepare(sql);
            const bound = stmt.bind(...params);
            const result = await bound.all();
            return { success: true, data: result.results || [], meta: result.meta };
        } catch (err) {
            console.error('[DB] query error:', err);
            return { success: false, error: err.message, data: [] };
        }
    },

    async queryFirst(db, sql, params = []) {
        try {
            const stmt = db.prepare(sql);
            const bound = stmt.bind(...params);
            const result = await bound.first();
            return { success: true, data: result || null };
        } catch (err) {
            console.error('[DB] queryFirst error:', err);
            return { success: false, error: err.message, data: null };
        }
    },

    async execute(db, sql, params = []) {
        try {
            const stmt = db.prepare(sql);
            const bound = stmt.bind(...params);
            const result = await bound.run();
            return { success: true, data: result, meta: result.meta };
        } catch (err) {
            console.error('[DB] execute error:', err);
            return { success: false, error: err.message };
        }
    },

    buildInsert(table, data) {
        const keys = Object.keys(data);
        const placeholders = keys.map(() => '?').join(', ');
        const columns = keys.join(', ');
        const values = Object.values(data);
        return { sql: `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`, params: values };
    },

    buildUpdate(table, data, where, whereParams = []) {
        const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = Object.values(data);
        return { sql: `UPDATE ${table} SET ${setClause} WHERE ${where}`, params: [...values, ...whereParams] };
    },

    buildSelect(table, options = {}) {
        const { where = '', whereParams = [], orderBy = 'created_at DESC', limit = 20, offset = 0, fields = '*' } = options;
        let sql = `SELECT ${fields} FROM ${table}`;
        if (where) sql += ` WHERE ${where}`;
        sql += ` ORDER BY ${orderBy}`;
        sql += ` LIMIT ${limit} OFFSET ${offset}`;
        return { sql, params: whereParams };
    },

    buildCount(table, where = '', whereParams = []) {
        let sql = `SELECT COUNT(*) as total FROM ${table}`;
        if (where) sql += ` WHERE ${where}`;
        return { sql, params: whereParams };
    }
};


// ============================================================
// 工具函数：响应
// ============================================================
const responseUtils = {
    success(data, message = 'success') {
        return new Response(JSON.stringify({ success: true, message, data }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    },

    error(msg, status = 400, code = null) {
        const body = { success: false, error: msg };
        if (code) body.code = code;
        return new Response(JSON.stringify(body), {
            status,
            headers: { 'Content-Type': 'application/json' }
        });
    },

    unauthorized(msg = '请先登录') {
        return this.error(msg, 401, 'UNAUTHORIZED');
    },

    forbidden(msg = '权限不足') {
        return this.error(msg, 403, 'FORBIDDEN');
    },

    notFound(msg = '资源不存在') {
        return this.error(msg, 404, 'NOT_FOUND');
    },

    badRequest(msg = '参数错误') {
        return this.error(msg, 400, 'BAD_REQUEST');
    },

    conflict(msg = '资源已存在') {
        return this.error(msg, 409, 'CONFLICT');
    },

    paginated(data, page, limit, total) {
        return {
            data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    },

    json(data, status = 200) {
        const response = new Response(JSON.stringify(data), {
            status,
            headers: { 'Content-Type': 'application/json' }
        });
        this._addCors(response);
        return response;
    },

    _addCors(response) {
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
    }
};


// ============================================================
// 工具函数：密码
// ============================================================
const passwordUtils = {
    async hash(password) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (err) {
            console.error('[Password] 哈希失败:', err);
            throw new Error('密码加密失败');
        }
    },

    async verify(password, hash) {
        try {
            const newHash = await this.hash(password);
            return newHash === hash;
        } catch {
            return false;
        }
    },

    generate(length = 12) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
};


// ============================================================
// 工具函数：验证器
// ============================================================
const validatorUtils = {
    email(email) {
        if (!email || typeof email !== 'string') return false;
        return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email.trim());
    },

    password(pwd) {
        if (!pwd || typeof pwd !== 'string') return false;
        return pwd.trim().length >= 6;
    },

    slug(slug) {
        if (!slug || typeof slug !== 'string') return false;
        return /^[a-z0-9\-]+$/.test(slug);
    },

    notEmpty(val) {
        if (val === null || val === undefined) return false;
        if (typeof val === 'string') return val.trim().length > 0;
        if (Array.isArray(val)) return val.length > 0;
        return true;
    },

    url(url) {
        if (!url || typeof url !== 'string') return false;
        try {
            const parsed = new URL(url);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch { return false; }
    },

    status(status) {
        return ['draft', 'published', 'archived'].includes(status);
    },

    role(role) {
        return ['admin', 'viewer'].includes(role);
    }
};


// ============================================================
// 工具函数：JWT
// ============================================================
const authUtils = {
    base64UrlEncode(str) {
        return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    },

    base64UrlDecode(str) {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) str += '=';
        return atob(str);
    },

    generateJWT(payload, secret) {
        const exp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
        const header = this.base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const body = this.base64UrlEncode(JSON.stringify({ ...payload, exp, iat: Math.floor(Date.now() / 1000) }));
        const signature = this.base64UrlEncode(JSON.stringify({ signed: true }));
        return `${header}.${body}.${signature}`;
    },

    verifyJWT(token, secret) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) throw new Error('Invalid JWT');
            const payloadJson = this.base64UrlDecode(parts[1]);
            const payload = JSON.parse(payloadJson);
            if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
                throw new Error('Token expired');
            }
            return payload;
        } catch (err) {
            console.warn('[Auth] JWT 验证失败:', err.message);
            return null;
        }
    },

    extractToken(request) {
        const cookie = request.headers.get('Cookie') || '';
        const cookieToken = cookie.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1];
        if (cookieToken) return cookieToken;
        const authHeader = request.headers.get('Authorization') || '';
        if (authHeader.startsWith('Bearer ')) return authHeader.slice(7);
        return null;
    },

    createAuthResponse(data, token) {
        const headers = new Headers();
        headers.append('Set-Cookie', `token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`);
        headers.append('Content-Type', 'application/json');
        headers.append('Access-Control-Allow-Origin', '*');
        headers.append('Access-Control-Allow-Credentials', 'true');
        return new Response(JSON.stringify({ success: true, data }), { status: 200, headers });
    },

    clearAuthResponse() {
        const headers = new Headers();
        headers.append('Set-Cookie', 'token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
        headers.append('Content-Type', 'application/json');
        headers.append('Access-Control-Allow-Origin', '*');
        headers.append('Access-Control-Allow-Credentials', 'true');
        return new Response(JSON.stringify({ success: true, message: '已退出登录' }), { status: 200, headers });
    }
};


// ============================================================
// 工具函数：Slug 生成
// ============================================================
const slugUtils = {
    _pinyinMap: {
        '水': 'shui', '供': 'gong', '制': 'zhi', '冷': 'leng',
        '消': 'xiao', '防': 'fang', '环': 'huan', '保': 'bao',
        '压': 'ya', '空': 'kong', '氮': 'dan', '污': 'wu',
        '换': 'huan', '算': 'suan', '纯': 'chun', '膜': 'mo',
        '替': 'ti', '操': 'cao', '作': 'zuo', '规': 'gui',
        '程': 'cheng', '维': 'wei', '护': 'hu', '检': 'jian',
        '修': 'xiu', '安': 'an', '全': 'quan', '管': 'guan',
        '理': 'li', '运': 'yun', '行': 'xing', '调': 'tiao',
        '试': 'shi', '验': 'yan', '收': 'shou', '记': 'ji',
        '录': 'lu', '报': 'bao', '告': 'gao', '总': 'zong',
        '结': 'jie', '方': 'fang', '案': 'an', '标': 'biao',
        '准': 'zhun', '范': 'fan', '手': 'shou', '册': 'ce',
        '指': 'zhi', '南': 'nan', '计': 'ji', '划': 'hua',
        '评': 'ping', '估': 'gu', '测': 'ce', '量': 'liang'
    },

    generate(text, maxLength = 60) {
        if (!text) return '';
        let slug = text
            .toLowerCase()
            .split('')
            .map(char => this._pinyinMap[char] || char)
            .join('')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9\u4e00-\u9fa5\-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        if (!slug) slug = Date.now().toString();
        if (slug.length > maxLength) {
            slug = slug.slice(0, maxLength).replace(/-[^-]*$/, '');
        }
        return slug;
    },

    slugify(title) {
        if (!title) return '';
        if (/^[a-zA-Z0-9\s\-]+$/.test(title)) {
            return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
        }
        return this.generate(title);
    },

    isValid(slug) {
        if (!slug) return false;
        return /^[a-z0-9\-]+$/.test(slug);
    },

    unique(text) {
        const base = this.slugify(text) || 'article';
        const suffix = Math.random().toString(36).slice(2, 6);
        return `${base}-${suffix}`;
    }
};


// ============================================================
// 全局中间件入口
// ============================================================
export async function onRequest(context) {
    const { request, env, next } = context;
    const url = new URL(request.url);

    // ---- CORS 预检 ----
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Max-Age': '86400'
            }
        });
    }

    // ---- 注入工具函数到 context ----
    context.db = dbUtils;
    context.res = responseUtils;
    context.pwd = passwordUtils;
    context.val = validatorUtils;
    context.auth = authUtils;
    context.slug = slugUtils;

    // ---- 解析用户 ----
    let user = null;
    const token = authUtils.extractToken(request);
    if (token) {
        try {
            const payload = authUtils.verifyJWT(token, env.JWT_SECRET);
            if (payload) {
                const result = await env.DB.prepare(
                    'SELECT id, email, nickname, role, is_active FROM users WHERE id = ?'
                ).bind(payload.id).first();
                if (result && result.is_active === 1) {
                    user = result;
                }
            }
        } catch (e) { /* ignore */ }
    }
    context.user = user;

    // ---- 路由分发：所有 API 请求都走 /api.js ----
    // 判断是否是 API 请求
    if (url.pathname.startsWith('/api/')) {
        // 调用 api.js 处理
        const apiModule = await import('./api.js');
        return apiModule.onRequest(context);
    }

    // ---- 非 API 请求：直接放行（前端静态资源） ----
    const response = await next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    return response;
}
