/**
 * Slug 生成工具
 */

const PINYIN_MAP = {
    '水': 'shui',
    '供': 'gong',
    '制': 'zhi',
    '冷': 'leng',
    '消': 'xiao',
    '防': 'fang',
    '环': 'huan',
    '保': 'bao',
    '压': 'ya',
    '空': 'kong',
    '氮': 'dan',
    '污': 'wu',
    '换': 'huan',
    '算': 'suan',
    '纯': 'chun',
    '膜': 'mo',
    '替': 'ti',
    '操': 'cao',
    '作': 'zuo',
    '规': 'gui',
    '程': 'cheng',
    '维': 'wei',
    '护': 'hu',
    '检': 'jian',
    '修': 'xiu',
    '安': 'an',
    '全': 'quan',
    '管': 'guan',
    '理': 'li',
    '运': 'yun',
    '行': 'xing',
    '调': 'tiao',
    '试': 'shi',
    '验': 'yan',
    '收': 'shou',
    '记': 'ji',
    '录': 'lu',
    '报': 'bao',
    '告': 'gao',
    '总': 'zong',
    '结': 'jie',
    '方': 'fang',
    '案': 'an',
    '标': 'biao',
    '准': 'zhun',
    '范': 'fan',
    '手': 'shou',
    '册': 'ce',
    '指': 'zhi',
    '南': 'nan',
    '计': 'ji',
    '划': 'hua',
    '评': 'ping',
    '估': 'gu',
    '测': 'ce',
    '量': 'liang'
};

// ============================================================
// 生成 Slug
// ============================================================
function generateSlug(text, maxLength = 60) {
    if (!text) return '';

    let slug = text
        .toLowerCase()
        .split('')
        .map(char => PINYIN_MAP[char] || char)
        .join('')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\u4e00-\u9fa5\-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    if (!slug) {
        slug = Date.now().toString();
    }

    if (slug.length > maxLength) {
        slug = slug.slice(0, maxLength);
        slug = slug.replace(/-[^-]*$/, '');
    }

    return slug;
}

// ============================================================
// 从标题生成 Slug
// ============================================================
function slugify(title) {
    if (!title) return '';

    if (/^[a-zA-Z0-9\s\-]+$/.test(title)) {
        return title
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9\-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    return generateSlug(title);
}

// ============================================================
// 验证 Slug
// ============================================================
function isValidSlug(slug) {
    if (!slug) return false;
    return /^[a-z0-9\-]+$/.test(slug);
}

// ============================================================
// 生成唯一 Slug
// ============================================================
function generateUniqueSlug(text) {
    const base = slugify(text) || 'article';
    const suffix = Math.random().toString(36).slice(2, 6);
    return `${base}-${suffix}`;
}

// ============================================================
// 导出
// ============================================================
module.exports = {
    generateSlug,
    slugify,
    isValidSlug,
    generateUniqueSlug
};
