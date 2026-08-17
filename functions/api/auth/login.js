/**
 * 登录 API
 * POST /api/auth/login
 * 验证邮箱密码，返回 JWT 并设置 Cookie
 */

import { queryFirst } from '../../utils/db.mjs';
import { verifyPassword } from '../../utils/password.mjs';
import { generateJWT, createAuthResponse, errorResponse, badRequestResponse } from '../../utils/response.mjs';

// ============================================================
// POST /api/auth/login
// ============================================================
export async function onRequest(context) {
    const { request, env } = context;

    // 只接受 POST 请求
    if (request.method !== 'POST') {
        return errorResponse('Method not allowed', 405);
    }

    try {
        // 解析请求体
        const body = await request.json();
        const { email, password } = body;

        // 校验参数
        if (!email || !password) {
            return badRequestResponse('请输入邮箱和密码');
        }

        // 查询用户
        const result = await queryFirst(
            env.DB,
            'SELECT id, email, nickname, role, password_hash, is_active FROM users WHERE email = ?',
            [email.trim().toLowerCase()]
        );

        if (!result.success) {
            return errorResponse('数据库查询失败', 500);
        }

        const user = result.data;

        // 检查用户是否存在
        if (!user) {
            return errorResponse('账号或密码错误', 401);
        }

        // 检查用户是否被禁用
        if (user.is_active === 0) {
            return errorResponse('账号已被禁用，请联系管理员', 403);
        }

        // 验证密码
        const isValid = await verifyPassword(password, user.password_hash);
        if (!isValid) {
            return errorResponse('账号或密码错误', 401);
        }

        // 生成 JWT
        const token = generateJWT(
            { id: user.id, email: user.email },
            env.JWT_SECRET
        );

        // 返回用户信息（不含密码）
        const userData = {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            role: user.role
        };

        // 返回响应并设置 Cookie
        return createAuthResponse({ user: userData }, token);

    } catch (err) {
        console.error('[Login] 登录失败:', err);
        return errorResponse('登录失败，请稍后重试', 500);
    }
}
