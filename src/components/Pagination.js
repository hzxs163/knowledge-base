/**
 * 分页器组件
 * 桌面端使用，移动端建议用无限滚动
 */

import { navigateTo } from '../lib/router.js';
import { getUrlParams } from '../lib/utils.js';

// ============================================================
// 渲染分页器
// ============================================================
export function renderPagination(currentPage, totalPages, baseUrl = '/') {
    if (totalPages <= 1) {
        return '';
    }

    // 限制显示的页码数量
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    // 如果结束页超出了，调整起始页
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    // 构建页码链接（保留当前查询参数）
    const currentParams = getUrlParams();
    const buildUrl = (page) => {
        const params = { ...currentParams, page };
        if (params.page === 1) {
            delete params.page;
        }
        const queryString = Object.keys(params).length > 0
            ? '?' + Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
            : '';
        return baseUrl + queryString;
    };

    let html = '<div class="pagination">';

    // 上一页
    if (currentPage > 1) {
        html += `<a href="${buildUrl(currentPage - 1)}" class="pagination-prev" data-link>‹ 上一页</a>`;
    } else {
        html += `<span class="pagination-prev disabled">‹ 上一页</span>`;
    }

    // 页码
    if (startPage > 1) {
        html += `<a href="${buildUrl(1)}" class="pagination-page" data-link>1</a>`;
        if (startPage > 2) {
            html += `<span class="pagination-ellipsis">…</span>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            html += `<span class="pagination-page active">${i}</span>`;
        } else {
            html += `<a href="${buildUrl(i)}" class="pagination-page" data-link>${i}</a>`;
        }
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<span class="pagination-ellipsis">…</span>`;
        }
        html += `<a href="${buildUrl(totalPages)}" class="pagination-page" data-link>${totalPages}</a>`;
    }

    // 下一页
    if (currentPage < totalPages) {
        html += `<a href="${buildUrl(currentPage + 1)}" class="pagination-next" data-link>下一页 ›</a>`;
    } else {
        html += `<span class="pagination-next disabled">下一页 ›</span>`;
    }

    html += '</div>';
    return html;
}

// ============================================================
// 渲染分页信息
// ============================================================
export function renderPaginationInfo(currentPage, totalPages, totalItems, pageSize) {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);

    if (totalItems === 0) {
        return `<span class="pagination-info">共 0 篇文章</span>`;
    }

    return `
        <span class="pagination-info">
            第 ${start} - ${end} 篇，共 ${totalItems} 篇文章
        </span>
    `;
}