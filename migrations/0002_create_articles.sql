-- 文章表
CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    category TEXT,
    tags TEXT,
    cover_image TEXT,
    author_id TEXT NOT NULL,
    view_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);