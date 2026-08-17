/**
 * 日期时间工具函数
 * 格式化、相对时间、时间戳转换等
 */

// ============================================================
// 格式化日期 YYYY-MM-DD
// ============================================================
export function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ============================================================
// 格式化日期时间 YYYY-MM-DD HH:mm
// ============================================================
export function formatDateTime(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// ============================================================
// 相对时间（如：3分钟前、2小时前、3天前）
// ============================================================
export function timeAgo(timestamp) {
    if (!timestamp) return '-';

    const now = Date.now();
    const diff = now - timestamp;

    // 小于 60 秒
    if (diff < 60 * 1000) {
        return '刚刚';
    }

    // 小于 60 分钟
    if (diff < 60 * 60 * 1000) {
        const minutes = Math.floor(diff / (60 * 1000));
        return `${minutes}分钟前`;
    }

    // 小于 24 小时
    if (diff < 24 * 60 * 60 * 1000) {
        const hours = Math.floor(diff / (60 * 60 * 1000));
        return `${hours}小时前`;
    }

    // 小于 7 天
    if (diff < 7 * 24 * 60 * 60 * 1000) {
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        return `${days}天前`;
    }

    // 超过 7 天，显示具体日期
    return formatDate(timestamp);
}

// ============================================================
// 获取当前时间戳（毫秒）
// ============================================================
export function now() {
    return Date.now();
}

// ============================================================
// 判断是否今天
// ============================================================
export function isToday(timestamp) {
    if (!timestamp) return false;
    const date = new Date(timestamp);
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate();
}

// ============================================================
// 判断是否本周
// ============================================================
export function isThisWeek(timestamp) {
    if (!timestamp) return false;
    const date = new Date(timestamp);
    const now = new Date();
    const dayOfWeek = now.getDay() || 7;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek + 1);
    weekStart.setHours(0, 0, 0, 0);
    return date.getTime() >= weekStart.getTime();
}

// ============================================================
// 获取年份
// ============================================================
export function getYear(timestamp) {
    if (!timestamp) return null;
    return new Date(timestamp).getFullYear();
}

// ============================================================
// 获取月份（1-12）
// ============================================================
export function getMonth(timestamp) {
    if (!timestamp) return null;
    return new Date(timestamp).getMonth() + 1;
}