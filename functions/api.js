/**
 * 统一 API 入口
 * 所有 /api/* 请求都在这里处理
 * 从 context 中获取工具函数
 */

// ============================================================
// 主入口
// ============================================================
export async function onRequest(context) {
    const { request, env, user, db, res, pwd, val, auth, slug } = context;
    const url = new URL(request.url);
    const path = url.pathname.replace('/api', '');

    // ---- 路由表 ----
    const routes = {
        'POST /auth/login': handleLogin,
        'POST /auth/logout': handleLogout,
        'GET /auth/me': handleMe,

        'GET /articles': handleGetArticles,
        'POST /articles': handlePostArticle,
        'GET /articles/:slug': handleGetArticle,
        'PUT /articles/:slug': handlePutArticle,
        'DELETE /articles/:slug': handleDeleteArticle,

        'GET /admin/articles': handleAdminGetArticles,
        'GET /admin/users': handleAdminGetUsers,
        'POST /admin/users': handleAdminPostUsers,
        'PUT /admin/users/:id': handleAdminPutUser,
        'DELETE /admin/users/:id': handleAdminDeleteUser,
        'GET /admin/stats': handleAdminStats,

        'GET /search': handleSearch
    };

    // ---- 匹配路由 ----
    const method = request.method;
    const routeKey = `${method} ${path}`;

    // 精确匹配
    if (routes[routeKey]) {
        return routes[routeKey](context);
    }

    // 动态路由匹配
    for (const [key, handler] of Object.entries(routes)) {
        const [m, pattern] = key.split(' ');
        if (m !== method) continue;

        const parts = pattern.split('/');
        const pathParts = path.split('/');
        if (parts.length !== pathParts.length) continue;

        const params = {};
        let match = true;
        for (let i = 0; i < parts.length; i++) {
            if (parts[i].startsWith(':')) {
                params[parts[i].slice(1)] = pathParts[i];
            } else if (parts[i] !== pathParts[i]) {
                match = false;
                break;
            }
        }
        if (match) {
            context.params = params;
            return handler(context);
        }
    }

    return res.notFound('接口不存在');
}


// ============================================================
// 路由处理器
// ============================================================

// ---- 登录 ----
async function handleLogin(ctx) {
    const { request, env, db, res, pwd, auth } = ctx;
    if (request.method !== 'POST') return res.error('Method not allowed', 405);

    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) return res.badRequest('请输入邮箱和密码');

        const result = await db.queryFirst(
            env.DB,
            'SELECT id, email, nickname, role, password_hash, is_active FROM users WHERE email = ?',
            [email.trim().toLowerCase()]
        );

        if (!result.success) return res.error('数据库查询失败', 500);
        const user = result.data;

        if (!user) return res.error('账号或密码错误', 401);
        if (user.is_active === 0) return res.error('账号已被禁用', 403);

        const isValid = await pwd.verify(password, user.password_hash);
        if (!isValid) return res.error('账号或密码错误', 401);

        const token = auth.generateJWT({ id: user.id, email: user.email }, env.JWT_SECRET);
        const userData = { id: user.id, email: user.email, nickname: user.nickname, role: user.role };

        return auth.createAuthResponse({ user: userData }, token);

    } catch (err) {
        console.error('[Login] 失败:', err);
        return res.error('登录失败', 500);
    }
}

// ---- 登出 ----
async function handleLogout(ctx) {
    const { auth } = ctx;
    return auth.clearAuthResponse();
}

// ---- 获取当前用户 ----
async function handleMe(ctx) {
    const { user, res } = ctx;
    if (!user) return res.unauthorized();
    return res.success({ id: user.id, email: user.email, nickname: user.nickname, role: user.role });
}

