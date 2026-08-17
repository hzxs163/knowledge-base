/**
 * 文章 API（公开）
 * GET /api/articles - 获取已发布文章列表
 * POST /api/articles - 创建文章（仅管理员）
 */

import { query, queryFirst, execute, buildSelect, buildCount } from '../../utils/db.mjs';
import {
    successResponse,
    errorResponse,
    badRequestResponse,
    unauthorizedResponse,
    forbiddenResponse,
    conflictResponse,
    paginatedResponse
} from '../../utils/response.mjs';
import { isValidSlug } from '../../utils/validator.mjs';

// ============================================================
// GET /api/articles - 获取文章列表（仅已发布）
// ============================================================
export async function onRequestGet(context) {
    const { request, env } = context;

    try {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page')) || 1;
        const limit = parseInt(url.searchParams.get('limit')) || 20;
        const category = url.searchParams.get('category') || '';
        const offset = (page - 1) * limit;

        // 构建查询条件（仅已发布）
        let where = 'status = ?';
        let params = ['published'];

        if (category) {
            where += ' AND category = ?';
            params.push(category);
        }

        // 查询文章列表
        const listResult = await query(
            env.DB,
            `
                SELECT a.*, u.nickname as author_name
                FROM articles a
                LEFT JOIN users u ON a.author_id = u.id
                WHERE ${where}
                ORDER BY a.created_at DESC
                LIMIT ? OFFSET ?
            `,
            [...params, limit, offset]
        );

        if (!listResult.success) {
            return errorResponse('查询文章失败', 500);
        }

        // 查询总数
        const countResult = await queryFirst(
            env.DB,
            `SELECT COUNT(*) as total FROM articles WHERE ${where}`,
            params
        );

        const total = countResult.success ? countResult.data?.total || 0 : 0;

        // 处理标签 JSON
        const articles = (listResult.data || []).map(article => {
            if (article.tags) {
                try {
                    article.tags = JSON.parse(article.tags);
                } catch {
                    article.tags = [];
                }
            }
            return article;
        });

        return successResponse(
            paginatedResponse(articles, page, limit, total),
            '获取成功'
        );

    } catch (err) {
        console.error('[Articles] GET 失败:', err);
        return errorResponse('获取文章列表失败', 500);
    }
}

// ============================================================
// POST /api/articles - 创建文章（仅管理员）
// ============================================================
export async function onRequestPost(context) {
    const { request, env, user } = context;

    // 检查登录
    if (!user) {
        return unauthorizedResponse('请先登录');
    }

    // 检查管理员权限
    if (user.role !== 'admin') {
        return forbiddenResponse('仅管理员可发布文章');
    }

    try {
        const body = await request.json();
        const {
            title,
            slug,
            summary,
            content,
            category,
            tags = [],
            cover_image = '',
            status = 'draft'
        } = body;

        // 校验必填字段
        if (!title || !title.trim()) {
            return badRequestResponse('请输入文章标题');
        }

        if (!slug || !slug.trim()) {
            return badRequestResponse('请输入 URL 标识');
        }

        if (!isValidSlug(slug)) {
            return badRequestResponse('Slug 只能包含小写字母、数字和连字符');
        }

        if (!category) {
            return badRequestResponse('请选择分类');
        }

        if (!content || content.trim().length < 10) {
            return badRequestResponse('正文至少10个字符');
        }

        // 检查 Slug 是否已存在
        const existResult = await queryFirst(
            env.DB,
            'SELECT id FROM articles WHERE slug = ?',
            [slug.trim().toLowerCase()]
        );

        if (existResult.success && existResult.data) {
            return conflictResponse('Slug 已被占用，请更换');
        }

        // 生成文章 ID
        const id = crypto.randomUUID();
        const now = Date.now();

        // 处理标签
        const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);

        // 插入文章
        const insertResult = await execute(
            env.DB,
            `
                INSERT INTO articles (
                    id, slug, title, summary, content, category, tags,
                    cover_image, author_id, status, view_count, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                id,
                slug.trim().toLowerCase(),
                title.trim(),
                summary || content.slice(0, 200),
                content,
                category,
                tagsJson,
                cover_image || '',
                user.id,
                status || 'draft',
                0,
                now,
                now
            ]
        );

        if (!insertResult.success) {
            return errorResponse('创建文章失败', 500);
        }

        return successResponse(
            { id, slug: slug.trim().toLowerCase() },
            '文章创建成功'
        );

    } catch (err) {
        console.error('[Articles] POST 失败:', err);
        return errorResponse('创建文章失败', 500);
    }
}
