/**
 * 首页 - 文章列表
 */

import { getArticles } from '../lib/api.js';
import { getUrlParams } from '../lib/utils.js';
import { renderArticleCards } from '../components/ArticleCard.js';
import { renderCategoryNav, bindCategoryNavEvents } from '../components/CategoryNav.js';
import { renderLoading, renderSkeleton } from '../components/Loading.js';
import { showToast } from '../components/Toast.js';
import { CATEGORIES, PAGE_SIZE } from '../lib/constants.js';

// ============================================================
// 状态
// ============================================================
let currentPage = 1;
let isLoading = false;
let hasMore = true;
let totalCount = 0;
let currentCategory = '';

// ============================================================
// 渲染首页
// ============================================================
export function renderHome() {
    // 获取分类参数
    const params = getUrlParams();
    currentCategory = params.category || '';

    // 重置状态
    currentPage = 1;
    hasMore = true;
    totalCount = 0;

    // 分类导航
    const categoryHtml = renderCategoryNav();

    return `
        <div id="homeContainer">
            ${categoryHtml}

            <div id="articleListContainer">
                ${renderSkeleton(5)}
            </div>

            <div id="loadMoreContainer" style="text-align:center;padding:20px 0;">
                <button id="loadMoreBtn" class="btn-load-more" style="display:none;">
                    加载更多
                </button>
                <div id="loadingMore" style="display:none;">
                    ${renderLoading('加载中...')}
                </div>
                <div id="noMoreTip" style="display:none;color:var(--text-light);font-size:14px;">
                    — 已加载全部文章 —
                </div>
            </div>
        </div>
    `;
}

// ============================================================
// 绑定首页事件
// ============================================================
export function bindHomeEvents() {
    // 绑定分类导航事件
    bindCategoryNavEvents();

    // 加载第一页
    loadArticles(true);

    // 监听分类切换（通过 URL 变化）
    window.addEventListener('popstate', () => {
        const params = getUrlParams();
        const newCategory = params.category || '';
        if (newCategory !== currentCategory) {
            currentCategory = newCategory;
            currentPage = 1;
            hasMore = true;
            loadArticles(true);
        }
    });

    // 加载更多按钮
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            if (!isLoading && hasMore) {
                currentPage++;
                loadArticles(false);
            }
        });
    }

    // 无限滚动（移动端）
    const handleScroll = () => {
        // 判断是否滚动到底部
        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const clientHeight = document.documentElement.clientHeight;

        if (scrollTop + clientHeight >= scrollHeight - 100) {
            if (!isLoading && hasMore) {
                // 移动端自动加载更多
                currentPage++;
                loadArticles(false);
            }
        }
    };

    // 使用节流
    let scrollTimer = null;
    window.addEventListener('scroll', () => {
        if (scrollTimer) return;
        scrollTimer = setTimeout(() => {
            handleScroll();
            scrollTimer = null;
        }, 200);
    });

    // 页面加载完成后触发一次检查
    setTimeout(handleScroll, 500);
}

// ============================================================
// 加载文章
// ============================================================
async function loadArticles(reset = true) {
    if (isLoading) return;

    isLoading = true;

    const container = document.getElementById('articleListContainer');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const loadingMore = document.getElementById('loadingMore');
    const noMoreTip = document.getElementById('noMoreTip');

    if (!container) {
        isLoading = false;
        return;
    }

    // 显示加载状态
    if (reset) {
        container.innerHTML = renderSkeleton(5);
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        if (noMoreTip) noMoreTip.style.display = 'none';
    } else {
        if (loadingMore) loadingMore.style.display = 'block';
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    }

    try {
        // 请求参数
        const params = {
            page: currentPage,
            limit: PAGE_SIZE,
            status: 'published'
        };

        if (currentCategory) {
            params.category = currentCategory;
        }

        const result = await getArticles(params);

        if (!result.success) {
            showToast(result.error || '加载文章失败', 'error');
            if (loadingMore) loadingMore.style.display = 'none';
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            if (reset) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">😵</div>
                        <p class="empty-text">加载失败，请刷新重试</p>
                    </div>
                `;
            }
            isLoading = false;
            return;
        }

        const articles = result.data || [];
        const pagination = result.pagination || {};

        totalCount = pagination.total || 0;
        const totalPages = pagination.totalPages || 0;
        hasMore = currentPage < totalPages;

        // 渲染文章
        if (reset) {
            if (articles.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📭</div>
                        <p class="empty-text">
                            ${currentCategory ? `「${currentCategory}」分类暂无文章` : '暂无文章'}
                        </p>
                    </div>
                `;
            } else {
                container.innerHTML = `<div class="article-list-grid">${renderArticleCards(articles)}</div>`;
            }
        } else {
            // 追加加载
            if (articles.length > 0) {
                const grid = container.querySelector('.article-list-grid');
                if (grid) {
                    grid.insertAdjacentHTML('beforeend', renderArticleCards(articles));
                } else {
                    // 如果之前是空状态，直接替换
                    container.innerHTML = `<div class="article-list-grid">${renderArticleCards(articles)}</div>`;
                }
            }
        }

        // 更新加载更多按钮状态
        if (loadingMore) loadingMore.style.display = 'none';

        if (hasMore) {
            if (loadMoreBtn) {
                loadMoreBtn.style.display = 'inline-block';
                loadMoreBtn.textContent = `加载更多 (${articles.length}/${totalCount})`;
            }
            if (noMoreTip) noMoreTip.style.display = 'none';
        } else {
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            if (noMoreTip) {
                noMoreTip.style.display = articles.length > 0 ? 'block' : 'none';
            }
        }

    } catch (err) {
        console.error('[Home] 加载文章失败:', err);
        showToast('加载文章失败，请刷新重试', 'error');
        if (reset) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">😵</div>
                    <p class="empty-text">加载失败，请刷新重试</p>
                </div>
            `;
        }
        if (loadingMore) loadingMore.style.display = 'none';
    }

    isLoading = false;
}