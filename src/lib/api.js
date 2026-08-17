/**
 * API 调用封装
 * 统一处理请求、响应、错误
 */

import { API } from './constants.js';
import { getItem } from './storage.js';
import { buildQueryString } from './utils.js';

// ============================================================
// 核心请求函数
// ============================================================
export async function request(url, options = {}) {
    const {
        method = 'GET',
        body = null,
        headers = {},
        requiresAuth = true,
        ...rest
    } = options;

    // 构造请求头
    const requestHeaders = {
        'Content-Type': 'application/json',
        ...headers
    };

    // 如果需要认证，携带 Cookie（浏览器会自动携带）
    // 但为了额外安全，也可以从 storage 取 token 放入 Authorization
    if (requiresAuth) {
        const token = getItem('token');
        if (token) {
            requestHeaders['Authorization'] = `Bearer ${token}`;
        }
    }

    const fetchOptions = {
        method,
        headers: requestHeaders,
        credentials: 'include',  // 携带 Cookie
        ...rest
    };

    if (body && method !== 'GET') {
        fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    try {
        const response = await fetch(url, fetchOptions);
        const data = await response.json();

        // 统一返回格式：{ success, data, error, code }
        if (!response.ok) {
            // 401 未登录：清除本地用户信息
            if (response.status === 401) {
                // 触发全局登出（由调用方处理）
                return {
                    success: false,
                    error: data.error || '请先登录',
                    code: 'UNAUTHORIZED',
                    status: response.status
                };
            }

            return {
                success: false,
                error: data.error || `请求失败 (${response.status})`,
                code: data.code || 'REQUEST_FAILED',
                status: response.status
            };
        }

        return {
            success: true,
            data: data.data,
            ...data
        };
    } catch (err) {
        console.error('[API] 网络错误:', err);
        return {
            success: false,
            error: '网络连接失败，请检查网络后重试',
            code: 'NETWORK_ERROR'
        };
    }
}

// ============================================================
// 快捷方法
// ============================================================
export function get(url, params = {}, options = {}) {
    const queryString = buildQueryString(params);
    const fullUrl = queryString ? `${url}${queryString}` : url;
    return request(fullUrl, { method: 'GET', ...options });
}

export function post(url, body = {}, options = {}) {
    return request(url, { method: 'POST', body, ...options });
}

export function put(url, body = {}, options = {}) {
    return request(url, { method: 'PUT', body, ...options });
}

export function del(url, options = {}) {
    return request(url, { method: 'DELETE', ...options });
}

// ============================================================
// 业务 API
// ============================================================

// ---------- 认证 ----------
export function login(email, password) {
    return post(API.LOGIN, { email, password });
}

export function logout() {
    return post(API.LOGOUT);
}

export function getMe() {
    return get(API.ME);
}

// ---------- 文章（公开） ----------
export function getArticles(params = {}) {
    return get(API.ARTICLES, params);
}

export function getArticle(slug) {
    return get(`${API.ARTICLES}/${slug}`);
}

// ---------- 文章（管理员） ----------
export function createArticle(data) {
    return post(API.ADMIN_ARTICLES, data);
}

export function updateArticle(slug, data) {
    return put(`${API.ADMIN_ARTICLES}/${slug}`, data);
}

export function deleteArticle(slug) {
    return del(`${API.ADMIN_ARTICLES}/${slug}`);
}

export function getAllArticles(params = {}) {
    return get(API.ADMIN_ARTICLES, params);
}

// ---------- 用户（管理员） ----------
export function getUsers() {
    return get(API.ADMIN_USERS);
}

export function addUser(data) {
    return post(API.ADMIN_USERS, data);
}

export function updateUser(id, data) {
    return put(`${API.ADMIN_USERS}/${id}`, data);
}

export function deleteUser(id) {
    return del(`${API.ADMIN_USERS}/${id}`);
}

// ---------- 搜索 ----------
export function search(query) {
    return get(API.SEARCH, { q: query });
}

// ---------- 统计 ----------
export function getStats() {
    return get(API.ADMIN_STATS);
}

// ---------- 上传 ----------
export function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    return request(API.UPLOAD, {
        method: 'POST',
        body: formData,
        headers: {} // 让浏览器自动设置 Content-Type
    });
}