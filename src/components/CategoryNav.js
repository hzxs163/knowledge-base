/**
 * 分类导航组件
 * - 桌面端：全部展开
 * - 移动端：横向滚动
 * - 极窄屏：自动切换为下拉菜单
 */

import { CATEGORIES } from '../lib/constants.js';
import { navigateTo } from '../lib/router.js';
import { getUrlParams } from '../lib/utils.js';

// ============================================================
// 获取当前激活的分类
// ============================================================
function getActiveCategory() {
    const params = getUrlParams();
    return params.category || '';
}

// ============================================================
// 渲染分类导航
// ============================================================
export function renderCategoryNav() {
    const active = getActiveCategory();

    // 分类链接列表（用于横向滚动）
    const links = CATEGORIES.map(cat => {
        const isActive = active === cat.value;
        const href = cat.value ? `/?category=${cat.value}` : '/';
        return `
            <a href="${href}"
               class="${isActive ? 'active' : ''}"
               data-category="${cat.value}"
               data-link>
                ${cat.key}
            </a>
        `;
    }).join('');

    // 下拉菜单选项
    const options = CATEGORIES.map(cat => {
        const isSelected = active === cat.value;
        return `
            <option value="${cat.value}" ${isSelected ? 'selected' : ''}>
                ${cat.key}
            </option>
        `;
    }).join('');

    return `
        <div class="category-wrapper">
            <div class="category-scroll" id="categoryScroll">
                ${links}
            </div>
            <select class="category-select-mobile" id="categorySelectMobile">
                ${options}
            </select>
        </div>
    `;
}

// ============================================================
// 绑定分类导航事件
// ============================================================
export function bindCategoryNavEvents() {
    // ---------- 下拉菜单切换 ----------
    const select = document.getElementById('categorySelectMobile');
    if (select) {
        select.addEventListener('change', function() {
            const category = this.value;
            const url = category ? `/?category=${category}` : '/';
            navigateTo(url, true);
        });
    }

    // ---------- 点击分类链接（SPA 跳转） ----------
    // 链接点击由 router.js 统一拦截，不需要额外绑定
    // 但需要确保 data-link 属性存在
    document.querySelectorAll('.category-scroll a[data-link]').forEach(el => {
        // 已有 data-link，router.js 会自动处理
        // 这里只是确保点击后滚动到顶部
        el.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}