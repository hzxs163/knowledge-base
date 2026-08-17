/**
 * 确认对话框组件
 * 专门用于删除等危险操作的二次确认
 * 基于 Modal 组件封装
 */

import { confirmDialog } from './Modal.js';

// ============================================================
// 删除确认
// ============================================================
export async function confirmDelete(itemName, itemType = '文章') {
    const message = `
        <p>确定要删除 <strong>${escapeHtml(itemName)}</strong> 吗？</p>
        <p style="color: var(--danger); font-size: 14px; margin-top: 8px;">
            ⚠️ 此操作不可恢复，删除后数据将永久丢失。
        </p>
    `;

    return await confirmDialog(message, `删除${itemType}`);
}

// ============================================================
// 状态变更确认（发布/归档/禁用等）
// ============================================================
export async function confirmStatusChange(itemName, action, color = 'var(--warning)') {
    const message = `
        <p>确定要 <strong style="color: ${color};">${action}</strong>  <strong>${escapeHtml(itemName)}</strong> 吗？</p>
    `;

    return await confirmDialog(message, '确认操作');
}

// ============================================================
// 通用确认
// ============================================================
export async function confirmAction(message, title = '确认操作') {
    return await confirmDialog(message, title);
}

// ============================================================
// 工具：防 XSS
// ============================================================
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}