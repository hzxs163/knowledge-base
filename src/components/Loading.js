/**
 * 加载状态组件
 * 用于数据加载时显示
 */

// ============================================================
// 渲染加载动画
// ============================================================
export function renderLoading(text = '加载中...') {
    return `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <span>${escapeHtml(text)}</span>
        </div>
    `;
}

// ============================================================
// 渲染骨架屏（文章列表占位）
// ============================================================
export function renderSkeleton(count = 3) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="article-card skeleton">
                <div class="card-body">
                    <div class="skeleton-line skeleton-title"></div>
                    <div class="skeleton-line skeleton-summary"></div>
                    <div class="skeleton-line skeleton-summary short"></div>
                    <div class="skeleton-meta">
                        <span class="skeleton-tag"></span>
                        <span class="skeleton-tag"></span>
                    </div>
                </div>
            </div>
        `;
    }
    return html;
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