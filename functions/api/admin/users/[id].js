/**
 * 管理员 - 单个用户管理 API
 * PUT /api/admin/users/:id - 更新用户信息
 * DELETE /api/admin/users/:id - 删除/禁用用户
 */

import { queryFirst, execute } from '../../utils/db.mjs';
import {
    successResponse,
    errorResponse,
    badRequestResponse,
    unauthorizedResponse,
    forbiddenResponse,
    notFoundResponse
} from '../../utils/response.mjs';
import { hashPassword } from '../../utils/password.mjs';
import { isValidEmail, isValidPassword } from '../../utils/validator.mjs';

// ============================================================
// PUT /api/admin/users/:id - 更新用户信息
// ============================================================
export async function onRequestPut(context) {
    const { request, env, user, params } = context;
    const { id } = params;

    // 检查登录
    if (!user) {
        return unauthorizedResponse('请先登录');
    }

    // 检查管理员权限
    if (user.role !== 'admin') {
        return forbiddenResponse('仅管理员可操作');
    }

    // 不能修改自己
    if (user.id === id) {
        return badRequestResponse('不能修改自己的信息');
    }

    try {
        // 检查用户是否存在
        const existResult = await queryFirst(
            env.DB,
            'SELECT id FROM users WHERE id = ?',
            [id]
        );

        if (!existResult.success || !existResult.data) {
            return notFoundResponse('用户不存在');
        }

        const body = await request.json();
        const { nickname, password, role, is_active } = body;

        // 构建更新语句
        const updates = [];
        const values = [];

        if (nickname !== undefined) {
            if (!nickname.trim()) {
                return badRequestResponse('昵称不能为空');
            }
            updates.push('nickname = ?');
            values.push(nickname.trim());
        }

        if (password !== undefined) {
            if (password && !isValidPassword(password)) {
                return badRequestResponse('密码至少6位');
            }
            if (password) {
                const hash = await hashPassword(password);
                updates.push('password_hash = ?');
                values.push(hash);
            }
        }

        if (role !== undefined) {
            if (role !== 'admin' && role !== 'viewer') {
                return badRequestResponse('角色只能是 admin 或 viewer');
            }
            updates.push('role = ?');
            values.push(role);
        }

        if (is_active !== undefined) {
            if (is_active !== 0 && is_active !== 1) {
                return badRequestResponse('状态只能是 0 或 1');
            }
            updates.push('is_active = ?');
            values.push(is_active);
        }

        // 如果没有更新任何字段
        if (updates.length === 0) {
            return badRequestResponse('没有需要更新的字段');
        }

        updates.push('updated_at = ?');
        values.push(Date.now());
        values.push(id);

        const updateResult = await execute(
            env.DB,
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        if (!updateResult.success) {
            return errorResponse('更新用户失败', 500);
        }

        return successResponse({ id }, '用户更新成功');

    } catch (err) {
        console.error('[Admin User] PUT 失败:', err);
        return errorResponse('更新用户失败', 500);
    }
}

// ============================================================
// DELETE /api/admin/users/:id - 删除/禁用用户
// ============================================================
export async function onRequestDelete(context) {
    const { request, env, user, params } = context;
    const { id } = params;

    // 检查登录
    if (!user) {
        return unauthorizedResponse('请先登录');
    }

    // 检查管理员权限
    if (user.role !== 'admin') {
        return forbiddenResponse('仅管理员可操作');
    }

    // 不能删除自己
    if (user.id === id) {
        return badRequestResponse('不能删除自己的账号');
    }

    try {
        // 检查用户是否存在
        const existResult = await queryFirst(
            env.DB,
            'SELECT id, nickname FROM users WHERE id = ?',
            [id]
        );

        if (!existResult.success || !existResult.data) {
            return notFoundResponse('用户不存在');
        }

        // 软删除：将用户设为禁用状态（不真正删除，保留数据）
        const deleteResult = await execute(
            env.DB,
            'UPDATE users SET is_active = 0, updated_at = ? WHERE id = ?',
            [Date.now(), id]
        );

        if (!deleteResult.success) {
            return errorResponse('删除用户失败', 500);
        }

        return successResponse(
            { id, nickname: existResult.data.nickname },
            '用户已禁用'
        );

    } catch (err) {
        console.error('[Admin User] DELETE 失败:', err);
        return errorResponse('删除用户失败', 500);
    }
}
