/**
 * 管理后台 - 文章管理
 * 仅管理员可访问
 */

import { getAllArticles, deleteArticle, updateArticle } from '../../lib/api.js';
import { renderArticleCards } from '../../components/ArticleCard.js';
import { renderLoading } from '../../components/Loading.js';
import { showToast } from '../../components/Toast.js';
import { confirmDelete } from '../../components/ConfirmDialog.js';
import { navigateTo } from '../../lib/router.js';
import { formatDate } from '../../lib/date.js';
import { getCategoryLabel, getStatusLabel, getStatusColor } from '../../lib/constants.js';

// ============================================================
// 状态
// ============================================================
let allArticles = [];
let filterStatus = 'all'; // all | draft | published | archived

// ============================================================
// 渲染管理后台
// ============================================================
export function renderDashboard() {
    return `
        <div class="dashboard-container">
            <div class="dashboard-header">
                <h1 class="dashboard-title">📊 文章管理</h1>
                <button class="btn-primary" id="createArticleBtn">＋ 写文章</button>
            </div>

            <div class="dashboard-filters">
                <div class="filter-group">
                    <label>状态筛选：</label>
                    <select id="filterStatus">
                        <option value="all">全部</option>
                        <option value="published">已发布</option>
                        <option value="draft">草稿</option>
                        <option value="archived">已归档</option>
                    </select>
                </div>
                <div class="filter-group">
                    <span class="article-count" id="articleCount">共 0 篇文章</span>
                </div>
            </div>

            <div id="dashboardArticleList">
                ${renderLoading('加载中...')}
            </div>
        </div>
    `;
}

// ============================================================
// 绑定后台事件
// ============================================================
export function bindDashboardEvents() {
    // 写文章按钮
    const createBtn = document.getElementById('createArticleBtn');
    if (createBtn) {
        createBtn.addEventListener('click', () => {
            navigateTo('/dashboard/edit', true);
        });
    }

    // 状态筛选
    const filterSelect = document.getElementById('filterStatus');
    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            filterStatus = filterSelect.value;
            loadArticles();
        });
    }

    // 加载文章
    loadArticles();
}

// ============================================================
// 加载文章
// ============================================================
async function loadArticles() {
    const container = document.getElementById('dashboardArticleList');
    if (!container) return;

    container.innerHTML = renderLoading('加载中...');

    try {
        const params = {};
        if (filterStatus !== 'all') {
            params.status = filterStatus;
        }

        const result = await getAllArticles(params);

        if (!result.success) {
            showToast(result.error || '加载文章失败', 'error');
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">😵</div>
                    <p class="empty-text">加载失败，请刷新重试</p>
                </div>
            `;
            return;
        }

        allArticles = result.data || [];

        // 更新计数
        const countEl = document.getElementById('articleCount');
        if (countEl) {
            countEl.textContent = `共 ${allArticles.length} 篇文章`;
        }

        if (allArticles.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <p class="empty-text">
                        ${filterStatus === 'all' ? '暂无文章，点击"写文章"创建第一篇' : `暂无 ${filterStatus} 状态的文章`}
                    </p>
                </div>
            `;
            return;
        }

        // 渲染文章列表（带管理操作）
        container.innerHTML = renderAdminArticleList(allArticles);

        // 绑定管理按钮事件
        bindAdminArticleEvents();

    } catch (err) {
        console.error('[Dashboard] 加载文章失败:', err);
        showToast('加载文章失败，请刷新重试', 'error');
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">😵</div>
                <p class="empty-text">加载失败，请刷新重试</p>
            </div>
        `;
    }
}

// ============================================================
// 渲染管理文章列表
// ============================================================
function renderAdminArticleList(articles) {
    let html = '<div class="admin-article-list">';

    for (const article of articles) {
        const categoryLabel = getCategoryLabel(article.category);
        const statusLabel = getStatusLabel(article.status);
        const statusColor = getStatusColor(article.status);

        html += `
            <div class="admin-article-item" data-slug="${escapeHtml(article.slug)}">
                <div class="admin-article-info">
                    <div class="admin-article-title">
                        <a href="/article/${escapeHtml(article.slug)}" target="_blank">
                            ${escapeHtml(article.title)}
                        </a>
                    </div>
                    <div class="admin-article-meta">
                        <span class="category-badge">${escapeHtml(categoryLabel)}</span>
                        <span class="status-badge" style="color:${statusColor};">
                            ${statusLabel}
                        </span>
                        <span>${formatDate(article.created_at)}</span>
                        <span>👁 ${article.view_count || 0}</span>
                    </div>
                </div>
                <div class="admin-article-actions">
                    <button class="action-btn view-btn" data-action="view" title="查看">
                        🔗
                    </button>
                    <button class="action-btn edit-btn" data-action="edit" title="编辑">
                        ✏️
                    </button>
                    <button class="action-btn delete-btn" data-action="delete" title="删除">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }

    html += '</div>';
    return html;
}

// ============================================================
// 绑定管理操作事件
// ============================================================
function bindAdminArticleEvents() {
    // 查看按钮
    document.querySelectorAll('[data-action="view"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const item = this.closest('.admin-article-item');
            const slug = item?.dataset.slug;
            if (slug) {
                window.open(`/article/${slug}`, '_blank');
            }
        });
    });

    // 编辑按钮
    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const item = this.closest('.admin-article-item');
            const slug = item?.dataset.slug;
            if (slug) {
                navigateTo(`/dashboard/edit/${slug}`, true);
            }
        });
    });

    // 删除按钮
    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', async function() {
            const item = this.closest('.admin-article-item');
            const slug = item?.dataset.slug;
            const title = item?.querySelector('.admin-article-title')?.textContent?.trim() || slug;

            if (!slug) return;

            const confirmed = await confirmDelete(title, '文章');
            if (!confirmed) return;

            try {
                const result = await deleteArticle(slug);

                if (!result.success) {
                    showToast(result.error || '删除失败', 'error');
                    return;
                }

                showToast(`已删除：${title}`, 'success');
                // 重新加载列表
                loadArticles();

            } catch (err) {
                console.error('[Dashboard] 删除失败:', err);
                showToast('删除失败，请重试', 'error');
            }
        });
    });
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