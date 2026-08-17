/**
 * 表单校验工具函数
 * 邮箱、密码、必填等校验
 */

// ============================================================
// 校验邮箱格式
// ============================================================
export function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    // 简单但完整的邮箱正则
    const regex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email.trim());
}

// ============================================================
// 校验密码强度（最少6位）
// ============================================================
export function isValidPassword(password) {
    if (!password || typeof password !== 'string') return false;
    return password.trim().length >= 6;
}

// ============================================================
// 校验密码强度（强密码：8位+字母+数字）
// ============================================================
export function isStrongPassword(password) {
    if (!password || typeof password !== 'string') return false;
    const trimmed = password.trim();
    if (trimmed.length < 8) return false;
    const hasLetter = /[a-zA-Z]/.test(trimmed);
    const hasNumber = /[0-9]/.test(trimmed);
    return hasLetter && hasNumber;
}

// ============================================================
// 校验非空
// ============================================================
export function isNotEmpty(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
}

// ============================================================
// 校验手机号（中国大陆）
// ============================================================
export function isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    const regex = /^1[3-9]\d{9}$/;
    return regex.test(phone.trim());
}

// ============================================================
// 校验 URL 格式
// ============================================================
export function isValidUrl(url) {
    if (!url || typeof url !== 'string') return false;
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

// ============================================================
// 校验 Slug（仅字母数字连字符）
// ============================================================
export function isValidSlug(slug) {
    if (!slug || typeof slug !== 'string') return false;
    const regex = /^[a-z0-9\-]+$/;
    return regex.test(slug);
}

// ============================================================
// 校验数字
// ============================================================
export function isNumber(value) {
    if (typeof value === 'number') return !isNaN(value);
    if (typeof value === 'string') return /^-?\d+(\.\d+)?$/.test(value.trim());
    return false;
}

// ============================================================
// 校验整数
// ============================================================
export function isInteger(value) {
    if (typeof value === 'number') return Number.isInteger(value);
    if (typeof value === 'string') return /^-?\d+$/.test(value.trim());
    return false;
}

// ============================================================
// 校验长度范围
// ============================================================
export function isValidLength(value, min, max) {
    if (!value || typeof value !== 'string') return false;
    const len = value.trim().length;
    return len >= min && len <= max;
}

// ============================================================
// 校验是否包含特殊字符（用于用户名等）
// ============================================================
export function hasSpecialChar(str) {
    if (!str || typeof str !== 'string') return false;
    const regex = /[^a-zA-Z0-9\u4e00-\u9fa5]/;
    return regex.test(str);
}

// ============================================================
// 校验确认密码是否一致
// ============================================================
export function isPasswordMatch(password, confirm) {
    return password && confirm && password === confirm;
}

// ============================================================
// 校验对象所有必填字段
// ============================================================
export function validateRequired(obj, fields) {
    const errors = [];
    for (const field of fields) {
        const value = obj[field];
        if (!isNotEmpty(value)) {
            errors.push(`${field} 不能为空`);
        }
    }
    return {
        valid: errors.length === 0,
        errors
    };
}