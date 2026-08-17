/**
 * 文章卡片组件
 * 用于文章列表展示
 */

import { getCategoryLabel, getStatusLabel, getStatusColor } from '../lib/constants.js';
import { formatDate, timeAgo } from '../lib/date.js';
import { truncateText } from '../lib/utils.js';

// ============================================================
// 渲染单篇文章卡片
// ============================================================
export function renderArticleCard(article, showStatus = false) {
    const {
        slug,
        title,
        summary,
        category,
        tags,
        cover_image,
        view_count,
        status,
        created_at,
        author_name
    } = article;

    // 分类标签
    const categoryLabel = getCategoryLabel(category);

    // 标签列表
    let tagsHtml = '';
    if (tags && Array.isArray(tags) && tags.length > 0) {
        tagsHtml = tags.map(tag =>
            `<span class="tag">#${escapeHtml(tag)}</span>`
        ).join('');
    }

    // 状态标签（仅管理员可见）
    let statusHtml = '';
    if (showStatus && status) {
        const statusLabel = getStatusLabel(status);
        const statusColor = getStatusColor(status);
        statusHtml = `
            <span class="status-badge" style="color:${statusColor};border-color:${statusColor};">
                ${statusLabel}
            </span>
        `;
    }

    // 封面图
    let coverHtml = '';
    if (cover_image) {
        coverHtml = `
            <div class="card-cover">
                <img src="${escapeHtml(cover_image)}" alt="${escapeHtml(title)}" loading="lazy" />
            </div>
        `;
    }

    // 摘要（截断 80 字）
    const summaryText = summary ? truncateText(summary, 80) : '';

    // 作者名
    const author = author_name || '未知';

    return `
        <div class="article-card" data-slug="${escapeHtml(slug)}">
            ${coverHtml}
            <div class="card-body">
                <div class="card-title">
                    <a href="/article/${escapeHtml(slug)}" data-link>${escapeHtml(title)}</a>
                </div>
                ${summaryText ? `<div class="card-summary">${escapeHtml(summaryText)}</div>` : ''}
                <div class="card-tags">${tagsHtml}</div>
                <div class="card-meta">
                    <span class="category-badge">${escapeHtml(categoryLabel)}</span>
                    <span>${formatDate(created_at)}</span>
                    ${view_count !== undefined ? `<span>👁 ${view_count}</span>` : ''}
                    ${statusHtml}
                </div>
            </div>
        </div>
    `;
}

// ============================================================
// 渲染文章列表（多个卡片）
// ============================================================
export function renderArticleCards(articles, showStatus = false) {
    if (!articles || articles.length === 0) {
        return `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p class="empty-text">暂无文章</p>
            </div>
        `;
    }

    return articles.map(article => renderArticleCard(article, showStatus)).join('');
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