/**
 * 搜索 API
 * GET /api/search - 搜索文章（标题、正文、摘要）
 */

import { query } from '../utils/db.mjs';
import {
    successResponse,
    errorResponse,
    badRequestResponse
} from '../utils/response.mjs';

// ============================================================
// GET /api/search - 搜索文章
// ============================================================
export async function onRequestGet(context) {
    const { request, env } = context;

    try {
        const url = new URL(request.url);
        const q = url.searchParams.get('q') || '';
        const limit = parseInt(url.searchParams.get('limit')) || 50;

        // 关键词不能为空
        if (!q || q.trim().length === 0) {
            return successResponse([], '请输入搜索关键词');
        }

        // 关键词太短（少于2个字符）返回空结果
        if (q.trim().length < 2) {
            return successResponse([], '关键词至少2个字符');
        }

        const keyword = q.trim();

        // 使用 LIKE 进行模糊搜索（简单方案）
        // 也可以使用 D1 的全文搜索功能
        const searchPattern = `%${keyword}%`;

        const result = await query(
            env.DB,
            `
                SELECT
                    a.id,
                    a.slug,
                    a.title,
                    a.summary,
                    a.category,
                    a.tags,
                    a.cover_image,
                    a.view_count,
                    a.status,
                    a.created_at,
                    a.updated_at,
                    u.nickname as author_name,
                    -- 匹配分数（标题匹配权重高）
                    CASE
                        WHEN a.title LIKE ? THEN 10
                        WHEN a.summary LIKE ? THEN 5
                        WHEN a.content LIKE ? THEN 3
                        ELSE 1
                    END as relevance
                FROM articles a
                LEFT JOIN users u ON a.author_id = u.id
                WHERE a.status = 'published'
                  AND (
                      a.title LIKE ?
                      OR a.summary LIKE ?
                      OR a.content LIKE ?
                  )
                ORDER BY relevance DESC, a.created_at DESC
                LIMIT ?
            `,
            [
                searchPattern,  // title 权重
                searchPattern,  // summary 权重
                searchPattern,  // content 权重
                searchPattern,  // title 搜索
                searchPattern,  // summary 搜索
                searchPattern,  // content 搜索
                limit
            ]
        );

        if (!result.success) {
            return errorResponse('搜索失败', 500);
        }

        // 处理标签
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

        return successResponse({
            keyword,
            total: articles.length,
            data: articles
        }, '搜索成功');

    } catch (err) {
        console.error('[Search] 搜索失败:', err);
        return errorResponse('搜索失败，请稍后重试', 500);
    }
}
