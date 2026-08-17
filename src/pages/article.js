/**
 * 文章详情页
 */

import { getArticle } from '../lib/api.js';
import { renderMarkdown, bindMarkdownEvents } from '../components/MarkdownRenderer.js';
import { showToast } from '../components/Toast.js';
import { formatDate } from '../lib/date.js';
import { getCategoryLabel } from '../lib/constants.js';

// ============================================================
// 渲染文章详情
// ============================================================
export async function renderArticle(params) {
    const { slug } = params;

    if (!slug) {
        return `
            <div class="error-page">
                <div class="error-card">
                    <div class="error-icon">😵</div>
                    <h1 class="error-title">文章不存在</h1>
                    <p class="error-desc">请检查链接是否正确</p>
                    <a href="/" class="error-btn" data-link>返回首页</a>
                </div>
            </div>
        `;
    }

    // 显示加载状态
    const loadingHtml = `
        <div class="article-detail">
            <div style="text-align:center;padding:60px 0;">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <span>加载中...</span>
                </div>
            </div>
        </div>
    `;

    // 先返回加载状态，然后异步加载数据
    // 但为了简单，我们直接在这里加载数据并返回

    try {
        const result = await getArticle(slug);

        if (!result.success) {
            if (result.status === 404) {
                return `
                    <div class="error-page">
                        <div class="error-card">
                            <div class="error-icon">📭</div>
                            <h1 class="error-title">文章未找到</h1>
                            <p class="error-desc">该文章不存在或已被删除</p>
                            <a href="/" class="error-btn" data-link>返回首页</a>
                        </div>
                    </div>
                `;
            }
            showToast(result.error || '加载文章失败', 'error');
            return `
                <div class="error-page">
                    <div class="error-card">
                        <div class="error-icon">😵</div>
                        <h1 class="error-title">加载失败</h1>
                        <p class="error-desc">${result.error || '请稍后重试'}</p>
                        <a href="/" class="error-btn" data-link>返回首页</a>
                    </div>
                </div>
            `;
        }

        const article = result.data;

        if (!article) {
            return `
                <div class="error-page">
                    <div class="error-card">
                        <div class="error-icon">📭</div>
                        <h1 class="error-title">文章为空</h1>
                        <p class="error-desc">该文章没有内容</p>
                        <a href="/" class="error-btn" data-link>返回首页</a>
                    </div>
                </div>
            `;
        }

        // 渲染正文
        const contentHtml = renderMarkdown(article.content || '');

        // 分类标签
        const categoryLabel = getCategoryLabel(article.category);

        // 标签
        let tagsHtml = '';
        if (article.tags && Array.isArray(article.tags) && article.tags.length > 0) {
            tagsHtml = article.tags.map(tag =>
                `<span class="tag">#${escapeHtml(tag)}</span>`
            ).join(' ');
        }

        // 作者
        const authorName = article.author_name || '管理员';

        return `
            <div class="article-detail" id="articleDetail">
                <div class="detail-header">
                    <h1 class="detail-title">${escapeHtml(article.title)}</h1>
                    <div class="detail-meta">
                        <span class="category-badge">${escapeHtml(categoryLabel)}</span>
                        <span>${authorName}</span>
                        <span>${formatDate(article.created_at)}</span>
                        ${article.view_count !== undefined ? `<span>👁 ${article.view_count}</span>` : ''}
                        ${tagsHtml ? `<span>${tagsHtml}</span>` : ''}
                    </div>
                </div>

                <div class="detail-body" id="articleBody">
                    ${contentHtml}
                </div>

                <div class="detail-nav">
                    <span style="color:var(--text-light);font-size:14px;">
                        ${article.updated_at && article.updated_at !== article.created_at ?
                            `最后更新: ${formatDate(article.updated_at)}` :
                            ''}
                    </span>
                    <a href="/" data-link>← 返回列表</a>
                </div>
            </div>
        `;

    } catch (err) {
        console.error('[Article] 加载失败:', err);
        showToast('加载文章失败，请刷新重试', 'error');
        return `
            <div class="error-page">
                <div class="error-card">
                    <div class="error-icon">😵</div>
                    <h1 class="error-title">加载失败</h1>
                    <p class="error-desc">网络异常，请稍后重试</p>
                    <a href="/" class="error-btn" data-link>返回首页</a>
                </div>
            </div>
        `;
    }
}

// ============================================================
// 绑定文章详情事件
// ============================================================
export function bindArticleEvents() {
    // 绑定 Markdown 渲染后的事件（图片点击放大等）
    const body = document.getElementById('articleBody');
    if (body) {
        bindMarkdownEvents(body);
    }
}

// ============================================================
// 工具：防 XSS
// ============================================================
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}