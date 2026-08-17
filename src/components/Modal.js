/**
 * 弹窗组件
 * 通用的模态框，支持自定义标题、内容、按钮
 */

import { createEl, empty, show, hide } from '../lib/dom.js';

// ============================================================
// 容器
// ============================================================
const container = document.getElementById('modal-container');

// ============================================================
// 当前弹窗实例
// ============================================================
let currentModal = null;

// ============================================================
// 显示弹窗
// ============================================================
export function showModal(options = {}) {
    const {
        title = '提示',
        content = '',
        confirmText = '确认',
        cancelText = '取消',
        showCancel = true,
        onConfirm = null,
        onCancel = null,
        onClose = null,
        danger = false,  // 危险操作按钮样式
        width = '480px'
    } = options;

    // 关闭已有弹窗
    if (currentModal) {
        closeModal();
    }

    // 遮罩
    const overlay = createEl('div', {
        className: 'modal-overlay',
        events: {
            click: (e) => {
                // 点击遮罩关闭
                if (e.target === overlay) {
                    closeModal();
                    if (onClose) onClose();
                }
            }
        }
    });

    // 弹窗主体
    const box = createEl('div', {
        className: 'modal-box',
        style: { maxWidth: width }
    });

    // 标题
    const titleEl = createEl('h3', { className: 'modal-title' }, [title]);

    // 内容
    const bodyEl = createEl('div', { className: 'modal-body' });
    if (typeof content === 'string') {
        bodyEl.innerHTML = content;
    } else if (content instanceof Node) {
        bodyEl.appendChild(content);
    }

    // 按钮区域
    const actions = createEl('div', { className: 'modal-actions' });

    // 取消按钮
    if (showCancel) {
        const cancelBtn = createEl('button', {
            className: 'btn-cancel',
            events: {
                click: () => {
                    closeModal();
                    if (onCancel) onCancel();
                    if (onClose) onClose();
                }
            }
        }, [cancelText]);
        actions.appendChild(cancelBtn);
    }

    // 确认按钮
    const confirmBtnClass = danger ? 'btn-danger' : 'btn-confirm';
    const confirmBtn = createEl('button', {
        className: confirmBtnClass,
        events: {
            click: () => {
                if (onConfirm) {
                    // 如果 onConfirm 返回 false，则不关闭弹窗
                    const result = onConfirm();
                    if (result === false) return;
                }
                closeModal();
                if (onClose) onClose();
            }
        }
    }, [confirmText]);
    actions.appendChild(confirmBtn);

    // 组装
    box.appendChild(titleEl);
    box.appendChild(bodyEl);
    box.appendChild(actions);
    overlay.appendChild(box);

    // 显示
    container.appendChild(overlay);
    currentModal = { overlay, box };

    // 自动聚焦确认按钮
    setTimeout(() => confirmBtn.focus(), 100);

    return { overlay, box, close: closeModal };
}

// ============================================================
// 关闭弹窗
// ============================================================
export function closeModal() {
    if (currentModal) {
        const { overlay } = currentModal;
        if (overlay && overlay.parentNode) {
            overlay.remove();
        }
        currentModal = null;
    }
}

// ============================================================
// 快捷方法
// ============================================================

// 确认对话框
export function confirmDialog(message, title = '确认操作') {
    return new Promise((resolve) => {
        showModal({
            title,
            content: message,
            confirmText: '确认',
            cancelText: '取消',
            danger: true,
            onConfirm: () => resolve(true),
            onCancel: () => resolve(false),
            onClose: () => resolve(false)
        });
    });
}

// 提示对话框
export function alertDialog(message, title = '提示') {
    return new Promise((resolve) => {
        showModal({
            title,
            content: message,
            confirmText: '知道了',
            showCancel: false,
            onConfirm: () => resolve(true),
            onClose: () => resolve(true)
        });
    });
}

// 表单弹窗
export function formDialog(title, formHtml) {
    return new Promise((resolve) => {
        let submitted = false;
        showModal({
            title,
            content: formHtml,
            confirmText: '提交',
            cancelText: '取消',
            onConfirm: () => {
                submitted = true;
                resolve({ confirmed: true });
                return false; // 不自动关闭，由调用方关闭
            },
            onCancel: () => {
                resolve({ confirmed: false });
            },
            onClose: () => {
                if (!submitted) {
                    resolve({ confirmed: false });
                }
            }
        });
    });
}