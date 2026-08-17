/**
 * 公用工程知识库 - 常量配置
 * 所有分类、分页等可配置项集中管理
 */

// ============================================================
// 文章分类
// ============================================================
export const CATEGORIES = [
    { key: '全部', value: '' },
    { key: '供水', value: '供水' },
    { key: '制冷', value: '制冷' },
    { key: '消防', value: '消防' },
    { key: '环保', value: '环保' },
    { key: '压空', value: '压空' },
    { key: '制氮', value: '制氮' },
    { key: '污水', value: '污水' },
    { key: '换算', value: '换算' }
];

// ============================================================
// 分页配置
// ============================================================
export const PAGE_SIZE = 20;              // 每页文章数（桌面端分页器）
export const INFINITE_PAGE_SIZE = 10;     // 无限滚动每次加载数量（移动端）

// ============================================================
// 文章状态
// ============================================================
export const ARTICLE_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived'
};

export const STATUS_LABEL = {
    draft: '草稿',
    published: '已发布',
    archived: '已归档'
};

export const STATUS_COLOR = {
    draft: 'var(--warning)',
    published: 'var(--success)',
    archived: 'var(--text-light)'
};

// ============================================================
// 默认封面图
// ============================================================
export const DEFAULT_COVER = '/assets/images/default-cover.jpg';

// ============================================================
// 本地存储 Key
// ============================================================
export const STORAGE_KEYS = {
    USER: 'knowledge_user',
    TOKEN: 'knowledge_token',
    THEME: 'knowledge_theme'
};

// ============================================================
// API 路径
// ============================================================
export const API_BASE = '/api';

// 具体 API 路径（方便统一修改）
export const API = {
    LOGIN: `${API_BASE}/auth/login`,
    LOGOUT: `${API_BASE}/auth/logout`,
    ME: `${API_BASE}/auth/me`,

    ARTICLES: `${API_BASE}/articles`,
    ADMIN_ARTICLES: `${API_BASE}/admin/articles`,
    ADMIN_USERS: `${API_BASE}/admin/users`,
    ADMIN_STATS: `${API_BASE}/admin/stats`,

    SEARCH: `${API_BASE}/search`,
    UPLOAD: `${API_BASE}/upload`
};

// ============================================================
// 文件上传配置
// ============================================================
export const UPLOAD_CONFIG = {
    MAX_SIZE: 10 * 1024 * 1024,  // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
};

// ============================================================
// 帮助：获取分类显示名称
// ============================================================
export function getCategoryLabel(value) {
    const found = CATEGORIES.find(c => c.value === value);
    return found ? found.key : value;
}

// ============================================================
// 帮助：获取状态显示标签
// ============================================================
export function getStatusLabel(status) {
    return STATUS_LABEL[status] || status;
}

// ============================================================
// 帮助：获取状态颜色
// ============================================================
export function getStatusColor(status) {
    return STATUS_COLOR[status] || 'var(--text-secondary)';
}