/**
 * 登录页
 */

import { login } from '../lib/auth.js';
import { navigateTo } from '../lib/router.js';
import { showToast } from '../components/Toast.js';

// ============================================================
// 渲染登录页
// ============================================================
export function renderLogin() {
    return `
        <div class="login-page">
            <div class="login-card">
                <div class="login-logo">📚</div>
                <div class="login-subtitle">公用工程知识库</div>

                <div id="loginError" class="error-msg"></div>

                <form id="loginForm" autocomplete="off">
                    <div class="form-group">
                        <label for="email">邮箱</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="请输入邮箱"
                            required
                            autocomplete="username"
                        />
                    </div>
                    <div class="form-group">
                        <label for="password">密码</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="请输入密码"
                            required
                            autocomplete="current-password"
                            minlength="6"
                        />
                    </div>
                    <button type="submit" class="btn-submit" id="loginBtn">登 录</button>
                </form>

                <div class="login-help">
                    还没有账号？请联系管理员添加
                </div>
            </div>
        </div>
    `;
}

// ============================================================
// 绑定登录事件
// ============================================================
export function bindLoginEvents() {
    const form = document.getElementById('loginForm');
    const errorEl = document.getElementById('loginError');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitBtn = document.getElementById('loginBtn');

    if (!form) return;

    // 清除错误
    const clearError = () => {
        errorEl.classList.remove('show');
        errorEl.textContent = '';
    };

    emailInput?.addEventListener('input', clearError);
    passwordInput?.addEventListener('input', clearError);

    // 提交登录
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();

        const email = emailInput?.value?.trim() || '';
        const password = passwordInput?.value || '';

        // 简单校验
        if (!email) {
            showError('请输入邮箱');
            emailInput?.focus();
            return;
        }

        if (!password || password.length < 6) {
            showError('密码至少6位');
            passwordInput?.focus();
            return;
        }

        // 按钮禁用
        submitBtn.disabled = true;
        submitBtn.textContent = '登录中...';

        try {
            const result = await login(email, password);

            if (!result.success) {
                showError(result.error || '登录失败，请检查账号密码');
                submitBtn.disabled = false;
                submitBtn.textContent = '登 录';
                return;
            }

            // 登录成功
            showToast('登录成功', 'success');

            // 根据角色跳转
            const user = result.user;
            if (user && user.role === 'admin') {
                navigateTo('/dashboard', true);
            } else {
                navigateTo('/', true);
            }

        } catch (err) {
            console.error('[Login] 登录异常:', err);
            showError('网络异常，请稍后重试');
            submitBtn.disabled = false;
            submitBtn.textContent = '登 录';
        }
    });

    // 显示错误
    function showError(msg) {
        errorEl.textContent = msg;
        errorEl.classList.add('show');
    }
}