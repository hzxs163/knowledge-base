/**
 * 公用工具函数
 * 通用、无业务逻辑的辅助函数
 */

// ============================================================
// 防抖
// ============================================================
export function debounce(fn, delay = 300) {
    let timer = null;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            fn.apply(this, args);
            timer = null;
        }, delay);
    };
}

// ============================================================
// 节流
// ============================================================
export function throttle(fn, delay = 300) {
    let lastTime = 0;
    let timer = null;
    return function (...args) {
        const now = Date.now();
        if (now - lastTime >= delay) {
            fn.apply(this, args);
            lastTime = now;
        } else if (!timer) {
            timer = setTimeout(() => {
                fn.apply(this, args);
                lastTime = Date.now();
                timer = null;
            }, delay - (now - lastTime));
        }
    };
}

// ============================================================
// 生成短 ID（用于临时元素标识）
// ============================================================
export function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================
// 从对象中移除空值字段（用于API请求参数）
// ============================================================
export function removeEmpty(obj) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== null && value !== undefined && value !== '') {
            result[key] = value;
        }
    }
    return result;
}

// ============================================================
// 深拷贝
// ============================================================
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    if (obj instanceof Array) {
        return obj.map(item => deepClone(item));
    }
    const cloned = {};
    for (const [key, value] of Object.entries(obj)) {
        cloned[key] = deepClone(value);
    }
    return cloned;
}

// ============================================================
// 截断文本（带省略号）
// ============================================================
export function truncateText(text, maxLength = 100, suffix = '...') {
    if (!text || text.length <= maxLength) {
        return text;
    }
    return text.slice(0, maxLength) + suffix;
}

// ============================================================
// 高亮匹配文本（搜索用）
// ============================================================
export function highlightText(text, keyword) {
    if (!text || !keyword) {
        return text;
    }
    const regex = new RegExp(escapeRegex(keyword), 'gi');
    return text.replace(regex, match => `<mark>${match}</mark>`);
}

// ============================================================
// 转义正则特殊字符
// ============================================================
export function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================
// 判断是否移动端
// ============================================================
export function isMobile() {
    return window.innerWidth < 640;
}

// ============================================================
// 判断是否桌面端
// ============================================================
export function isDesktop() {
    return window.innerWidth >= 1024;
}

// ============================================================
// 滚动到页面顶部
// ============================================================
export function scrollToTop(behavior = 'smooth') {
    window.scrollTo({ top: 0, behavior });
}

// ============================================================
// 检查是否滚动到底部（用于无限滚动）
// ============================================================
export function isScrolledToBottom(threshold = 50) {
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const clientHeight = document.documentElement.clientHeight;
    return scrollTop + clientHeight >= scrollHeight - threshold;
}

// ============================================================
// 获取 URL 参数
// ============================================================
export function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params.entries()) {
        result[key] = value;
    }
    return result;
}

// ============================================================
// 构建查询字符串
// ============================================================
export function buildQueryString(params) {
    const filtered = removeEmpty(params);
    const parts = [];
    for (const [key, value] of Object.entries(filtered)) {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
    return parts.length ? `?${parts.join('&')}` : '';
}

// ============================================================
// 安全解析 JSON（不抛错）
// ============================================================
export function safeParseJSON(str, fallback = null) {
    try {
        return JSON.parse(str);
    } catch {
        return fallback;
    }
}

// ============================================================
// 睡眠函数（用于延迟/重试）
// ============================================================
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}