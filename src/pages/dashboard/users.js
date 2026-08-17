/**
 * 管理后台 - 用户管理
 * 仅管理员可访问
 */

import { getUsers, addUser, updateUser, deleteUser } from '../../lib/api.js';
import { renderLoading } from '../../components/Loading.js';
import { showToast } from '../../components/Toast.js';
import { confirmDelete, confirmAction } from '../../components/ConfirmDialog.js';
import { showModal, closeModal } from '../../components/Modal.js';
import { formatDate } from '../../lib/date.js';

// ============================================================
// 状态
// ============================================================
let allUsers = [];

// ============================================================
// 渲染用户管理
// ============================================================
export function renderUsers() {
    return `
        <div class="dashboard-container">
            <div class="dashboard-header">
                <h1 class="dashboard-title">👤 用户管理</h1>
                <button class="btn-primary" id="addUserBtn">＋ 添加用户</button>
            </div>

            <div class="dashboard-filters">
                <span class="user-count" id="userCount">共 0 位用户</span>
            </div>

            <div id="userListContainer">
                ${renderLoading('加载中...')}
            </div>
        </div>
    `;
}

// ============================================================
// 绑定用户管理事件
// ============================================================
export function bindUsersEvents() {
    // 添加用户按钮
    const addBtn = document.getElementById('addUserBtn');
    if (addBtn) {
        addBtn.addEventListener('click', showAddUserModal);
    }

    // 加载用户列表
    loadUsers();
}

