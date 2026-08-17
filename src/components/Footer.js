/**
 * 页脚组件
 */

export function renderFooter() {
    const year = new Date().getFullYear();

    return `
        <footer class="footer">
            © ${year} 公用工程知识库 · 内部使用
        </footer>
    `;
}