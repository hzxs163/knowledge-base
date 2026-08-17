/**
 * 管理后台 - 写文章 / 编辑文章
 * 仅管理员可访问
 */

import { createArticle, updateArticle, getArticle } from '../../lib/api.js';
import { showToast } from '../../components/Toast.js';
import { navigateTo } from '../../lib/router.js';
import { renderEditorToolbar, bindEditorToolbarEvents } from '../../components/EditorToolbar.js';
import { renderMarkdown } from '../../components/MarkdownRenderer.js';
import { CATEGORIES } from '../../lib/constants.js';
import { isValidSlug } from '../../lib/validator.js';
import { showModal, closeModal } from '../../components/Modal.js';

// ============================================================
// 状态
// ============================================================
let currentSlug = null;        // 编辑模式下的文章 slug
let isEditMode = false;
let autoSaveTimer = null;

// ============================================================
// 渲染编辑页面
// ============================================================
export async function renderEdit(params) {
    const { slug } = params || {};

    // 判断是否为编辑模式
    isEditMode = !!slug;
    currentSlug = slug || null;

    // 分类下拉选项
    const categoryOptions = CATEGORIES
        .filter(c => c.value !== '')
        .map(c => `<option value="${c.value}">${c.key}</option>`)
        .join('');

    // 文章数据（编辑模式加载）
    let articleData = null;
    if (isEditMode) {
        try {
            const result = await getArticle(slug);
            if (result.success) {
                articleData = result.data;
            } else {
                showToast('文章不存在或已被删除', 'error');
                navigateTo('/dashboard', true);
                return '';
            }
        } catch (err) {
            showToast('加载文章失败', 'error');
            navigateTo('/dashboard', true);
            return '';
        }
    }

    // 填充数据
    const title = articleData?.title || '';
    const summary = articleData?.summary || '';
    const content = articleData?.content || '';
    const category = articleData?.category || '';
    const tags = articleData?.tags || [];
    const coverImage = articleData?.cover_image || '';
    const status = articleData?.status || 'draft';

    // 标签字符串（逗号分隔）
    const tagsStr = Array.isArray(tags) ? tags.join(', ') : '';

    // 工具栏
    const toolbarHtml = renderEditorToolbar({
        compact: window.innerWidth < 640,
        showPreview: true
    });

    return `
        <div class="edit-container">
            <div class="edit-header">
                <button class="btn-back" id="editBackBtn" data-link>← 返回</button>
                <h1 class="edit-title">${isEditMode ? '编辑文章' : '写新文章'}</h1>
                <div class="edit-actions">
                    <button class="btn-secondary" id="saveDraftBtn">💾 保存草稿</button>
                    <button class="btn-primary" id="publishBtn">🚀 发布</button>
                </div>
            </div>

            <form id="editForm" class="edit-form">
                <div class="edit-form-row">
                    <div class="edit-form-group">
                        <label>标题 <span style="color:var(--danger);">*</span></label>
                        <input type="text" id="editTitle" value="${escapeHtml(title)}" placeholder="请输入文章标题" required />
                    </div>
                </div>

                <div class="edit-form-row two-col">
                    <div class="edit-form-group">
                        <label>分类 <span style="color:var(--danger);">*</span></label>
                        <select id="editCategory" required>
                            <option value="">请选择分类</option>
                            ${categoryOptions}
                        </select>
                    </div>
                    <div class="edit-form-group">
                        <label>标签（逗号分隔）</label>
                        <input type="text" id="editTags" value="${escapeHtml(tagsStr)}" placeholder="Vue, 性能, 优化" />
                    </div>
                </div>

                <div class="edit-form-row">
                    <div class="edit-form-group">
                        <label>URL 标识 (Slug) <span style="color:var(--danger);">*</span></label>
                        <input type="text" id="editSlug" value="${escapeHtml(articleData?.slug || '')}" placeholder="纯小写字母、数字、连字符，如：ro-membrane-replacement" required />
                        <span style="font-size:12px;color:var(--text-light);">建议用英文，如：ro-membrane-replacement</span>
                    </div>
                </div>

                <div class="edit-form-row">
                    <div class="edit-form-group">
                        <label>摘要（显示在列表页）</label>
                        <textarea id="editSummary" rows="2" placeholder="请输入摘要，留空则自动截取正文前200字">${escapeHtml(summary)}</textarea>
                    </div>
                </div>

                <div class="edit-form-row">
                    <div class="edit-form-group">
                        <label>封面图</label>
                        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                            <input type="text" id="editCoverImage" value="${escapeHtml(coverImage)}" placeholder="图床URL 或 /assets/articles/xxx/cover.jpg" style="flex:1;" />
                            ${coverImage ? `<img src="${escapeHtml(coverImage)}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;border:1px solid var(--border);" />` : ''}
                            <span style="font-size:12px;color:var(--text-light);">支持图床URL或GitHub路径</span>
                        </div>
                    </div>
                </div>

                <div class="edit-form-row">
                    <div class="edit-form-group editor-group">
                        <label>正文 (Markdown) <span style="color:var(--danger);">*</span></label>
                        ${toolbarHtml}
                        <textarea id="editContent" rows="18" placeholder="使用 Markdown 语法编写..." required>${escapeHtml(content)}</textarea>
                    </div>
                </div>

                <div class="edit-form-row">
                    <div class="edit-form-group">
                        <label>状态</label>
                        <div style="display:flex;gap:16px;padding-top:4px;">
                            <label style="font-weight:400;font-size:14px;display:flex;align-items:center;gap:6px;">
                                <input type="radio" name="status" value="draft" ${status === 'draft' ? 'checked' : ''} /> 草稿
                            </label>
                            <label style="font-weight:400;font-size:14px;display:flex;align-items:center;gap:6px;">
                                <input type="radio" name="status" value="published" ${status === 'published' ? 'checked' : ''} /> 发布
                            </label>
                            <label style="font-weight:400;font-size:14px;display:flex;align-items:center;gap:6px;">
                                <input type="radio" name="status" value="archived" ${status === 'archived' ? 'checked' : ''} /> 归档
                            </label>
                        </div>
                    </div>
                </div>

                <div class="edit-form-row" style="margin-top:8px;padding-top:12px;border-top:1px solid var(--border);">
                    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-size:13px;color:var(--text-secondary);">
                        <span id="wordCount">字数: 0</span>
                        <span>|</span>
                        <span id="saveStatus">✅ 已保存</span>
                    </div>
                </div>
            </form>

            <!-- 预览弹窗 -->
            <div id="previewModal" style="display:none;">
                <div class="preview-content">
                    <div id="previewBody"></div>
                </div>
            </div>
        </div>
    `;
}

