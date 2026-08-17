/**
 * 管理员 - 用户管理 API
 * GET /api/admin/users - 获取用户列表
 * POST /api/admin/users - 添加用户
 */

import { query, queryFirst, execute } from '../../utils/db.mjs';
import {
    successResponse,
    errorResponse,
    badRequestResponse,
    unauthorizedResponse,
    forbiddenResponse,
    conflictResponse
} from '../../utils/response.mjs';
import { hashPassword } from '../../utils/password.mjs';
import { isValidEmail, isValidPassword } from '../../utils/validator.mjs';

// ============================================================
// GET /api/admin/users - 获取用户列表
// ============================================================
export async function onRequestGet(context) {
    const { env, user } = context;

    // 检查登录
    if (!user) {
        return unauthorizedResponse('请先登录');
    }

    // 检查管理员权限
    if (user.role !== 'admin') {
        return forbiddenResponse('仅管理员可访问');
    }

    try {
        const result = await query(
            env.DB,
            'SELECT id, email, nickname, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC'
        );

        if (!result.success) {
            return errorResponse('查询用户失败', 500);
        }

        return successResponse(result.data, '获取成功');

    } catch (err) {
        console.error('[Admin Users] GET 失败:', err);
        return errorResponse('获取用户列表失败', 500);
    }
}

// ============================================================
// POST /api/admin/users - 添加用户
// ============================================================
export async function onRequestPost(context) {
    const { request, env, user } = context;

    // 检查登录
    if (!user) {
        return unauthorizedResponse('请先登录');
    }

    // 检查管理员权限
    if (user.role !== 'admin') {
        return forbiddenResponse('仅管理员可添加用户');
    }

    try {
        const body = await request.json();
        const { email, nickname, password, role = 'viewer' } = body;

        // 校验
        if (!email || !email.trim()) {
            return badRequestResponse('请输入邮箱');
        }

        if (!isValidEmail(email)) {
            return badRequestResponse('邮箱格式不正确');
        }

        if (!nickname || !nickname.trim()) {
            return badRequestResponse('请输入昵称');
        }

        if (!password) {
            return badRequestResponse('请设置密码');
        }

        if (!isValidPassword(password)) {
            return badRequestResponse('密码至少6位');
        }

        // 检查邮箱是否已存在
        const existResult = await queryFirst(
            env.DB,
            'SELECT id FROM users WHERE email = ?',
            [email.trim().toLowerCase()]
        );

        if (existResult.success && existResult.data) {
            return conflictResponse('该邮箱已被注册');
        }

        // 哈希密码
        const passwordHash = await hashPassword(password);

        // 生成用户 ID
        const id = crypto.randomUUID();
        const now = Date.now();

        // 插入用户
        const insertResult = await execute(
            env.DB,
            `
                INSERT INTO users (
                    id, email, password_hash, nickname, role, is_active, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                id,
                email.trim().toLowerCase(),
                passwordHash,
                nickname.trim(),
                role === 'admin' ? 'admin' : 'viewer',
                1,
                now,
                now
            ]
        );

        if (!insertResult.success) {
            return errorResponse('添加用户失败', 500);
        }

        return successResponse(
            {
                id,
                email: email.trim().toLowerCase(),
                nickname: nickname.trim(),
                role: role === 'admin' ? 'admin' : 'viewer'
            },
            '用户添加成功'
        );

    } catch (err) {
        console.error('[Admin Users] POST 失败:', err);
        return errorResponse('添加用户失败', 500);
    }
}