// ---- 获取文章列表 ----
async function handleGetArticles(ctx) {
    const { request, env, db, res } = ctx;
    try {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page')) || 1;
        const limit = parseInt(url.searchParams.get('limit')) || 20;
        const category = url.searchParams.get('category') || '';
        const offset = (page - 1) * limit;

        let where = 'status = ?';
        let params = ['published'];
        if (category) { where += ' AND category = ?'; params.push(category); }

        const list = await db.query(env.DB,
            `SELECT a.*, u.nickname as author_name FROM articles a LEFT JOIN users u ON a.author_id = u.id WHERE ${where} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        const count = await db.queryFirst(env.DB, `SELECT COUNT(*) as total FROM articles WHERE ${where}`, params);
        const total = count.success ? count.data?.total || 0 : 0;

        const articles = (list.data || []).map(a => {
            if (a.tags) { try { a.tags = JSON.parse(a.tags); } catch { a.tags = []; } }
            return a;
        });

        return res.success(res.paginated(articles, page, limit, total));
    } catch (err) {
        console.error('[GET /articles] 失败:', err);
        return res.error('获取文章列表失败', 500);
    }
}

// ---- 创建文章 ----
async function handlePostArticle(ctx) {
    const { request, env, user, db, res, val, slug } = ctx;
    if (!user) return res.unauthorized();
    if (user.role !== 'admin') return res.forbidden();

    try {
        const body = await request.json();
        const { title, slug: slugInput, summary, content, category, tags = [], cover_image = '', status = 'draft' } = body;

        if (!title?.trim()) return res.badRequest('请输入标题');
        if (!slugInput?.trim()) return res.badRequest('请输入URL标识');
        if (!val.slug(slugInput)) return res.badRequest('Slug只能包含小写字母、数字和连字符');
        if (!category) return res.badRequest('请选择分类');
        if (!content || content.trim().length < 10) return res.badRequest('正文至少10个字符');

        const exist = await db.queryFirst(env.DB, 'SELECT id FROM articles WHERE slug = ?', [slugInput.trim().toLowerCase()]);
        if (exist.success && exist.data) return res.conflict('Slug已被占用');

        const id = crypto.randomUUID();
        const now = Date.now();
        const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);

        await db.execute(env.DB,
            `INSERT INTO articles (id, slug, title, summary, content, category, tags, cover_image, author_id, status, view_count, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, slugInput.trim().toLowerCase(), title.trim(), summary || content.slice(0, 200), content, category,
             tagsJson, cover_image || '', user.id, status || 'draft', 0, now, now]
        );

        return res.success({ id, slug: slugInput.trim().toLowerCase() }, '文章创建成功');
    } catch (err) {
        console.error('[POST /articles] 失败:', err);
        return res.error('创建文章失败', 500);
    }
}

// ---- 获取单篇文章 ----
async function handleGetArticle(ctx) {
    const { request, env, db, res, params } = ctx;
    try {
        const { slug } = params;
        const result = await db.queryFirst(env.DB,
            `SELECT a.*, u.nickname as author_name FROM articles a LEFT JOIN users u ON a.author_id = u.id WHERE a.slug = ? AND a.status = 'published'`,
            [slug]
        );
        if (!result.success || !result.data) return res.notFound('文章不存在');
        const article = result.data;
        if (article.tags) { try { article.tags = JSON.parse(article.tags); } catch { article.tags = []; } }

        // 异步增加浏览量
        await db.execute(env.DB, 'UPDATE articles SET view_count = view_count + 1 WHERE slug = ?', [slug]).catch(() => {});

        return res.success(article);
    } catch (err) {
        console.error('[GET /articles/:slug] 失败:', err);
        return res.error('获取文章失败', 500);
    }
}

