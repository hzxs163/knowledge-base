/**
 * 本地存储封装
 * 统一管理 localStorage/sessionStorage 读写
 */

// ============================================================
// 存储引擎（默认 localStorage）
// ============================================================
const engine = localStorage;

// ============================================================
// 存
// ============================================================
export function setItem(key, value) {
    try {
        const data = typeof value === 'string' ? value : JSON.stringify(value);
        engine.setItem(key, data);
        return true;
    } catch (e) {
        console.warn('[Storage] setItem error:', e);
        return false;
    }
}

// ============================================================
// 取
// ============================================================
export function getItem(key, fallback = null) {
    try {
        const value = engine.getItem(key);
        if (value === null) return fallback;
        // 尝试解析 JSON，失败则返回原字符串
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    } catch (e) {
        console.warn('[Storage] getItem error:', e);
        return fallback;
    }
}

// ============================================================
// 删
// ============================================================
export function removeItem(key) {
    try {
        engine.removeItem(key);
        return true;
    } catch (e) {
        console.warn('[Storage] removeItem error:', e);
        return false;
    }
}

// ============================================================
// 清空所有
// ============================================================
export function clear() {
    try {
        engine.clear();
        return true;
    } catch (e) {
        console.warn('[Storage] clear error:', e);
        return false;
    }
}

// ============================================================
// Session 存储（会话级，关闭页面失效）
// ============================================================
export const session = {
    set(key, value) {
        try {
            const data = typeof value === 'string' ? value : JSON.stringify(value);
            sessionStorage.setItem(key, data);
            return true;
        } catch { return false; }
    },
    get(key, fallback = null) {
        try {
            const value = sessionStorage.getItem(key);
            if (value === null) return fallback;
            try { return JSON.parse(value); } catch { return value; }
        } catch { return fallback; }
    },
    remove(key) {
        try { sessionStorage.removeItem(key); return true; } catch { return false; }
    },
    clear() {
        try { sessionStorage.clear(); return true; } catch { return false; }
    }
};