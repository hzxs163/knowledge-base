// ============================================================
// 成功响应
// ============================================================
export function successResponse(data, message = 'success') {
    return new Response(JSON.stringify({
        success: true,
        message,
        data
    }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}

// ============================================================
// 错误响应
// ============================================================
export function errorResponse(error, status = 400, code = null) {
    const body = {
        success: false,
        error: error
    };

    if (code) {
        body.code = code;
    }

    return new Response(JSON.stringify(body), {
        status: status,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}

// ============================================================
// 401 未授权
// ============================================================
export function unauthorizedResponse(message = '请先登录') {
    return errorResponse(message, 401, 'UNAUTHORIZED');
}

// ============================================================
// 403 禁止访问
// ============================================================
export function forbiddenResponse(message = '权限不足') {
    return errorResponse(message, 403, 'FORBIDDEN');
}

// ============================================================
// 404 未找到
// ============================================================
export function notFoundResponse(message = '资源不存在') {
    return errorResponse(message, 404, 'NOT_FOUND');
}

// ============================================================
// 400 参数错误
// ============================================================
export function badRequestResponse(message = '参数错误') {
    return errorResponse(message, 400, 'BAD_REQUEST');
}

// ============================================================
// 409 冲突
// ============================================================
export function conflictResponse(message = '资源已存在') {
    return errorResponse(message, 409, 'CONFLICT');
}

// ============================================================
// 500 服务器错误
// ============================================================
export function serverErrorResponse(message = '服务器内部错误') {
    return errorResponse(message, 500, 'SERVER_ERROR');
}

// ============================================================
// 带 CORS 的响应
// ============================================================
export function corsResponse(response) {
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
    return newResponse;
}

// ============================================================
// 快捷：JSON 响应 + CORS
// ============================================================
export function jsonResponse(data, status = 200) {
    const response = new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return corsResponse(response);
}

// ============================================================
// 分页数据格式
// ============================================================
export function paginatedResponse(data, page, limit, total) {
    return {
        data,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: total,
            totalPages: Math.ceil(total / limit)
        }
    };
}
