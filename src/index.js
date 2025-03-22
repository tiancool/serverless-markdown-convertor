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
			// 如果未设置环境变量密码，则直接返回成功
			if (!env.PASSWORD) {
				return new Response(JSON.stringify({ success: true }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			}
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
		if (request.method === 'POST' && (url.pathname === '/convert' || url.pathname === '/cf')) {
			// 验证登录状态，如果未设置密码则跳过验证
			if (env.PASSWORD && (!authCookie || authCookie !== env.PASSWORD)) {
				return new Response(JSON.stringify({ 
					error: '请先登录' 
				}), {
					status: 401,
					headers: { 'Content-Type': 'application/json' }
				});
			}

			try {
				const formData = await request.formData();
				const files = formData.getAll('files');
				
				if (!files || files.length === 0) {
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

				// 验证所有文件类型
				for (const file of files) {
					if (!supportedMimeTypes.includes(file.type)) {
						return new Response(JSON.stringify({ 
							error: `不支持的文件类型: ${file.name}。请上传 PDF、图片、HTML、XML、Office 文档、CSV 或 Numbers 文件。` 
						}), {
							status: 400,
							headers: { 'Content-Type': 'application/json' }
						});
					}
				}

				console.log(`[${new Date().toISOString()}] 收到 ${files.length} 个文件`);
				files.forEach(file => {
					console.log(`- ${file.name}, 大小: ${file.size} 字节, 类型: ${file.type}`);
				});
				
				// 准备转换的文件列表
				const fileList = files.map(file => ({
					name: file.name,
					blob: file
				}));

				// 如果是 CF API 请求，直接返回原始响应
				if (url.pathname === '/cf') {
					const rawResults = await env.AI.toMarkdown(fileList);
					return new Response(JSON.stringify(rawResults), {
						headers: { 'Content-Type': 'application/json' }
					});
				}

				// 原有的转换逻辑
				const results = await env.AI.toMarkdown(fileList);
				return new Response(JSON.stringify({ 
					markdowns: results.map((result, index) => ({
						name: files[index].name,
						markdown: result.data
					}))
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
