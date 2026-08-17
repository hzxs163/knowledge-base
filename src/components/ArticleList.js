/**
 * 文章列表组件
 * 支持无限滚动加载
 */

import { renderArticleCards } from './ArticleCard.js';
import { renderLoading } from './Loading.js';

// ============================================================
// 渲染文章列表
// ============================================================
export function renderArticleList(articles, showStatus = false, loading = false) {
    if (loading) {
        return `
            <div class="article-list-container">
                ${renderLoading('加载中...')}
            </div>
        `;
    }

    if (!articles || articles.length === 0) {
        return `
            <div class="article-list-container">
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <p class="empty-text">暂无文章</p>
                </div>
            </div>
        `;
    }

    return `
        <div class="article-list-container">
            <div class="article-list-grid">
                ${renderArticleCards(articles, showStatus)}
            </div>
        </div>
    `;
}

// ============================================================
// 渲染列表底部（加载更多/已全部加载）
// ============================================================
export function renderListFooter(hasMore, isLoading, total = 0, loaded = 0) {
    if (isLoading) {
        return `
            <div class="list-footer loading">
                ${renderLoading('加载中...')}
            </div>
        `;
    }

    if (hasMore) {
        return `
            <div class="list-footer has-more">
                <button class="btn-load-more" id="loadMoreBtn">
                    加载更多 (${loaded}/${total})
                </button>
            </div>
        `;
    }

    if (total > 0) {
        return `
            <div class="list-footer no-more">
                <span style="color:var(--text-light);font-size:14px;">
                    — 已加载全部 ${total} 篇文章 —
                </span>
            </div>
        `;
    }

    return '';
}