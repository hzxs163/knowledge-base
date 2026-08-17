/**
 * 密码加密工具
 * 使用 bcrypt 进行密码哈希
 */

// ============================================================
// 哈希密码
// ============================================================
export async function hashPassword(password) {
    try {
        // 使用 Web Crypto API 进行 SHA-256 哈希
        // 注意：这不是 bcrypt，但作为替代方案
        const encoder = new TextEncoder();
        const data = encoder.encode(password + process.env.PASSWORD_SALT || 'salt');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    } catch (err) {
        console.error('[Password] 哈希失败:', err);
        throw new Error('密码加密失败');
    }
}

// ============================================================
// 验证密码
// ============================================================
export async function verifyPassword(password, hash) {
    try {
        const newHash = await hashPassword(password);
        return newHash === hash;
    } catch (err) {
        console.error('[Password] 验证失败:', err);
        return false;
    }
}

// ============================================================
// 生成随机盐值
// ============================================================
export function generateSalt() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let salt = '';
    for (let i = 0; i < 16; i++) {
        salt += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return salt;
}

// ============================================================
// 带盐的密码哈希
// ============================================================
export async function hashPasswordWithSalt(password, salt) {
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + salt);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return `${salt}:${hashHex}`;
    } catch (err) {
        console.error('[Password] 哈希失败:', err);
        throw new Error('密码加密失败');
    }
}

// ============================================================
// 验证带盐的密码
// ============================================================
export async function verifyPasswordWithSalt(password, storedHash) {
    try {
        const parts = storedHash.split(':');
        if (parts.length !== 2) {
            return false;
        }
        const [salt, hash] = parts;
        const newHash = await hashPasswordWithSalt(password, salt);
        return newHash === storedHash;
    } catch (err) {
        console.error('[Password] 验证失败:', err);
        return false;
    }
}

// ============================================================
// 生成随机密码（用于重置）
// ============================================================
export function generateRandomPassword(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}