/**
 * 认证管理
 * 登录状态、用户信息、权限判断
 */

import { getMe, login as apiLogin, logout as apiLogout } from './api.js';
import { setItem, getItem, removeItem } from './storage.js';
import { STORAGE_KEYS } from './constants.js';

// ============================================================
// 用户信息存储
// ============================================================
let currentUser = null;
let authListeners = [];

// ============================================================
// 获取当前用户（从内存）
// ============================================================
export function getCurrentUser() {
    return currentUser;
}

// ============================================================
// 从本地存储恢复用户
// ============================================================
export function loadUserFromStorage() {
    const user = getItem(STORAGE_KEYS.USER);
    if (user) {
        currentUser = user;
    }
    return currentUser;
}

// ============================================================
// 设置当前用户
// ============================================================
export function setCurrentUser(user) {
    currentUser = user;
    if (user) {
        setItem(STORAGE_KEYS.USER, user);
    } else {
        removeItem(STORAGE_KEYS.USER);
    }
    notifyListeners();
}

// ============================================================
// 登录
// ============================================================
export async function login(email, password) {
    const result = await apiLogin(email, password);

    if (result.success) {
        setCurrentUser(result.data.user);
        // 如果有 token，单独存储（备用）
        if (result.data.token) {
            setItem('token', result.data.token);
        }
        return { success: true, user: result.data.user };
    }

    return { success: false, error: result.error };
}

// ============================================================
// 登出
// ============================================================
export async function logout() {
    await apiLogout();
    setCurrentUser(null);
    removeItem('token');
    return { success: true };
}

// ============================================================
// 刷新用户信息（从服务端获取最新）
// ============================================================
export async function refreshUser() {
    const result = await getMe();

    if (result.success) {
        setCurrentUser(result.data);
        return { success: true, user: result.data };
    }

    // 如果获取失败（401等），清除本地用户
    if (result.status === 401) {
        setCurrentUser(null);
        removeItem('token');
    }

    return { success: false, error: result.error };
}

// ============================================================
// 判断是否已登录
// ============================================================
export function isLoggedIn() {
    return currentUser !== null;
}

// ============================================================
// 判断是否管理员
// ============================================================
export function isAdmin() {
    return currentUser && currentUser.role === 'admin';
}

// ============================================================
// 判断是否普通用户
// ============================================================
export function isViewer() {
    return currentUser && currentUser.role === 'viewer';
}

// ============================================================
// 权限监听
// ============================================================
export function onAuthChange(callback) {
    authListeners.push(callback);
    return () => {
        authListeners = authListeners.filter(cb => cb !== callback);
    };
}

function notifyListeners() {
    for (const cb of authListeners) {
        try {
            cb(currentUser);
        } catch (e) {
            console.warn('[Auth] 监听回调执行失败:', e);
        }
    }
}

// ============================================================
// 初始化：从存储恢复用户
// ============================================================
loadUserFromStorage();

// ============================================================
// 判断路由是否需要登录
// ============================================================
export function requiresAuth(path) {
    // 登录页不需要登录
    if (path === '/login') return false;
    // 其他页面都需要登录（知识库完全私有）
    return true;
}

// ============================================================
// 判断路由是否需要管理员权限
// ============================================================
export function requiresAdmin(path) {
    return path.startsWith('/dashboard');
}

// ============================================================
// 路由守卫
// ============================================================
export function checkRoute(path) {
    loadUserFromStorage();
    // 登录页：已登录则跳转首页，未登录则放行
    if (path === '/login') {
        if (isLoggedIn()) {
            return { allowed: false, redirect: '/' };
        }
        return { allowed: true };
    }

    // 其他页面：未登录则跳转登录
    if (!isLoggedIn()) {
        return { allowed: false, redirect: '/login' };
    }

    // 管理后台：普通用户无权限
    if (path.startsWith('/dashboard') && !isAdmin()) {
        return { allowed: false, redirect: '/' };
    }

    return { allowed: true };
}
