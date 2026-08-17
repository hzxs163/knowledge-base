/**
 * Toast 消息提示组件
 * 支持 success / error / warning / info 四种类型
 * 自动消失，可配置持续时间
 */

import { createEl, empty } from '../lib/dom.js';

// ============================================================
// 容器
// ============================================================
const container = document.getElementById('toast-container');

// ============================================================
// 图标映射
// ============================================================
const ICONS = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
};

// ============================================================
// 显示 Toast
// ============================================================
export function showToast(message, type = 'info', duration = 3000) {
    if (!container) {
        console.warn('[Toast] 容器不存在');
        return;
    }

    // 创建 Toast 元素
    const icon = ICONS[type] || ICONS.info;
    const toast = createEl('div', {
        className: `toast toast-${type}`,
        role: 'alert',
        'aria-live': 'polite'
    }, [
        createEl('span', { className: 'toast-icon' }, [icon]),
        createEl('span', {}, [message])
    ]);

    container.appendChild(toast);

    // 自动消失
    const timer = setTimeout(() => {
        removeToast(toast);
    }, duration);

    // 点击关闭
    toast.addEventListener('click', () => {
        clearTimeout(timer);
        removeToast(toast);
    });

    return toast;
}

// ============================================================
// 移除 Toast（带淡出动画）
// ============================================================
function removeToast(toast) {
    if (!toast || !toast.parentNode) return;

    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';

    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 300);
}

// ============================================================
// 快捷方法
// ============================================================
export function showSuccess(message, duration) {
    return showToast(message, 'success', duration);
}

export function showError(message, duration) {
    return showToast(message, 'error', duration);
}

export function showWarning(message, duration) {
    return showToast(message, 'warning', duration);
}

export function showInfo(message, duration) {
    return showToast(message, 'info', duration);
}

// ============================================================
// 清除所有 Toast
// ============================================================
export function clearAllToasts() {
    if (!container) return;
    empty(container);
}