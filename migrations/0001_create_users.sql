-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nickname TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer',
    is_active INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- 插入默认管理员（密码: admin123）
-- 注意：密码哈希需要使用实际的哈希值，这里仅作示例
-- 实际使用时请用 functions/utils/password.js 生成
-- INSERT INTO users (id, email, password_hash, nickname, role, is_active, created_at, updated_at)
-- VALUES ('admin-001', 'admin@example.com', '请替换为实际哈希值', '管理员', 'admin', 1, unixepoch(), unixepoch());