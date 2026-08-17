/**
 * 获取当前用户信息 API
 * GET /api/auth/me
 * 返回当前登录用户信息
 */

import { getUserFromRequest } from '../../utils/auth.js';
import { successResponse, errorResponse, unauthorizedResponse } from '../../utils/response.js';

// ============================================================
// GET /api/auth/me
// ============================================================
export async function onRequest(context) {
    const { request, env } = context;

    // 只接受 GET 请求
    if (request.method !== 'GET') {
        return errorResponse('Method not allowed', 405);
    }

    try {
        // 从请求中获取用户
        const user = await getUserFromRequest(request, env);

        if (!user) {
            return unauthorizedResponse('请先登录');
        }

        // 返回用户信息（不含密码）
        const userData = {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            role: user.role,
            is_active: user.is_active
        };

        return successResponse(userData, '获取成功');

    } catch (err) {
        console.error('[Me] 获取用户信息失败:', err);
        return errorResponse('获取用户信息失败', 500);
    }
}