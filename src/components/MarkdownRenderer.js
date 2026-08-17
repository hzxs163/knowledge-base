/**
 * Markdown 渲染器
 * 将 Markdown 转为 HTML，支持代码高亮、图片放大、视频嵌入等
 */

import { showModal } from './Modal.js';

// ============================================================
// 配置 marked
// ============================================================
// marked 通过 CDN 加载（在 index.html 中）
// 这里直接使用全局 marked

// ============================================================
// 自定义渲染器
// ============================================================
export function createMarkdownRenderer() {
    const renderer = new marked.Renderer();

    // ---------- 图片：点击放大 ----------
    renderer.image = function(href, title, text) {
        const alt = text || title || '';
        return `
            <img
                src="${escapeHtml(href)}"
                alt="${escapeHtml(alt)}"
                title="${escapeHtml(title || '')}"
                loading="lazy"
                class="markdown-image"
                data-image="${escapeHtml(href)}"
            />
        `;
    };

    // ---------- 链接：外部链接新窗口 ----------
    renderer.link = function(href, title, text) {
        const isExternal = href.startsWith('http://') || href.startsWith('https://');
        const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${escapeHtml(href)}" title="${escapeHtml(title || '')}"${target}>${text}</a>`;
    };

    // ---------- 视频：检测图片链接中的视频文件 ----------
    // 在 renderer.image 中检测，如果是视频则返回 video 标签
    const originalImage = renderer.image;
    renderer.image = function(href, title, text) {
        // 检测视频格式
        const videoExtensions = /\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v|ogv|3gp)$/i;
        if (videoExtensions.test(href)) {
            // 支持 poster 属性通过 title 传递
            const poster = title && title.startsWith('poster:') ? title.replace('poster:', '').trim() : '';
            const posterAttr = poster ? ` poster="${escapeHtml(poster)}"` : '';
            return `
                <video
                    controls
                    playsinline
                    preload="metadata"
                    width="100%"
                    class="markdown-video"
                    ${posterAttr}
                >
                    <source src="${escapeHtml(href)}" type="video/mp4">
                    您的浏览器不支持视频播放
                </video>
            `;
        }
        // 普通图片
        return `
            <img
                src="${escapeHtml(href)}"
                alt="${escapeHtml(text || title || '')}"
                title="${escapeHtml(title || '')}"
                loading="lazy"
                class="markdown-image"
                data-image="${escapeHtml(href)}"
            />
        `;
    };

    // ---------- 代码块：语法高亮（基础） ----------
    renderer.code = function(code, language) {
        const lang = language || '';
        // 简单转义，防止 XSS
        const escapedCode = escapeHtml(code);
        return `
            <pre><code class="language-${escapeHtml(lang)}">${escapedCode}</code></pre>
        `;
    };

    // ---------- 表格：添加响应式包裹 ----------
    const originalTable = renderer.table;
    renderer.table = function(header, body) {
        const tableHtml = originalTable.call(this, header, body);
        return `<div class="table-wrapper">${tableHtml}</div>`;
    };

    return renderer;
}

// ============================================================
// 渲染 Markdown
// ============================================================
export function renderMarkdown(markdown, options = {}) {
    if (!markdown) return '';

    const {
        sanitize = true,
        breaks = true,
        gfm = true,
        headerIds = false,
        mangle = false
    } = options;

    try {
        // 创建自定义渲染器
        const renderer = createMarkdownRenderer();

        // 配置 marked
        marked.setOptions({
            renderer,
            breaks,
            gfm,
            headerIds,
            mangle,
            pedantic: false
        });

        // 渲染 HTML
        let html = marked.parse(markdown);

        // 净化 HTML（防 XSS）
        if (sanitize && typeof DOMPurify !== 'undefined') {
            html = DOMPurify.sanitize(html, {
                ADD_TAGS: ['video', 'source', 'iframe'],
                ADD_ATTR: ['controls', 'playsinline', 'preload', 'poster', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder', 'scrolling']
            });
        }

        return html;
    } catch (err) {
        console.error('[Markdown] 渲染失败:', err);
        return `<p style="color: var(--danger);">⚠️ 内容渲染失败，请检查格式</p>`;
    }
}

// ============================================================
// 绑定 Markdown 事件（图片点击放大等）
// ============================================================
export function bindMarkdownEvents(container) {
    if (!container) return;

    // ---------- 图片点击放大 ----------
    container.querySelectorAll('.markdown-image[data-image]').forEach(img => {
        img.addEventListener('click', function(e) {
            const src = this.dataset.image;
            if (src) {
                showModal({
                    title: '查看图片',
                    content: `<img src="${escapeHtml(src)}" style="max-width:100%;max-height:80vh;border-radius:8px;" />`,
                    confirmText: '关闭',
                    showCancel: false,
                    width: '90%',
                    onConfirm: () => {}
                });
            }
        });
        // 添加鼠标指针样式，提示可点击
        img.style.cursor = 'pointer';
    });

    // ---------- 视频懒加载优化 ----------
    container.querySelectorAll('.markdown-video').forEach(video => {
        // 确保 playsinline 属性
        video.setAttribute('playsinline', 'true');
        // 预加载元数据（获取视频时长等信息，不加载完整视频）
        video.setAttribute('preload', 'metadata');
    });
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