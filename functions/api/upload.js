/**
 * 图片上传 API（图床代理）
 * POST /api/upload - 上传图片到第三方图床
 * 
 * 注意：此功能为可选，如需使用请配置图床 API Key
 * 当前支持：ImgBB
 */

import {
    successResponse,
    errorResponse,
    badRequestResponse,
    unauthorizedResponse
} from '../utils/response.js';

// ============================================================
// POST /api/upload - 上传图片
// ============================================================
export async function onRequestPost(context) {
    const { request, env, user } = context;

    // 检查登录
    if (!user) {
        return unauthorizedResponse('请先登录');
    }

    try {
        // 获取上传的文件
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return badRequestResponse('请选择要上传的文件');
        }

        // 检查文件类型
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            return badRequestResponse('不支持的文件格式，仅支持 JPG, PNG, GIF, WebP, SVG');
        }

        // 检查文件大小（限制 10MB）
        if (file.size > 10 * 1024 * 1024) {
            return badRequestResponse('文件大小超过 10MB 限制');
        }

        // 读取文件内容并转为 Base64
        const buffer = await file.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

        // ============================================================
        // 方式一：上传到 ImgBB（推荐，免费）
        // ============================================================
        const apiKey = env.IMGBB_API_KEY;

        if (apiKey) {
            try {
                const response = await fetch('https://api.imgbb.com/1/upload', {
                    method: 'POST',
                    body: new URLSearchParams({
                        key: apiKey,
                        image: base64,
                        expiration: 0,  // 永久存储
                        name: file.name || 'image'
                    })
                });

                const data = await response.json();

                if (!data.success) {
                    console.error('[Upload] ImgBB 上传失败:', data.error);
                    // 如果图床失败，尝试返回 Base64（仅小图片）
                    if (file.size < 500 * 1024) {
                        return successResponse({
                            url: `data:${file.type};base64,${base64}`,
                            source: 'base64',
                            warning: '图片已转为 Base64 内联，建议使用图床'
                        }, '上传成功（Base64 内联）');
                    }
                    return errorResponse('图床上传失败，请稍后重试', 500);
                }

                return successResponse({
                    url: data.data.url,
                    deleteUrl: data.data.delete_url,
                    source: 'imgbb',
                    filename: data.data.image?.filename || file.name
                }, '上传成功');
            } catch (err) {
                console.error('[Upload] ImgBB 请求失败:', err);
                // 降级：返回 Base64（小图片）
                if (file.size < 500 * 1024) {
                    return successResponse({
                        url: `data:${file.type};base64,${base64}`,
                        source: 'base64',
                        warning: '图床不可用，图片已转为 Base64 内联'
                    }, '上传成功（Base64 内联）');
                }
                return errorResponse('图床服务不可用，请稍后重试', 500);
            }
        }

        // ============================================================
        // 方式二：无 API Key，返回 Base64（仅限小图片）
        // ============================================================
        if (file.size > 500 * 1024) {
            return errorResponse(
                '图片超过 500KB，请配置 IMGBB_API_KEY 环境变量启用图床上传，或使用图床URL粘贴',
                400
            );
        }

        return successResponse({
            url: `data:${file.type};base64,${base64}`,
            source: 'base64',
            warning: '图片已转为 Base64 内联，建议配置图床或使用URL粘贴'
        }, '上传成功（Base64 内联）');

    } catch (err) {
        console.error('[Upload] 上传失败:', err);
        return errorResponse('上传失败，请稍后重试', 500);
    }
}