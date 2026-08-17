/**
 * Slug 生成工具
 * 将中文标题转换为 URL 友好的 Slug
 */

// ============================================================
// 基础拼音映射（常用汉字转拼音）
// ============================================================
// 注意：这是一个简化版本，仅覆盖常用字
// 完整版建议使用 pinyin 库或 API
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
    '换': 'huan',
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
    '规': 'gui',
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
// 将中文转为拼音（简化版）
// ============================================================
function chineseToPinyin(text) {
    let result = '';
    for (const char of text) {
        if (PINYIN_MAP[char]) {
            result += PINYIN_MAP[char];
        } else {
            result += char;
        }
    }
    return result;
}

// ============================================================
// 生成 Slug
// ============================================================
export function generateSlug(text, maxLength = 60) {
    if (!text) return '';

    let slug = text
        // 转小写
        .toLowerCase()
        // 中文转拼音
        .split('')
        .map(char => PINYIN_MAP[char] || char)
        .join('')
        // 替换空格为连字符
        .replace(/\s+/g, '-')
        // 只保留字母、数字、连字符、中文
        .replace(/[^a-z0-9\u4e00-\u9fa5\-]/g, '')
        // 多个连字符合并为一个
        .replace(/-+/g, '-')
        // 去除首尾连字符
        .replace(/^-|-$/g, '');

    // 如果 slug 为空，使用时间戳
    if (!slug) {
        slug = Date.now().toString();
    }

    // 截断长度
    if (slug.length > maxLength) {
        slug = slug.slice(0, maxLength);
        // 去掉末尾不完整的词
        slug = slug.replace(/-[^-]*$/, '');
    }

    return slug;
}

// ============================================================
// 从标题生成 Slug（带英文检测）
// ============================================================
export function slugify(title) {
    if (!title) return '';

    // 如果标题已经是英文（只包含字母数字空格连字符）
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
// 验证 Slug 是否合法
// ============================================================
export function isValidSlug(slug) {
    if (!slug) return false;
    return /^[a-z0-9\-]+$/.test(slug);
}

// ============================================================
// 生成唯一 Slug（带随机后缀）
// ============================================================
export function generateUniqueSlug(text) {
    const base = slugify(text) || 'article';
    const suffix = Math.random().toString(36).slice(2, 6);
    return `${base}-${suffix}`;
}