/**
 * 单篇文章 API
 * GET /api/articles/:slug - 获取文章详情
 * PUT /api/articles/:slug - 更新文章（仅管理员）
 * DELETE /api/articles/:slug - 删除文章（仅管理员）
 */

import { queryFirst, execute } from '../../utils/db.js';
import {
    successResponse,
    errorResponse,
    badRequestResponse,
    unauthorizedResponse,
    forbiddenResponse,
    notFoundResponse,
    conflictResponse
} from '../../utils/response.js';
import { isValidSlug } from '../../utils/validator.js';

// ============================================================
// GET /api/articles/:slug - 获取文章详情
// ============================================================
export async function onRequestGet(context) {
    const { request, env, params } = context;
    const { slug } = params;

    try {
        // 查询文章（仅已发布）
        const result = await queryFirst(
            env.DB,
            `
                SELECT a.*, u.nickname as author_name
                FROM articles a
                LEFT JOIN users u ON a.author_id = u.id
                WHERE a.slug = ? AND a.status = 'published'
            `,
            [slug]
        );

        if (!result.success) {
            return errorResponse('查询文章失败', 500);
        }

        const article = result.data;

        if (!article) {
            return notFoundResponse('文章不存在或未发布');
        }

        // 解析标签
        if (article.tags) {
            try {
                article.tags = JSON.parse(article.tags);
            } catch {
                article.tags = [];
            }
        }

        // 增加浏览量（异步，不影响返回）
        await execute(
            env.DB,
            'UPDATE articles SET view_count = view_count + 1 WHERE slug = ?',
            [slug]
        ).catch(() => {});

        return successResponse(article, '获取成功');

    } catch (err) {
        console.error('[Article] GET 失败:', err);
        return errorResponse('获取文章失败', 500);
    }
}

// ============================================================
// PUT /api/articles/:slug - 更新文章（仅管理员）
// ============================================================
export async function onRequestPut(context) {
    const { request, env, user, params } = context;
    const { slug } = params;

    // 检查登录
    if (!user) {
        return unauthorizedResponse('请先登录');
    }

    // 检查管理员权限
    if (user.role !== 'admin') {
        return forbiddenResponse('仅管理员可编辑文章');
    }

    try {
        // 检查文章是否存在
        const existResult = await queryFirst(
            env.DB,
            'SELECT id FROM articles WHERE slug = ?',
            [slug]
        );

        if (!existResult.success || !existResult.data) {
            return notFoundResponse('文章不存在');
        }

        const body = await request.json();
        const {
            title,
            newSlug,
            summary,
            content,
            category,
            tags = [],
            cover_image = '',
            status
        } = body;

        // 校验
        if (title && !title.trim()) {
            return badRequestResponse('请输入文章标题');
        }

        if (newSlug) {
            if (!isValidSlug(newSlug)) {
                return badRequestResponse('Slug 只能包含小写字母、数字和连字符');
            }

            // 检查新 Slug 是否被其他文章占用
            if (newSlug !== slug) {
                const existResult2 = await queryFirst(
                    env.DB,
                    'SELECT id FROM articles WHERE slug = ? AND slug != ?',
                    [newSlug.trim().toLowerCase(), slug]
                );

                if (existResult2.success && existResult2.data) {
                    return conflictResponse('Slug 已被占用，请更换');
                }
            }
        }

        // 构建更新语句
        const updates = [];
        const values = [];

        if (title) {
            updates.push('title = ?');
            values.push(title.trim());
        }

        if (newSlug) {
            updates.push('slug = ?');
            values.push(newSlug.trim().toLowerCase());
        }

        if (summary !== undefined) {
            updates.push('summary = ?');
            values.push(summary || '');
        }

        if (content !== undefined) {
            updates.push('content = ?');
            values.push(content);
        }

        if (category) {
            updates.push('category = ?');
            values.push(category);
        }

        if (tags !== undefined) {
            const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);
            updates.push('tags = ?');
            values.push(tagsJson);
        }

        if (cover_image !== undefined) {
            updates.push('cover_image = ?');
            values.push(cover_image || '');
        }

        if (status) {
            updates.push('status = ?');
            values.push(status);
        }

        updates.push('updated_at = ?');
        values.push(Date.now());

        // 如果没有更新任何字段
        if (updates.length === 0) {
            return badRequestResponse('没有需要更新的字段');
        }

        values.push(slug);

        const updateResult = await execute(
            env.DB,
            `UPDATE articles SET ${updates.join(', ')} WHERE slug = ?`,
            values
        );

        if (!updateResult.success) {
            return errorResponse('更新文章失败', 500);
        }

        const finalSlug = newSlug || slug;

        return successResponse(
            { slug: finalSlug.trim().toLowerCase() },
            '文章更新成功'
        );

    } catch (err) {
        console.error('[Article] PUT 失败:', err);
        return errorResponse('更新文章失败', 500);
    }
}

// ============================================================
// DELETE /api/articles/:slug - 删除文章（仅管理员）
// ============================================================
export async function onRequestDelete(context) {
    const { request, env, user, params } = context;
    const { slug } = params;

    // 检查登录
    if (!user) {
        return unauthorizedResponse('请先登录');
    }

    // 检查管理员权限
    if (user.role !== 'admin') {
        return forbiddenResponse('仅管理员可删除文章');
    }

    try {
        // 检查文章是否存在
        const existResult = await queryFirst(
            env.DB,
            'SELECT id, title FROM articles WHERE slug = ?',
            [slug]
        );

        if (!existResult.success || !existResult.data) {
            return notFoundResponse('文章不存在');
        }

        // 删除文章
        const deleteResult = await execute(
            env.DB,
            'DELETE FROM articles WHERE slug = ?',
            [slug]
        );

        if (!deleteResult.success) {
            return errorResponse('删除文章失败', 500);
        }

        return successResponse(
            { slug, title: existResult.data.title },
            '文章已删除'
        );

    } catch (err) {
        console.error('[Article] DELETE 失败:', err);
        return errorResponse('删除文章失败', 500);
    }
}