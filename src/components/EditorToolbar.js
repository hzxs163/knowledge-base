/**
 * 编辑器工具栏
 * 提供 Markdown 快捷插入按钮
 */

import { generateId } from '../lib/utils.js';

// ============================================================
// 工具栏按钮配置
// ============================================================
const TOOLBAR_BUTTONS = [
    { key: 'bold', label: 'B', title: '加粗', prefix: '**', suffix: '**', placeholder: '加粗文字' },
    { key: 'italic', label: 'I', title: '斜体', prefix: '*', suffix: '*', placeholder: '斜体文字' },
    { key: 'strikethrough', label: 'S', title: '删除线', prefix: '~~', suffix: '~~', placeholder: '删除文字' },
    { key: 'separator' },
    { key: 'heading1', label: 'H1', title: '一级标题', prefix: '# ', suffix: '', placeholder: '标题' },
    { key: 'heading2', label: 'H2', title: '二级标题', prefix: '## ', suffix: '', placeholder: '标题' },
    { key: 'heading3', label: 'H3', title: '三级标题', prefix: '### ', suffix: '', placeholder: '标题' },
    { key: 'separator' },
    { key: 'link', label: '🔗', title: '插入链接', prefix: '[', suffix: '](url)', placeholder: '链接文字' },
    { key: 'image', label: '🖼️', title: '插入图片', prefix: '![', suffix: '](图片url)', placeholder: '图片描述' },
    { key: 'video', label: '🎬', title: '插入视频', prefix: '<video controls width="100%" src="', suffix: '"></video>', placeholder: '' },
    { key: 'separator' },
    { key: 'code', label: '📋', title: '代码块', prefix: '```\n', suffix: '\n```', placeholder: '代码' },
    { key: 'quote', label: '💬', title: '引用', prefix: '> ', suffix: '', placeholder: '引用文字' },
    { key: 'list', label: '📋', title: '无序列表', prefix: '- ', suffix: '', placeholder: '列表项' },
    { key: 'ordered', label: '1.', title: '有序列表', prefix: '1. ', suffix: '', placeholder: '列表项' },
    { key: 'separator' },
    { key: 'table', label: '📊', title: '插入表格', prefix: '| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 数据1 | 数据2 | 数据3 |\n', suffix: '', placeholder: '' },
    { key: 'hr', label: '—', title: '分割线', prefix: '---\n', suffix: '', placeholder: '' }
];

// ============================================================
// 渲染工具栏
// ============================================================
export function renderEditorToolbar(options = {}) {
    const {
        buttons = TOOLBAR_BUTTONS,
        compact = false,  // 移动端紧凑模式
        showPreview = true,
        onPreview = null
    } = options;

    let html = '<div class="editor-toolbar">';

    for (const btn of buttons) {
        if (btn.key === 'separator') {
            html += '<span class="toolbar-separator"></span>';
            continue;
        }

        html += `
            <button
                type="button"
                class="toolbar-btn"
                data-toolbar-btn="${btn.key}"
                title="${escapeHtml(btn.title)}"
                data-prefix="${escapeHtml(btn.prefix || '')}"
                data-suffix="${escapeHtml(btn.suffix || '')}"
                data-placeholder="${escapeHtml(btn.placeholder || '')}"
            >
                ${escapeHtml(btn.label)}
            </button>
        `;
    }

    if (showPreview) {
        html += `
            <span class="toolbar-separator"></span>
            <button
                type="button"
                class="toolbar-btn toolbar-preview-btn"
                id="editorPreviewBtn"
                data-toolbar-btn="preview"
            >
                👁️ 预览
            </button>
        `;
    }

    html += '</div>';
    return html;
}

// ============================================================
// 绑定工具栏事件
// ============================================================
export function bindEditorToolbarEvents(textarea, options = {}) {
    const {
        onInsert = null,        // 插入回调 (text) => void
        onPreview = null,       // 预览回调 () => void
        container = document
    } = options;

    if (!textarea) return;

    // 获取插入位置（光标前后文本）
    const getSelectionInfo = () => {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = textarea.value.substring(0, start);
        const selected = textarea.value.substring(start, end);
        const after = textarea.value.substring(end);
        return { start, end, before, selected, after };
    };

    // 插入文本
    const insertText = (prefix, suffix, placeholder = '') => {
        const { start, end, before, selected, after } = getSelectionInfo();

        // 如果有选中的文本，用选中的文本作为内容
        let content = selected || placeholder || '';
        let newText = before + prefix + content + suffix + after;

        textarea.value = newText;

        // 设置光标位置
        let newCursorPos = start + prefix.length + content.length;
        textarea.selectionStart = newCursorPos;
        textarea.selectionEnd = newCursorPos;

        textarea.focus();
        textarea.dispatchEvent(new Event('input', { bubbles: true }));

        if (onInsert) onInsert(newText);
    };

    // 工具栏按钮点击
    const buttons = container.querySelectorAll('[data-toolbar-btn]');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.toolbarBtn;

            if (key === 'preview') {
                if (onPreview) onPreview();
                return;
            }

            const prefix = btn.dataset.prefix || '';
            const suffix = btn.dataset.suffix || '';
            const placeholder = btn.dataset.placeholder || '';

            insertText(prefix, suffix, placeholder);
        });
    });

    // 键盘快捷键：Ctrl+B 加粗
    textarea.addEventListener('keydown', (e) => {
        if (!e.ctrlKey && !e.metaKey) return;

        const keyMap = {
            'b': 'bold',
            'i': 'italic',
            'k': 'link'
        };

        const toolKey = keyMap[e.key.toLowerCase()];
        if (!toolKey) return;

        e.preventDefault();

        const btn = container.querySelector(`[data-toolbar-btn="${toolKey}"]`);
        if (btn) {
            btn.click();
        }
    });

    return { insertText };
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