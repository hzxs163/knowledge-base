/**
 * 应用主入口
 * 初始化路由、认证状态监听等
 */

import { initRouter } from './lib/router.js';
import { loadUserFromStorage, onAuthChange, getCurrentUser } from './lib/auth.js';
import { renderHeader } from './components/Header.js';
import { renderFooter } from './components/Footer.js';
import { showToast } from './components/Toast.js';

// ============================================================
// DOM 引用
// ============================================================
const appHeader = document.getElementById('app-header');
const appFooter = document.getElementById('app-footer');

// ============================================================
// 初始化应用
// ============================================================
async function initApp() {
    // 1. 从本地存储恢复用户
    const user = loadUserFromStorage();

    // 2. 渲染 Header 和 Footer（初始状态）
    appHeader.innerHTML = renderHeader(user);
    appFooter.innerHTML = renderFooter();

    // 3. 监听认证状态变化（登录/登出时自动更新 Header）
    onAuthChange((newUser) => {
        appHeader.innerHTML = renderHeader(newUser);
        // 可以在这里添加其他需要响应登录状态变化的逻辑
    });

    // 4. 初始化路由（监听路径变化，渲染对应页面）
    initRouter();

    // 5. 捕获全局未处理的 Promise 错误
    window.addEventListener('unhandledrejection', (event) => {
        console.error('[App] 未处理的 Promise 错误:', event.reason);
        // 如果是网络错误，静默处理，不弹窗干扰用户
        if (event.reason?.message?.includes('fetch') || event.reason?.message?.includes('network')) {
            event.preventDefault();
            return;
        }
        // 其他错误可以提示
        showToast('系统异常，请刷新页面重试', 'error');
    });

    console.log('[App] 应用初始化完成');
}

// ============================================================
// 启动应用
// ============================================================
// 确保 DOM 加载完成后再初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}