// ============================================================
// 绑定编辑页面事件
// ============================================================
export function bindEditEvents() {
    const form = document.getElementById('editForm');
    const titleInput = document.getElementById('editTitle');
    const slugInput = document.getElementById('editSlug');
    const contentTextarea = document.getElementById('editContent');
    const summaryTextarea = document.getElementById('editSummary');
    const categorySelect = document.getElementById('editCategory');
    const coverInput = document.getElementById('editCoverImage');
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    const publishBtn = document.getElementById('publishBtn');

    if (!form) return;

    // 初始化编辑器工具栏
    const toolbarContainer = document.querySelector('.editor-group');
    if (toolbarContainer && contentTextarea) {
        bindEditorToolbarEvents(contentTextarea, {
            onInsert: () => {
                updateWordCount();
                autoSave();
            },
            onPreview: showPreview
        });
    }

    // 字数统计
    if (contentTextarea) {
        contentTextarea.addEventListener('input', () => {
            updateWordCount();
            autoSave();
        });
    }

    // 表单输入自动保存
    [titleInput, slugInput, summaryTextarea, categorySelect, coverInput].forEach(el => {
        if (el) {
            el.addEventListener('input', autoSave);
            el.addEventListener('change', autoSave);
        }
    });

    // 保存草稿
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', async () => {
            await saveArticle('draft');
        });
    }

    // 发布
    if (publishBtn) {
        publishBtn.addEventListener('click', async () => {
            await saveArticle('published');
        });
    }

    // 自动保存定时器
    autoSaveTimer = setInterval(() => {
        const statusEl = document.getElementById('saveStatus');
        if (statusEl && statusEl.textContent !== '✅ 已保存') {
            autoSave();
        }
    }, 30000);

    // 页面卸载时清除定时器
    window.addEventListener('beforeunload', () => {
        if (autoSaveTimer) {
            clearInterval(autoSaveTimer);
        }
    });

    // 初始化字数
    updateWordCount();

    // 从标题自动生成 Slug（新建模式）
    if (titleInput && slugInput && !isEditMode) {
        titleInput.addEventListener('input', () => {
            if (!slugInput.dataset.userEdited) {
                const generated = generateSlugFromTitle(titleInput.value);
                slugInput.value = generated;
            }
        });

        slugInput.addEventListener('input', () => {
            slugInput.dataset.userEdited = 'true';
        });
    }

    // 预览按钮（在 EditorToolbar 中已处理）
}

