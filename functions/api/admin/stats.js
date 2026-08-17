/**
 * 管理员 - 统计数据 API
 * GET /api/admin/stats - 获取后台统计数据
 */

import { queryFirst } from '../../utils/db.mjs';
import {
    successResponse,
    errorResponse,
    unauthorizedResponse,
    forbiddenResponse
} from '../../utils/response.mjs';

// ============================================================
// GET /api/admin/stats - 获取统计数据
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
        // 文章总数
        const totalArticles = await queryFirst(
            env.DB,
            'SELECT COUNT(*) as count FROM articles'
        );

        // 已发布文章数
        const publishedArticles = await queryFirst(
            env.DB,
            'SELECT COUNT(*) as count FROM articles WHERE status = ?',
            ['published']
        );

        // 草稿数
        const draftArticles = await queryFirst(
            env.DB,
            'SELECT COUNT(*) as count FROM articles WHERE status = ?',
            ['draft']
        );

        // 用户总数
        const totalUsers = await queryFirst(
            env.DB,
            'SELECT COUNT(*) as count FROM users'
        );

        // 管理员数
        const adminUsers = await queryFirst(
            env.DB,
            'SELECT COUNT(*) as count FROM users WHERE role = ?',
            ['admin']
        );

        // 活跃用户（启用状态）
        const activeUsers = await queryFirst(
            env.DB,
            'SELECT COUNT(*) as count FROM users WHERE is_active = ?',
            [1]
        );

        // 各分类文章数
        const categoryStats = await env.DB.prepare(`
            SELECT category, COUNT(*) as count
            FROM articles
            GROUP BY category
            ORDER BY count DESC
        `).all();

        // 总浏览量
        const totalViews = await queryFirst(
            env.DB,
            'SELECT SUM(view_count) as total FROM articles'
        );

        return successResponse({
            articles: {
                total: totalArticles.success ? totalArticles.data?.count || 0 : 0,
                published: publishedArticles.success ? publishedArticles.data?.count || 0 : 0,
                draft: draftArticles.success ? draftArticles.data?.count || 0 : 0
            },
            users: {
                total: totalUsers.success ? totalUsers.data?.count || 0 : 0,
                admin: adminUsers.success ? adminUsers.data?.count || 0 : 0,
                active: activeUsers.success ? activeUsers.data?.count || 0 : 0
            },
            categories: categoryStats.success ? categoryStats.results || [] : [],
            totalViews: totalViews.success ? totalViews.data?.total || 0 : 0
        }, '获取成功');

    } catch (err) {
        console.error('[Admin Stats] GET 失败:', err);
        return errorResponse('获取统计数据失败', 500);
    }
}
