/**
 * 管理员 - 文章管理 API
 * GET /api/admin/articles - 获取所有文章（含草稿）
 */

import { query } from '../../utils/db.mjs';
import {
    successResponse,
    errorResponse,
    unauthorizedResponse,
    forbiddenResponse
} from '../../utils/response.mjs';

// ============================================================
// GET /api/admin/articles - 获取所有文章（含草稿）
// ============================================================
export async function onRequestGet(context) {
    const { request, env, user } = context;

    // 检查登录
    if (!user) {
        return unauthorizedResponse('请先登录');
    }

    // 检查管理员权限
    if (user.role !== 'admin') {
        return forbiddenResponse('仅管理员可访问');
    }

    try {
        const url = new URL(request.url);
        const status = url.searchParams.get('status') || '';
        const category = url.searchParams.get('category') || '';

        let sql = `
            SELECT a.*, u.nickname as author_name
            FROM articles a
            LEFT JOIN users u ON a.author_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            sql += ' AND a.status = ?';
            params.push(status);
        }

        if (category) {
            sql += ' AND a.category = ?';
            params.push(category);
        }

        sql += ' ORDER BY a.created_at DESC';

        const result = await query(env.DB, sql, params);

        if (!result.success) {
            return errorResponse('查询文章失败', 500);
        }

        // 解析标签
        const articles = (result.data || []).map(article => {
            if (article.tags) {
                try {
                    article.tags = JSON.parse(article.tags);
                } catch {
                    article.tags = [];
                }
            }
            return article;
        });

        return successResponse(articles, '获取成功');

    } catch (err) {
        console.error('[Admin Articles] GET 失败:', err);
        return errorResponse('获取文章列表失败', 500);
    }
}
