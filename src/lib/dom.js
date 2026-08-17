/**
 * DOM 操作工具函数
 * 创建元素、查询、操作类等
 */

// ============================================================
// 创建元素（带属性和子元素）
// ============================================================
export function createEl(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);

    // 设置属性
    for (const [key, value] of Object.entries(attrs)) {
        if (key === 'className') {
            el.className = value;
        } else if (key === 'dataset') {
            for (const [dataKey, dataValue] of Object.entries(value)) {
                el.dataset[dataKey] = dataValue;
            }
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(el.style, value);
        } else if (key === 'events' && typeof value === 'object') {
            for (const [event, handler] of Object.entries(value)) {
                el.addEventListener(event, handler);
            }
        } else if (key.startsWith('on') && typeof value === 'function') {
            el.addEventListener(key.slice(2).toLowerCase(), value);
        } else if (key === 'html') {
            el.innerHTML = value;
        } else if (key === 'text') {
            el.textContent = value;
        } else {
            el.setAttribute(key, value);
        }
    }

    // 添加子元素
    for (const child of children) {
        if (typeof child === 'string') {
            el.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            el.appendChild(child);
        } else if (Array.isArray(child)) {
            for (const sub of child) {
                if (typeof sub === 'string') {
                    el.appendChild(document.createTextNode(sub));
                } else if (sub instanceof Node) {
                    el.appendChild(sub);
                }
            }
        }
    }

    return el;
}

// ============================================================
// 查询单个元素（带错误提示）
// ============================================================
export function qs(selector, parent = document) {
    const el = parent.querySelector(selector);
    if (!el) {
        console.warn(`[DOM] 未找到元素: ${selector}`);
    }
    return el;
}

// ============================================================
// 查询多个元素
// ============================================================
export function qsa(selector, parent = document) {
    return parent.querySelectorAll(selector);
}

// ============================================================
// 添加类
// ============================================================
export function addClass(el, ...classNames) {
    if (!el) return;
    for (const name of classNames) {
        if (name) el.classList.add(name);
    }
}

// ============================================================
// 移除类
// ============================================================
export function removeClass(el, ...classNames) {
    if (!el) return;
    for (const name of classNames) {
        if (name) el.classList.remove(name);
    }
}

// ============================================================
// 切换类
// ============================================================
export function toggleClass(el, className, force) {
    if (!el) return;
    if (force !== undefined) {
        el.classList.toggle(className, force);
    } else {
        el.classList.toggle(className);
    }
}

// ============================================================
// 判断是否有类
// ============================================================
export function hasClass(el, className) {
    if (!el) return false;
    return el.classList.contains(className);
}

// ============================================================
// 清空元素内容
// ============================================================
export function empty(el) {
    if (!el) return;
    el.innerHTML = '';
}

// ============================================================
// 替换元素内容
// ============================================================
export function html(el, content) {
    if (!el) return;
    el.innerHTML = content;
}

// ============================================================
// 获取元素文本
// ============================================================
export function text(el) {
    if (!el) return '';
    return el.textContent || '';
}

// ============================================================
// 显示/隐藏元素
// ============================================================
export function show(el) {
    if (!el) return;
    el.style.display = '';
}

export function hide(el) {
    if (!el) return;
    el.style.display = 'none';
}

export function toggle(el) {
    if (!el) return;
    el.style.display = el.style.display === 'none' ? '' : 'none';
}

// ============================================================
// 判断元素是否可见
// ============================================================
export function isVisible(el) {
    if (!el) return false;
    return el.offsetParent !== null || el.style.display !== 'none';
}

// ============================================================
// 获取元素数据属性
// ============================================================
export function getData(el, key) {
    if (!el) return null;
    return el.dataset[key] || null;
}

// ============================================================
// 设置元素数据属性
// ============================================================
export function setData(el, key, value) {
    if (!el) return;
    el.dataset[key] = value;
}