// ============================================================
// 校验邮箱格式
// ============================================================
export function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
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
// 校验 Slug（仅小写字母、数字、连字符）
// ============================================================
export function isValidSlug(slug) {
    if (!slug || typeof slug !== 'string') return false;
    const regex = /^[a-z0-9\-]+$/;
    return regex.test(slug);
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
// 校验枚举值
// ============================================================
export function isValidEnum(value, allowedValues) {
    if (!value) return false;
    return allowedValues.includes(value);
}

// ============================================================
// 校验对象必填字段
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

// ============================================================
// 校验文章状态
// ============================================================
export function isValidArticleStatus(status) {
    const allowed = ['draft', 'published', 'archived'];
    return isValidEnum(status, allowed);
}

// ============================================================
// 校验用户角色
// ============================================================
export function isValidUserRole(role) {
    const allowed = ['admin', 'viewer'];
    return isValidEnum(role, allowed);
}
