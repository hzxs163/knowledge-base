/**
 * 搜索框组件
 * 独立搜索框，可用于页面任意位置
 */

import { navigateTo } from '../lib/router.js';
import { debounce } from '../lib/utils.js';

// ============================================================
// 渲染搜索框
// ============================================================
export function renderSearchBox(options = {}) {
    const {
        placeholder = '搜索文章...',
        value = '',
        autofocus = false,
        size = 'medium', // small | medium | large
        onSearch = null
    } = options;

    const sizeClass = `search-box-${size}`;

    return `
        <div class="search-box ${sizeClass}">
            <span class="search-icon">🔍</span>
            <input
                type="text"
                class="search-input"
                id="searchBoxInput"
                placeholder="${escapeHtml(placeholder)}"
                value="${escapeHtml(value)}"
                ${autofocus ? 'autofocus' : ''}
                autocomplete="off"
            />
            <button class="search-clear" id="searchClearBtn" style="display:${value ? 'flex' : 'none'}">
                ✕
            </button>
        </div>
    `;
}

// ============================================================
// 绑定搜索框事件
// ============================================================
export function bindSearchBoxEvents(options = {}) {
    const {
        onSearch = null,           // 搜索回调 (query) => void
        onInput = null,            // 输入回调 (query) => void
        debounceDelay = 300,
        autoSearch = false,        // 是否输入时自动搜索
        redirectToSearch = true    // 是否跳转到搜索页
    } = options;

    const input = document.getElementById('searchBoxInput');
    const clearBtn = document.getElementById('searchClearBtn');

    if (!input) return;

    // 搜索执行函数
    const performSearch = (query) => {
        const trimmed = query.trim();
        if (!trimmed) {
            if (clearBtn) clearBtn.style.display = 'none';
            if (onSearch) onSearch('');
            return;
        }

        if (clearBtn) clearBtn.style.display = 'flex';

        if (onSearch) {
            onSearch(trimmed);
        }

        if (redirectToSearch) {
            navigateTo(`/search?q=${encodeURIComponent(trimmed)}`, true);
            input.blur();
        }
    };

    // 输入事件（带防抖）
    const handleInput = debounce((e) => {
        const query = e.target.value;
        if (onInput) onInput(query);

        if (autoSearch) {
            performSearch(query);
        } else {
            // 显示/隐藏清除按钮
            if (clearBtn) {
                clearBtn.style.display = query.trim() ? 'flex' : 'none';
            }
        }
    }, debounceDelay);

    input.addEventListener('input', handleInput);

    // 回车搜索
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch(input.value);
        }
    });

    // 清除按钮
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            input.value = '';
            input.focus();
            clearBtn.style.display = 'none';
            if (onInput) onInput('');
            if (autoSearch) {
                if (onSearch) onSearch('');
            }
        });
    }

    // 失焦时如果没有内容，隐藏清除按钮
    input.addEventListener('blur', () => {
        setTimeout(() => {
            if (clearBtn && !input.value.trim()) {
                clearBtn.style.display = 'none';
            }
        }, 200);
    });

    // 聚焦时如果有内容，显示清除按钮
    input.addEventListener('focus', () => {
        if (clearBtn && input.value.trim()) {
            clearBtn.style.display = 'flex';
        }
    });

    return { input, clearBtn };
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