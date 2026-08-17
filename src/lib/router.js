/**
 * 前端路由
 * 监听 pathname 变化，触发页面切换
 */

import { checkRoute } from './auth.js';
import { renderHome } from '../pages/home.js';
import { renderArticle } from '../pages/article.js';
import { renderSearch } from '../pages/search.js';
import { renderLogin } from '../pages/login.js';
import { renderDashboard } from '../pages/dashboard/index.js';
import { renderUsers } from '../pages/dashboard/users.js';
import { renderEdit } from '../pages/dashboard/edit.js';
import { renderHeader } from '../components/Header.js';
import { renderFooter } from '../components/Footer.js';
import { getCurrentUser } from './auth.js';
import { scrollToTop } from './utils.js';
import { showToast } from '../components/Toast.js';

// ============================================================
// DOM 引用
// ============================================================
const appHeader = document.getElementById('app-header');
const appMain = document.getElementById('app-main');
const appFooter = document.getElementById('app-footer');

// ============================================================
// 路由配置
// ============================================================
const routes = {
    '/': renderHome,
    '/login': renderLogin,
    '/dashboard': renderDashboard,
    '/dashboard/users': renderUsers,
    '/dashboard/edit': renderEdit,
};

// ============================================================
// 匹配路由
// ============================================================
function matchRoute(path) {
    // 精确匹配
    if (routes[path]) {
        return { handler: routes[path], params: {} };
    }

    // 动态路由: /article/xxx
    if (path.startsWith('/article/')) {
        const slug = path.replace('/article/', '');
        return { handler: renderArticle, params: { slug } };
    }

    // 动态路由: /dashboard/edit/xxx (编辑已有文章)
    if (path.startsWith('/dashboard/edit/')) {
        const slug = path.replace('/dashboard/edit/', '');
        return { handler: renderEdit, params: { slug } };
    }

    // 匹配搜索: /search?q=xxx
    if (path === '/search') {
        const params = new URLSearchParams(window.location.search);
        const query = params.get('q') || '';
        return { handler: renderSearch, params: { query } };
    }

    // 404
    return null;
}

// ============================================================
// 渲染页面
// ============================================================
export async function navigateTo(path, pushState = true) {
    // 路由守卫
    const guard = checkRoute(path);
    if (!guard.allowed) {
        if (guard.redirect) {
            navigateTo(guard.redirect, true);
            return;
        }
        return;
    }

    // 匹配路由
    const route = matchRoute(path);
    if (!route) {
        // 404：重定向到首页
        console.warn('[Router] 页面未找到:', path);
        navigateTo('/', true);
        return;
    }

    try {
        // 获取当前用户
        const user = getCurrentUser();

        // 渲染 Header（不同用户显示不同内容）
        appHeader.innerHTML = renderHeader(user);

        // 渲染页面内容
        const { handler, params } = route;
        const content = await handler(params);
        appMain.innerHTML = content;

        // 渲染 Footer
        appFooter.innerHTML = renderFooter();

        // 更新 URL（如果需要）
        if (pushState) {
            window.history.pushState({ path }, '', path);
        }

        // 滚动到顶部
        scrollToTop();

        // 触发页面加载完成事件（用于无限滚动等）
        window.dispatchEvent(new CustomEvent('page-loaded', { detail: { path } }));

    } catch (err) {
        console.error('[Router] 渲染失败:', err);
        appMain.innerHTML = `
            <div class="error-page">
                <div class="error-card">
                    <div class="error-icon">😵</div>
                    <h1 class="error-title">页面加载失败</h1>
                    <p class="error-desc">${err.message || '请稍后重试'}</p>
                    <a href="/" class="error-btn" data-link>返回首页</a>
                </div>
            </div>
        `;
        showToast('页面加载失败，请刷新重试', 'error');
    }
}

// ============================================================
// 监听浏览器前进/后退
// ============================================================
window.addEventListener('popstate', (event) => {
    const path = event.state?.path || window.location.pathname;
    // 不 pushState，避免重复记录历史
    navigateTo(path, false);
});

// ============================================================
// 拦截所有链接点击（实现 SPA 跳转）
// ============================================================
document.addEventListener('click', (e) => {
    const target = e.target.closest('a[href]');
    if (!target) return;

    const href = target.getAttribute('href');

    // 忽略：外部链接、锚点、下载、target=_blank
    if (
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#') ||
        href.startsWith('javascript:') ||
        target.target === '_blank'
    ) {
        return;
    }

    // 忽略：data-link 标记的用自定义跳转
    if (target.dataset.link) {
        return;
    }

    e.preventDefault();

    // 处理相对路径
    let path = href;
    if (path.startsWith('/')) {
        // 绝对路径
    } else {
        // 相对路径，基于当前路径拼接
        const current = window.location.pathname;
        const base = current.endsWith('/') ? current : current.split('/').slice(0, -1).join('/') + '/';
        path = new URL(href, window.location.origin + base).pathname;
    }

    navigateTo(path, true);
});

// ============================================================
// 初始化：首次加载
// ============================================================
export function initRouter() {
    const path = window.location.pathname;
    // 保留 search 参数（如 ?q=xxx）
    const search = window.location.search;
    const fullPath = path + search;

    // 首次加载不需要 pushState
    navigateTo(fullPath, false);
}