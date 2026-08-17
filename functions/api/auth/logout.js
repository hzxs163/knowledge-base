/**
 * 登出 API
 * POST /api/auth/logout
 * 清除登录状态
 */

import { clearAuthResponse, errorResponse } from '../../utils/response.mjs';

// ============================================================
// POST /api/auth/logout
// ============================================================
export async function onRequest(context) {
    const { request } = context;

    // 只接受 POST 请求
    if (request.method !== 'POST') {
        return errorResponse('Method not allowed', 405);
    }

    // 清除 Cookie
    return clearAuthResponse();
}
