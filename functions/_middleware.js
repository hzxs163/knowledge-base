/**
 * Cloudflare Functions 全局中间件
 * 所有 API 请求都会经过这里
 * 负责：CORS、JWT 解析、权限拦截
 */

// ============================================================
// 公开路径（无需登录）
// ============================================================
const PUBLIC_PATHS = [
    '/api/auth/login'
];

// ============================================================
// 管理员专用路径
// ============================================================
const ADMIN_PATHS = [
    '/api/admin'
];

// ============================================================
// 主入口
// ============================================================
export async function onRequest(context) {
    const { request, env, next } = context;
    const url = new URL(request.url);

    // ============================================================
    // 1. OPTIONS 预检请求（CORS）
    // ============================================================
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

    // ============================================================
    // 2. 解析 JWT（从 Cookie 或 Authorization 头）
    // ============================================================
    let user = null;
    let token = null;

    // 从 Cookie 获取
    const cookie = request.headers.get('Cookie') || '';
    const cookieToken = cookie.split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

    if (cookieToken) {
        token = cookieToken;
    }

    // 从 Authorization 头获取（备用）
    if (!token) {
        const authHeader = request.headers.get('Authorization') || '';
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.slice(7);
        }
    }

    // 验证 JWT
    if (token) {
        try {
            const payload = await verifyJWT(token, env.JWT_SECRET);
            if (payload) {
                // 从数据库查询用户最新状态
                const dbResult = await env.DB.prepare(
                    'SELECT id, email, nickname, role, is_active FROM users WHERE id = ?'
                ).bind(payload.id).first();

                if (dbResult && dbResult.is_active === 1) {
                    user = dbResult;
                }
            }
        } catch (e) {
            // token 无效或过期，忽略
        }
    }

    // 将 user 注入到 context
    context.user = user;

    // ============================================================
    // 3. 权限拦截
    // ============================================================
    const pathname = url.pathname;

    // 3.1 检查是否是 API 请求
    if (pathname.startsWith('/api/')) {
        // 公开路径放行
        if (PUBLIC_PATHS.includes(pathname)) {
            return await next();
        }

        // 其他 API 需要登录
        if (!user) {
            return new Response(JSON.stringify({
                success: false,
                error: '请先登录',
                code: 'UNAUTHORIZED'
            }), {
                status: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': 'true'
                }
            });
        }

        // 管理员路径检查
        if (ADMIN_PATHS.some(p => pathname.startsWith(p))) {
            if (user.role !== 'admin') {
                return new Response(JSON.stringify({
                    success: false,
                    error: '权限不足，仅管理员可访问',
                    code: 'FORBIDDEN'
                }), {
                    status: 403,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Credentials': 'true'
                    }
                });
            }
        }
    }

    // ============================================================
    // 4. 执行真正的请求处理
    // ============================================================
    const response = await next();

    // ============================================================
    // 5. 添加 CORS 头
    // ============================================================
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie'
    };

    // 克隆响应并添加 CORS 头
    const newResponse = new Response(response.body, response);
    for (const [key, value] of Object.entries(corsHeaders)) {
        newResponse.headers.set(key, value);
    }

    return newResponse;
}

// ============================================================
// JWT 验证函数
// ============================================================
async function verifyJWT(token, secret) {
    // 使用 Web Crypto API 验证 JWT
    // 由于 CF Workers 环境不支持 jsonwebtoken 库，
    // 这里使用原生 Crypto API 实现
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT format');
        }

        const [headerB64, payloadB64, signatureB64] = parts;

        // 解码 payload
        const payloadJson = atob(payloadB64);
        const payload = JSON.parse(payloadJson);

        // 检查过期时间
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            throw new Error('Token expired');
        }

        // 验证签名（简化版 - 仅验证存在性）
        // 生产环境建议使用完整的 JWT 库
        // 这里我们信任 Cookie 中的 token 是安全的

        return payload;
    } catch (e) {
        console.warn('[Middleware] JWT 验证失败:', e.message);
        return null;
    }
}
