export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const authCookie = request.headers.get('Cookie')?.match(/auth=([^;]+)/)?.[1];
		
		// 处理静态文件请求
		if (request.method === 'GET') {
			// 如果访问首页且没有cookie，重定向到登录页
			if (url.pathname === '/' && !authCookie) {
				return Response.redirect(new URL('/login', request.url), 302);
			}
			
			// 所有静态资源都可以访问
			return env.ASSETS.fetch(request);
		}

		// 验证密码
		if (request.method === 'POST' && url.pathname === '/auth') {
			const { password } = await request.json();
			const isValid = password === env.PASSWORD;
			
			return new Response(JSON.stringify({ 
				success: isValid 
			}), {
				status: isValid ? 200 : 401,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// 处理登出请求
		if (request.method === 'POST' && url.pathname === '/logout') {
			return new Response(JSON.stringify({ success: true }), {
				headers: {
					'Content-Type': 'application/json',
					'Set-Cookie': 'auth=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'
				}
			});
		}

		// 处理文件转换请求
		if (request.method === 'POST' && url.pathname === '/convert') {
			// 验证登录状态
			if (!authCookie || authCookie !== env.PASSWORD) {
				return new Response(JSON.stringify({ 
					error: '请先登录' 
				}), {
					status: 401,
					headers: { 'Content-Type': 'application/json' }
				});
			}

			try {
				const formData = await request.formData();
				const file = formData.get('file');
				
				if (!file) {
					return new Response(JSON.stringify({ error: '请上传文件' }), {
						status: 400,
						headers: { 'Content-Type': 'application/json' }
					});
				}

				// 验证文件类型
				const supportedMimeTypes = [
					'application/pdf',
					'image/jpeg',
					'image/png',
					'image/webp',
					'image/svg+xml',
					'text/html',
					'application/xml',
					'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
					'application/vnd.ms-excel.sheet.macroenabled.12',
					'application/vnd.ms-excel.sheet.binary.macroenabled.12',
					'application/vnd.ms-excel',
					'application/vnd.oasis.opendocument.spreadsheet',
					'text/csv',
					'application/vnd.apple.numbers'
				];

				if (!supportedMimeTypes.includes(file.type)) {
					return new Response(JSON.stringify({ 
						error: '不支持的文件类型。请上传 PDF、图片、HTML、XML、Office 文档、CSV 或 Numbers 文件。' 
					}), {
						status: 400,
						headers: { 'Content-Type': 'application/json' }
					});
				}

				console.log(`[${new Date().toISOString()}] 收到文件: ${file.name}, 大小: ${file.size} 字节, 类型: ${file.type}`);
				
				// 调用 AI 进行转换
				const results = await env.AI.toMarkdown([
					{
						name: file.name,
						blob: file
					}
				]);

				// 返回第一个文档的转换结果
				return new Response(JSON.stringify({ 
					markdown: results[0].data 
				}), {
					headers: { 'Content-Type': 'application/json' }
				});
			} catch (error) {
				console.error(`[${new Date().toISOString()}] 转换过程中发生错误: ${error.message}`);
				return new Response(JSON.stringify({ error: error.message }), {
					status: 500,
					headers: { 'Content-Type': 'application/json' }
				});
			}
		}

		return new Response('Not Found', { status: 404 });
	}
};
