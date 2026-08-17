/**
 * 密码加密工具
 */

// ============================================================
// 哈希密码
// ============================================================
async function hashPassword(password) {
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
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
async function verifyPassword(password, hash) {
    try {
        const newHash = await hashPassword(password);
        return newHash === hash;
    } catch (err) {
        console.error('[Password] 验证失败:', err);
        return false;
    }
}

// ============================================================
// 生成随机密码
// ============================================================
function generateRandomPassword(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// ============================================================
// 导出
// ============================================================
module.exports = {
    hashPassword,
    verifyPassword,
    generateRandomPassword
};
