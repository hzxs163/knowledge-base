/**
 * 顶部导航栏组件
 * 根据用户角色显示不同内容：
 * - 未登录：显示「登录」按钮
 * - 普通用户：显示「昵称 + 退出」
 * - 管理员：显示「管理后台 + 昵称 + 退出」
 */

import { isAdmin, isLoggedIn, logout, getCurrentUser } from '../lib/auth.js';
import { navigateTo } from '../lib/router.js';

// ============================================================
// 渲染 Header
// ============================================================
export function renderHeader(user) {
    const isLoggedInUser = !!user;
    const isAdminUser = isLoggedInUser && user.role === 'admin';

    // 右侧区域
    let rightSection = '';

    if (!isLoggedInUser) {
        // 未登录：显示登录按钮
        rightSection = `
            <a href="/login" class="btn-login" data-link>登录</a>
        `;
    } else if (isAdminUser) {
        // 管理员：显示管理后台入口 + 昵称 + 退出
        rightSection = `
            <a href="/dashboard" class="btn-admin" data-link>📊 管理后台</a>
            <span class="user-name">👋 ${escapeHtml(user.nickname)}</span>
            <button class="btn-logout" id="logoutBtn">退出</button>
        `;
    } else {
        // 普通用户：显示昵称 + 退出（没有管理后台入口）
        rightSection = `
            <span class="user-name">👋 ${escapeHtml(user.nickname)}</span>
            <button class="btn-logout" id="logoutBtn">退出</button>
        `;
    }

    return `
        <header class="header">
            <div class="header-left">
                <a href="/" class="header-logo" data-link>
                    <span>📚</span> 知识库
                </a>
            </div>
            <div class="header-center">
                <input
                    type="text"
                    class="search-input"
                    id="headerSearchInput"
                    placeholder="搜索文章..."
                    autocomplete="off"
                />
            </div>
            <div class="header-right">
                ${rightSection}
            </div>
        </header>
    `;
}

// ============================================================
// 绑定 Header 事件
// ============================================================
export function bindHeaderEvents() {
    // ---------- 搜索框 ----------
    const searchInput = document.getElementById('headerSearchInput');
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    navigateTo(`/search?q=${encodeURIComponent(query)}`, true);
                    // 移动端失焦，收起键盘
                    searchInput.blur();
                }
            }
        });
    }

    // ---------- 退出按钮 ----------
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const confirmLogout = confirm('确定要退出登录吗？');
            if (!confirmLogout) return;

            try {
                await logout();
                // 跳转到登录页
                navigateTo('/login', true);
            } catch (err) {
                console.error('[Header] 退出失败:', err);
                // 即使接口失败，也清除本地状态
                logout();
                navigateTo('/login', true);
            }
        });
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