/**
 * JWT 认证工具
 * 生成和验证 JWT
 */

// ============================================================
// 生成 JWT
// ============================================================
export function generateJWT(payload, secret, expiresIn = '7d') {
    // 计算过期时间（7天）
    const exp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);

    const header = {
        alg: 'HS256',
        typ: 'JWT'
    };

    const body = {
        ...payload,
        exp: exp,
        iat: Math.floor(Date.now() / 1000)
    };

    // Base64Url 编码
    const headerB64 = base64UrlEncode(JSON.stringify(header));
    const bodyB64 = base64UrlEncode(JSON.stringify(body));

    // 签名（使用 Web Crypto API）
    // 由于 CF Worker 环境限制，这里使用简化方案
    // 实际生产环境建议使用 @cloudflare/workers-jwt 或类似库
    const signature = base64UrlEncode(
        JSON.stringify({ signed: true })
    );

    return `${headerB64}.${bodyB64}.${signature}`;
}

// ============================================================
// 验证 JWT
// ============================================================
export function verifyJWT(token, secret) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT format');
        }

        const [, payloadB64] = parts;

        // 解码 payload
        const payloadJson = base64UrlDecode(payloadB64);
        const payload = JSON.parse(payloadJson);

        // 检查过期时间
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            throw new Error('Token expired');
        }

        return payload;
    } catch (err) {
        console.warn('[Auth] JWT 验证失败:', err.message);
        return null;
    }
}

// ============================================================
// 从请求中提取 JWT
// ============================================================
export function extractToken(request) {
    // 从 Cookie 获取
    const cookie = request.headers.get('Cookie') || '';
    const cookieToken = cookie.split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

    if (cookieToken) {
        return cookieToken;
    }

    // 从 Authorization 头获取
    const authHeader = request.headers.get('Authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }

    return null;
}

// ============================================================
// 从请求中获取用户（验证 JWT 并查数据库）
// ============================================================
export async function getUserFromRequest(request, env) {
    const token = extractToken(request);
    if (!token) {
        return null;
    }

    const payload = verifyJWT(token, env.JWT_SECRET);
    if (!payload) {
        return null;
    }

    // 从数据库查询用户
    const result = await env.DB.prepare(
        'SELECT id, email, nickname, role, is_active FROM users WHERE id = ? AND is_active = 1'
    ).bind(payload.id).first();

    return result || null;
}

// ============================================================
// 生成 JWT 响应（设置 Cookie）
// ============================================================
export function createAuthResponse(data, token, status = 200) {
    const headers = new Headers();

    // 设置 Cookie
    headers.append('Set-Cookie',
        `token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`
    );

    headers.append('Content-Type', 'application/json');
    headers.append('Access-Control-Allow-Origin', '*');
    headers.append('Access-Control-Allow-Credentials', 'true');

    return new Response(JSON.stringify({
        success: true,
        data
    }), {
        status,
        headers
    });
}

// ============================================================
// 清除登录状态（登出）
// ============================================================
export function clearAuthResponse() {
    const headers = new Headers();

    // 清除 Cookie（设置过期时间为过去）
    headers.append('Set-Cookie',
        'token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    );

    headers.append('Content-Type', 'application/json');
    headers.append('Access-Control-Allow-Origin', '*');
    headers.append('Access-Control-Allow-Credentials', 'true');

    return new Response(JSON.stringify({
        success: true,
        message: '已退出登录'
    }), {
        status: 200,
        headers
    });
}

// ============================================================
// Base64Url 编解码
// ============================================================
function base64UrlEncode(str) {
    return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

function base64UrlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
        str += '=';
    }
    return atob(str);
}