// ---- 更新文章 ----
async function handlePutArticle(ctx) {
    const { request, env, user, db, res, val, params } = ctx;
    if (!user) return res.unauthorized();
    if (user.role !== 'admin') return res.forbidden();

    try {
        const { slug } = params;
        const exist = await db.queryFirst(env.DB, 'SELECT id FROM articles WHERE slug = ?', [slug]);
        if (!exist.success || !exist.data) return res.notFound('文章不存在');

        const body = await request.json();
        const { title, newSlug, summary, content, category, tags = [], cover_image = '', status } = body;

        const updates = [];
        const values = [];

        if (title !== undefined) { if (!title.trim()) return res.badRequest('请输入标题'); updates.push('title = ?'); values.push(title.trim()); }
        if (newSlug !== undefined) {
            if (!val.slug(newSlug)) return res.badRequest('Slug只能包含小写字母、数字和连字符');
            if (newSlug !== slug) {
                const exist2 = await db.queryFirst(env.DB, 'SELECT id FROM articles WHERE slug = ? AND slug != ?', [newSlug.trim().toLowerCase(), slug]);
                if (exist2.success && exist2.data) return res.conflict('Slug已被占用');
            }
            updates.push('slug = ?');
            values.push(newSlug.trim().toLowerCase());
        }
        if (summary !== undefined) { updates.push('summary = ?'); values.push(summary || ''); }
        if (content !== undefined) { updates.push('content = ?'); values.push(content); }
        if (category !== undefined) { updates.push('category = ?'); values.push(category); }
        if (tags !== undefined) { updates.push('tags = ?'); values.push(JSON.stringify(Array.isArray(tags) ? tags : [])); }
        if (cover_image !== undefined) { updates.push('cover_image = ?'); values.push(cover_image || ''); }
        if (status !== undefined) { updates.push('status = ?'); values.push(status); }

        if (updates.length === 0) return res.badRequest('没有需要更新的字段');

        updates.push('updated_at = ?');
        values.push(Date.now());
        values.push(slug);

        await db.execute(env.DB, `UPDATE articles SET ${updates.join(', ')} WHERE slug = ?`, values);

        return res.success({ slug: newSlug || slug }, '文章更新成功');
    } catch (err) {
        console.error('[PUT /articles/:slug] 失败:', err);
        return res.error('更新文章失败', 500);
    }
}

// ---- 删除文章 ----
async function handleDeleteArticle(ctx) {
    const { request, env, user, db, res, params } = ctx;
    if (!user) return res.unauthorized();
    if (user.role !== 'admin') return res.forbidden();

    try {
        const { slug } = params;
        const exist = await db.queryFirst(env.DB, 'SELECT id, title FROM articles WHERE slug = ?', [slug]);
        if (!exist.success || !exist.data) return res.notFound('文章不存在');

        await db.execute(env.DB, 'DELETE FROM articles WHERE slug = ?', [slug]);
        return res.success({ slug, title: exist.data.title }, '文章已删除');
    } catch (err) {
        console.error('[DELETE /articles/:slug] 失败:', err);
        return res.error('删除文章失败', 500);
    }
}

// ---- 管理员：获取所有文章 ----
async function handleAdminGetArticles(ctx) {
    const { request, env, user, db, res } = ctx;
    if (!user) return res.unauthorized();
    if (user.role !== 'admin') return res.forbidden();

    try {
        const url = new URL(request.url);
        const status = url.searchParams.get('status') || '';
        const category = url.searchParams.get('category') || '';

        let sql = `SELECT a.*, u.nickname as author_name FROM articles a LEFT JOIN users u ON a.author_id = u.id WHERE 1=1`;
        const params = [];
        if (status) { sql += ' AND a.status = ?'; params.push(status); }
        if (category) { sql += ' AND a.category = ?'; params.push(category); }
        sql += ' ORDER BY a.created_at DESC';

        const result = await db.query(env.DB, sql, params);
        const articles = (result.data || []).map(a => {
            if (a.tags) { try { a.tags = JSON.parse(a.tags); } catch { a.tags = []; } }
            return a;
        });

        return res.success(articles);
    } catch (err) {
        console.error('[GET /admin/articles] 失败:', err);
        return res.error('获取文章列表失败', 500);
    }
}