// ============================================================
// 加载用户列表
// ============================================================
async function loadUsers() {
    const container = document.getElementById('userListContainer');
    if (!container) return;

    container.innerHTML = renderLoading('加载中...');

    try {
        const result = await getUsers();

        if (!result.success) {
            showToast(result.error || '加载用户失败', 'error');
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">😵</div>
                    <p class="empty-text">加载失败，请刷新重试</p>
                </div>
            `;
            return;
        }

        allUsers = result.data || [];

        const countEl = document.getElementById('userCount');
        if (countEl) {
            countEl.textContent = `共 ${allUsers.length} 位用户`;
        }

        if (allUsers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👤</div>
                    <p class="empty-text">暂无用户，点击"添加用户"创建</p>
                </div>
            `;
            return;
        }

        container.innerHTML = renderUserList(allUsers);
        bindUserActionEvents();

    } catch (err) {
        console.error('[Users] 加载用户失败:', err);
        showToast('加载用户失败，请刷新重试', 'error');
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">😵</div>
                <p class="empty-text">加载失败，请刷新重试</p>
            </div>
        `;
    }
}

// ============================================================
// 渲染用户列表
// ============================================================
function renderUserList(users) {
    let html = '<div class="admin-user-list">';

    // 表头（桌面端显示）
    html += `
        <div class="user-list-header">
            <span>邮箱</span>
            <span>昵称</span>
            <span>角色</span>
            <span>状态</span>
            <span>操作</span>
        </div>
    `;

    for (const user of users) {
        const isAdmin = user.role === 'admin';
        const isActive = user.is_active === 1;
        const roleLabel = isAdmin ? '👑 管理员' : '👤 普通用户';
        const statusLabel = isActive ? '启用' : '禁用';
        const statusColor = isActive ? 'var(--success)' : 'var(--danger)';

        html += `
            <div class="user-list-item" data-id="${escapeHtml(user.id)}">
                <span class="user-email">${escapeHtml(user.email)}</span>
                <span class="user-nickname">${escapeHtml(user.nickname)}</span>
                <span class="user-role">${roleLabel}</span>
                <span class="user-status" style="color:${statusColor};">${statusLabel}</span>
                <span class="user-actions">
                    <button class="action-btn edit-user-btn" data-action="edit" title="编辑">
                        ✏️
                    </button>
                    <button class="action-btn delete-user-btn" data-action="delete" title="${isActive ? '禁用' : '启用'}">
                        ${isActive ? '🔒' : '🔓'}
                    </button>
                </span>
            </div>
        `;
    }

    html += '</div>';
    return html;
}

// ============================================================
// 绑定用户操作事件
// ============================================================
function bindUserActionEvents() {
    // 编辑用户
    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const item = this.closest('.user-list-item');
            const userId = item?.dataset.id;
            if (userId) {
                const user = allUsers.find(u => u.id === userId);
                if (user) {
                    showEditUserModal(user);
                }
            }
        });
    });

    // 删除/禁用用户
    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', async function() {
            const item = this.closest('.user-list-item');
            const userId = item?.dataset.id;
            if (userId) {
                const user = allUsers.find(u => u.id === userId);
                if (user) {
                    await handleUserToggle(user);
                }
            }
        });
    });
}

// ============================================================
// 显示添加用户弹窗
// ============================================================
function showAddUserModal() {
    const formHtml = `
        <form id="addUserForm" class="modal-form">
            <div class="form-group">
                <label for="addEmail">邮箱 <span style="color:var(--danger);">*</span></label>
                <input type="email" id="addEmail" placeholder="请输入邮箱" required />
            </div>
            <div class="form-group">
                <label for="addNickname">昵称 <span style="color:var(--danger);">*</span></label>
                <input type="text" id="addNickname" placeholder="请输入昵称" required />
            </div>
            <div class="form-group">
                <label for="addPassword">密码 <span style="color:var(--danger);">*</span></label>
                <input type="password" id="addPassword" placeholder="至少6位" required minlength="6" />
            </div>
            <div class="form-group">
                <label for="addRole">角色</label>
                <select id="addRole">
                    <option value="viewer">普通用户</option>
                    <option value="admin">管理员</option>
                </select>
            </div>
            <div style="color:var(--text-secondary);font-size:13px;margin-top:8px;">
                * 新用户默认启用状态
            </div>
        </form>
    `;

    showModal({
        title: '添加用户',
        content: formHtml,
        confirmText: '确认添加',
        cancelText: '取消',
        onConfirm: async () => {
            const email = document.getElementById('addEmail')?.value?.trim();
            const nickname = document.getElementById('addNickname')?.value?.trim();
            const password = document.getElementById('addPassword')?.value;
            const role = document.getElementById('addRole')?.value || 'viewer';

            // 校验
            if (!email) {
                showToast('请输入邮箱', 'error');
                return false;
            }
            if (!nickname) {
                showToast('请输入昵称', 'error');
                return false;
            }
            if (!password || password.length < 6) {
                showToast('密码至少6位', 'error');
                return false;
            }

            try {
                const result = await addUser({ email, nickname, password, role });

                if (!result.success) {
                    showToast(result.error || '添加失败', 'error');
                    return false;
                }

                showToast(`已添加用户：${nickname}`, 'success');
                closeModal();
                loadUsers();
                return true;

            } catch (err) {
                console.error('[Users] 添加失败:', err);
                showToast('添加失败，请重试', 'error');
                return false;
            }
        }
    });
}

// ============================================================
// 显示编辑用户弹窗
// ============================================================
function showEditUserModal(user) {
    const formHtml = `
        <form id="editUserForm" class="modal-form">
            <div class="form-group">
                <label>邮箱</label>
                <input type="email" value="${escapeHtml(user.email)}" disabled style="background:var(--bg);color:var(--text-secondary);" />
                <span style="font-size:12px;color:var(--text-light);">邮箱不可修改</span>
            </div>
            <div class="form-group">
                <label for="editNickname">昵称 <span style="color:var(--danger);">*</span></label>
                <input type="text" id="editNickname" value="${escapeHtml(user.nickname)}" required />
            </div>
            <div class="form-group">
                <label for="editPassword">新密码（留空不修改）</label>
                <input type="password" id="editPassword" placeholder="留空则保持原密码" minlength="6" />
            </div>
            <div class="form-group">
                <label for="editRole">角色</label>
                <select id="editRole">
                    <option value="viewer" ${user.role === 'viewer' ? 'selected' : ''}>普通用户</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>管理员</option>
                </select>
            </div>
        </form>
    `;

    showModal({
        title: '编辑用户',
        content: formHtml,
        confirmText: '保存修改',
        cancelText: '取消',
        onConfirm: async () => {
            const nickname = document.getElementById('editNickname')?.value?.trim();
            const password = document.getElementById('editPassword')?.value;
            const role = document.getElementById('editRole')?.value || 'viewer';

            if (!nickname) {
                showToast('请输入昵称', 'error');
                return false;
            }

            const data = { nickname, role };
            if (password && password.length >= 6) {
                data.password = password;
            }

            try {
                const result = await updateUser(user.id, data);

                if (!result.success) {
                    showToast(result.error || '修改失败', 'error');
                    return false;
                }

                showToast(`已更新用户：${nickname}`, 'success');
                closeModal();
                loadUsers();
                return true;

            } catch (err) {
                console.error('[Users] 修改失败:', err);
                showToast('修改失败，请重试', 'error');
                return false;
            }
        }
    });
}

// ============================================================
// 处理用户启用/禁用切换
// ============================================================
async function handleUserToggle(user) {
    const isActive = user.is_active === 1;
    const action = isActive ? '禁用' : '启用';
    const color = isActive ? 'var(--danger)' : 'var(--success)';

    const confirmed = await confirmAction(
        `<p>确定要 <strong style="color:${color};">${action}</strong> 用户 <strong>${escapeHtml(user.nickname)}</strong> 吗？</p>
         ${isActive ? '<p style="color:var(--danger);font-size:14px;">禁用后该用户将无法登录</p>' : '<p style="color:var(--success);font-size:14px;">启用后该用户可正常登录</p>'}`,
        `${action}用户`
    );

    if (!confirmed) return;

    try {
        const result = await updateUser(user.id, {
            is_active: isActive ? 0 : 1
        });

        if (!result.success) {
            showToast(result.error || `${action}失败`, 'error');
            return;
        }

        showToast(`已${action}用户：${user.nickname}`, 'success');
        loadUsers();

    } catch (err) {
        console.error('[Users] 操作失败:', err);
        showToast('操作失败，请重试', 'error');
    }
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