// ============================================================
// 保存文章
// ============================================================
async function saveArticle(status) {
    const title = document.getElementById('editTitle')?.value?.trim();
    const slug = document.getElementById('editSlug')?.value?.trim();
    const category = document.getElementById('editCategory')?.value;
    const tagsStr = document.getElementById('editTags')?.value?.trim();
    const summary = document.getElementById('editSummary')?.value?.trim();
    const content = document.getElementById('editContent')?.value;
    const coverImage = document.getElementById('editCoverImage')?.value?.trim();

    // 校验
    if (!title) {
        showToast('请输入文章标题', 'error');
        document.getElementById('editTitle')?.focus();
        return;
    }

    if (!slug) {
        showToast('请输入 URL 标识 (Slug)', 'error');
        document.getElementById('editSlug')?.focus();
        return;
    }

    if (!isValidSlug(slug)) {
        showToast('Slug 只能包含小写字母、数字和连字符', 'error');
        document.getElementById('editSlug')?.focus();
        return;
    }

    if (!category) {
        showToast('请选择分类', 'error');
        document.getElementById('editCategory')?.focus();
        return;
    }

    if (!content || content.trim().length < 10) {
        showToast('正文至少10个字符', 'error');
        document.getElementById('editContent')?.focus();
        return;
    }

    // 处理标签
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

    // 组装数据
    const data = {
        title,
        slug,
        category,
        tags,
        summary: summary || content.slice(0, 200),
        content,
        cover_image: coverImage || '',
        status
    };

    const statusLabel = status === 'published' ? '发布' : '保存草稿';

    try {
        let result;
        if (isEditMode) {
            result = await updateArticle(currentSlug, data);
        } else {
            result = await createArticle(data);
        }

        if (!result.success) {
            // 如果是 slug 重复，提示用户修改
            if (result.error?.includes('slug')) {
                showToast('Slug 已被占用，请更换', 'error');
                document.getElementById('editSlug')?.focus();
                return;
            }
            showToast(result.error || `${statusLabel}失败`, 'error');
            return;
        }

        showToast(`✅ 文章${statusLabel}成功`, 'success');

        // 如果是新建，跳转到编辑页（防止重复提交）
        if (!isEditMode) {
            navigateTo(`/dashboard/edit/${slug}`, true);
            // 刷新页面重新加载
            setTimeout(() => {
                window.location.reload();
            }, 300);
        } else {
            // 更新保存状态
            const statusEl = document.getElementById('saveStatus');
            if (statusEl) {
                statusEl.textContent = '✅ 已保存';
                statusEl.style.color = 'var(--success)';
            }
        }

    } catch (err) {
        console.error('[Edit] 保存失败:', err);
        showToast('保存失败，请重试', 'error');
    }
}

// ============================================================
// 自动保存
// ============================================================
let autoSaveTimeout = null;

function autoSave() {
    // 清除之前的定时器
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
    }

    // 延迟 3 秒后保存
    autoSaveTimeout = setTimeout(() => {
        const statusEl = document.getElementById('saveStatus');
        if (statusEl) {
            statusEl.textContent = '⏳ 保存中...';
            statusEl.style.color = 'var(--warning)';
        }

        // 实际执行保存（草稿模式）
        saveArticle('draft').then(() => {
            // 保存成功后状态由 saveArticle 更新
        }).catch(() => {
            if (statusEl) {
                statusEl.textContent = '⚠️ 保存失败';
                statusEl.style.color = 'var(--danger)';
            }
        });

        autoSaveTimeout = null;
    }, 3000);
}

// ============================================================
// 更新字数统计
// ============================================================
function updateWordCount() {
    const content = document.getElementById('editContent')?.value || '';
    const words = content.replace(/\s/g, '').length;
    const el = document.getElementById('wordCount');
    if (el) {
        el.textContent = `字数: ${words}`;
    }
}

// ============================================================
// 显示预览
// ============================================================
function showPreview() {
    const content = document.getElementById('editContent')?.value || '';
    const html = renderMarkdown(content);

    showModal({
        title: '文章预览',
        content: `<div class="preview-body" style="max-height:70vh;overflow-y:auto;line-height:1.8;font-size:16px;">${html}</div>`,
        confirmText: '关闭',
        showCancel: false,
        width: '90%',
        onConfirm: () => {
            closeModal();
        }
    });
}

// ============================================================
// 从标题生成 Slug
// ============================================================
function generateSlugFromTitle(title) {
    if (!title) return '';
    // 转小写，替换空格为连字符，只保留字母数字连字符
    return title
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60);
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