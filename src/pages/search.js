/**
 * 搜索结果页
 */

import { search } from '../lib/api.js';
import { renderArticleCards } from '../components/ArticleCard.js';
import { renderLoading } from '../components/Loading.js';
import { showToast } from '../components/Toast.js';
import { escapeRegex, highlightText } from '../lib/utils.js';

// ============================================================
// 渲染搜索页
// ============================================================
export async function renderSearch(params) {
    const { query } = params;

    // 如果关键词为空，显示提示
    if (!query || query.trim() === '') {
        return `
            <div class="search-page" style="max-width:800px;margin:0 auto;padding:40px 16px;">
                <div style="text-align:center;padding:60px 0;">
                    <div style="font-size:48px;margin-bottom:16px;">🔍</div>
                    <h2 style="color:var(--text-secondary);font-weight:400;">请输入搜索关键词</h2>
                    <p style="color:var(--text-light);font-size:14px;margin-top:8px;">
                        搜索文章标题、正文内容
                    </p>
                </div>
            </div>
        `;
    }

    // 显示加载状态
    const loadingHtml = `
        <div class="search-page" style="max-width:800px;margin:0 auto;padding:16px;">
            ${renderLoading('搜索中...')}
        </div>
    `;

    // 先返回加载状态，再异步加载
    // 但由于是 async 函数，我们直接加载数据

    try {
        const result = await search(query.trim());

        if (!result.success) {
            showToast(result.error || '搜索失败', 'error');
            return `
                <div class="search-page" style="max-width:800px;margin:0 auto;padding:16px;">
                    <div class="error-page" style="min-height:auto;padding:40px 0;">
                        <div class="error-card">
                            <div class="error-icon">😵</div>
                            <h1 class="error-title">搜索失败</h1>
                            <p class="error-desc">${result.error || '请稍后重试'}</p>
                            <a href="/" class="error-btn" data-link>返回首页</a>
                        </div>
                    </div>
                </div>
            `;
        }

        const articles = result.data || [];
        const total = result.total || articles.length;

        // 搜索结果统计
        let resultInfo = '';
        if (articles.length === 0) {
            resultInfo = `
                <div style="text-align:center;padding:60px 0;">
                    <div style="font-size:48px;margin-bottom:16px;">🔍</div>
                    <h2 style="color:var(--text-secondary);font-weight:400;">未找到相关文章</h2>
                    <p style="color:var(--text-light);font-size:14px;margin-top:8px;">
                        关键词 "<strong>${escapeHtml(query)}</strong>" 没有匹配结果
                    </p>
                    <a href="/" class="error-btn" style="margin-top:20px;display:inline-block;" data-link>返回首页</a>
                </div>
            `;
        } else {
            // 高亮匹配关键词
            const highlightedArticles = articles.map(article => ({
                ...article,
                title: highlightText(article.title, query),
                summary: article.summary ? highlightText(article.summary, query) : ''
            }));

            resultInfo = `
                <div style="padding:12px 0 16px 0;color:var(--text-secondary);font-size:14px;border-bottom:1px solid var(--border);">
                    找到 <strong style="color:var(--text);">${total}</strong> 篇相关文章
                    ${total > 0 ? `（关键词 "<strong>${escapeHtml(query)}</strong>"）` : ''}
                </div>
                <div class="article-list-grid" style="margin-top:12px;">
                    ${renderArticleCards(highlightedArticles)}
                </div>
            `;
        }

        return `
            <div class="search-page" style="max-width:800px;margin:0 auto;padding:16px;">
                ${resultInfo}
            </div>
        `;

    } catch (err) {
        console.error('[Search] 搜索失败:', err);
        showToast('搜索失败，请稍后重试', 'error');
        return `
            <div class="search-page" style="max-width:800px;margin:0 auto;padding:16px;">
                <div class="error-page" style="min-height:auto;padding:40px 0;">
                    <div class="error-card">
                        <div class="error-icon">😵</div>
                        <h1 class="error-title">搜索异常</h1>
                        <p class="error-desc">网络异常，请稍后重试</p>
                        <a href="/" class="error-btn" data-link>返回首页</a>
                    </div>
                </div>
            </div>
        `;
    }
}

// ============================================================
// 绑定搜索页事件
// ============================================================
export function bindSearchEvents() {
    // 搜索页主要依赖 URL 参数，不需要额外事件
    // 但可以监听搜索框的回车事件（已在 Header 中处理）
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