// ---- 管理员：获取用户列表 ----
async function handleAdminGetUsers(ctx) {
    const { env, user, db, res } = ctx;
    if (!user) return res.unauthorized();
    if (user.role !== 'admin') return res.forbidden();

    try {
        const result = await db.query(env.DB, 'SELECT id, email, nickname, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC');
        return res.success(result.data);
    } catch (err) {
        console.error('[GET /admin/users] 失败:', err);
        return res.error('获取用户列表失败', 500);
    }
}

// ---- 管理员：添加用户 ----
async function handleAdminPostUsers(ctx) {
    const { request, env, user, db, res, pwd, val } = ctx;
    if (!user) return res.unauthorized();
    if (user.role !== 'admin') return res.forbidden();

    try {
        const body = await request.json();
        const { email, nickname, password, role = 'viewer' } = body;

        if (!email?.trim()) return res.badRequest('请输入邮箱');
        if (!val.email(email)) return res.badRequest('邮箱格式不正确');
        if (!nickname?.trim()) return res.badRequest('请输入昵称');
        if (!password) return res.badRequest('请设置密码');
        if (!val.password(password)) return res.badRequest('密码至少6位');

        const exist = await db.queryFirst(env.DB, 'SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
        if (exist.success && exist.data) return res.conflict('该邮箱已被注册');

        const id = crypto.randomUUID();
        const now = Date.now();
        const hash = await pwd.hash(password);

        await db.execute(env.DB,
            `INSERT INTO users (id, email, password_hash, nickname, role, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, email.trim().toLowerCase(), hash, nickname.trim(), role === 'admin' ? 'admin' : 'viewer', 1, now, now]
        );

        return res.success({ id, email, nickname, role }, '用户添加成功');
    } catch (err) {
        console.error('[POST /admin/users] 失败:', err);
        return res.error('添加用户失败', 500);
    }
}

// ---- 管理员：更新用户 ----
async function handleAdminPutUser(ctx) {
    const { request, env, user, db, res, pwd, val, params } = ctx;
    if (!user) return res.unauthorized();
    if (user.role !== 'admin') return res.forbidden();
    if (user.id === params.id) return res.badRequest('不能修改自己的信息');

    try {
        const { id } = params;
        const exist = await db.queryFirst(env.DB, 'SELECT id FROM users WHERE id = ?', [id]);
        if (!exist.success || !exist.data) return res.notFound('用户不存在');

        const body = await request.json();
        const { nickname, password, role, is_active } = body;

        const updates = [];
        const values = [];

        if (nickname !== undefined) { if (!nickname.trim()) return res.badRequest('昵称不能为空'); updates.push('nickname = ?'); values.push(nickname.trim()); }
        if (password !== undefined) {
            if (password && !val.password(password)) return res.badRequest('密码至少6位');
            if (password) { const hash = await pwd.hash(password); updates.push('password_hash = ?'); values.push(hash); }
        }
        if (role !== undefined) {
            if (!val.role(role)) return res.badRequest('角色只能是 admin 或 viewer');
            updates.push('role = ?'); values.push(role);
        }
        if (is_active !== undefined) {
            if (is_active !== 0 && is_active !== 1) return res.badRequest('状态只能是0或1');
            updates.push('is_active = ?'); values.push(is_active);
        }

        if (updates.length === 0) return res.badRequest('没有需要更新的字段');

        updates.push('updated_at = ?');
        values.push(Date.now());
        values.push(id);

        await db.execute(env.DB, `UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
        return res.success({ id }, '用户更新成功');
    } catch (err) {
        console.error('[PUT /admin/users/:id] 失败:', err);
        return res.error('更新用户失败', 500);
    }
}

// ---- 管理员：删除/禁用用户 ----
async function handleAdminDeleteUser(ctx) {
    const { request, env, user, db, res, params } = ctx;
    if (!user) return res.unauthorized();
    if (user.role !== 'admin') return res.forbidden();
    if (user.id === params.id) return res.badRequest('不能删除自己的账号');

    try {
        const { id } = params;
        const exist = await db.queryFirst(env.DB, 'SELECT id, nickname FROM users WHERE id = ?', [id]);
        if (!exist.success || !exist.data) return res.notFound('用户不存在');

        await db.execute(env.DB, 'UPDATE users SET is_active = 0, updated_at = ? WHERE id = ?', [Date.now(), id]);
        return res.success({ id, nickname: exist.data.nickname }, '用户已禁用');
    } catch (err) {
        console.error('[DELETE /admin/users/:id] 失败:', err);
        return res.error('删除用户失败', 500);
    }
}

// ---- 管理员：统计数据 ----
async function handleAdminStats(ctx) {
    const { env, user, db, res } = ctx;
    if (!user) return res.unauthorized();
    if (user.role !== 'admin') return res.forbidden();

    try {
        const totalArticles = await db.queryFirst(env.DB, 'SELECT COUNT(*) as count FROM articles');
        const publishedArticles = await db.queryFirst(env.DB, 'SELECT COUNT(*) as count FROM articles WHERE status = ?', ['published']);
        const draftArticles = await db.queryFirst(env.DB, 'SELECT COUNT(*) as count FROM articles WHERE status = ?', ['draft']);
        const totalUsers = await db.queryFirst(env.DB, 'SELECT COUNT(*) as count FROM users');
        const adminUsers = await db.queryFirst(env.DB, 'SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin']);
        const activeUsers = await db.queryFirst(env.DB, 'SELECT COUNT(*) as count FROM users WHERE is_active = ?', [1]);
        const totalViews = await db.queryFirst(env.DB, 'SELECT SUM(view_count) as total FROM articles');

        const categoryStats = await env.DB.prepare('SELECT category, COUNT(*) as count FROM articles GROUP BY category ORDER BY count DESC').all();

        return res.success({
            articles: {
                total: totalArticles.success ? totalArticles.data?.count || 0 : 0,
                published: publishedArticles.success ? publishedArticles.data?.count || 0 : 0,
                draft: draftArticles.success ? draftArticles.data?.count || 0 : 0
            },
            users: {
                total: totalUsers.success ? totalUsers.data?.count || 0 : 0,
                admin: adminUsers.success ? adminUsers.data?.count || 0 : 0,
                active: activeUsers.success ? activeUsers.data?.count || 0 : 0
            },
            categories: categoryStats.success ? categoryStats.results || [] : [],
            totalViews: totalViews.success ? totalViews.data?.total || 0 : 0
        });
    } catch (err) {
        console.error('[GET /admin/stats] 失败:', err);
        return res.error('获取统计数据失败', 500);
    }
}

// ---- 搜索 ----
async function handleSearch(ctx) {
    const { request, env, db, res } = ctx;

    try {
        const url = new URL(request.url);
        const q = url.searchParams.get('q') || '';

        if (!q || q.trim().length < 2) return res.success({ keyword: q, total: 0, data: [] });

        const keyword = q.trim();
        const pattern = `%${keyword}%`;

        const result = await db.query(env.DB,
            `SELECT a.*, u.nickname as author_name,
                CASE WHEN a.title LIKE ? THEN 10 WHEN a.summary LIKE ? THEN 5 WHEN a.content LIKE ? THEN 3 ELSE 1 END as relevance
             FROM articles a LEFT JOIN users u ON a.author_id = u.id
             WHERE a.status = 'published' AND (a.title LIKE ? OR a.summary LIKE ? OR a.content LIKE ?)
             ORDER BY relevance DESC, a.created_at DESC LIMIT 50`,
            [pattern, pattern, pattern, pattern, pattern, pattern]
        );

        const articles = (result.data || []).map(a => {
            if (a.tags) { try { a.tags = JSON.parse(a.tags); } catch { a.tags = []; } }
            return a;
        });

        return res.success({ keyword, total: articles.length, data: articles });
    } catch (err) {
        console.error('[GET /search] 失败:', err);
        return res.error('搜索失败', 500);
    }
}
