export default {
	async fetch(request, env, ctx) {
		// console.log(`[${new Date().toISOString()}] 收到请求: ${request.method} ${new URL(request.url).pathname}`);
		
		// 处理静态文件
		if (request.method === 'GET') {
			const url = new URL(request.url);
			// console.log(`[${new Date().toISOString()}] 处理静态文件请求: ${url.pathname}`);
			if (url.pathname === '/') {
				// console.log(`[${new Date().toISOString()}] 返回首页`);
				return env.ASSETS.fetch(request);
			}
			// console.log(`[${new Date().toISOString()}] 返回静态资源: ${url.pathname}`);
			return env.ASSETS.fetch(request);
		}

		// 处理文件转换请求
		if (request.method === 'POST' && new URL(request.url).pathname === '/convert') {
			// console.log(`[${new Date().toISOString()}] 处理文件转换请求`);
			try {
				// console.log(`[${new Date().toISOString()}] 解析表单数据`);
				const formData = await request.formData();
				const file = formData.get('file');
				
				if (!file) {
					// console.log(`[${new Date().toISOString()}] 错误: 未上传文件`);
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
					// console.log(`[${new Date().toISOString()}] 错误: 不支持的文件类型 ${file.type}`);
					return new Response(JSON.stringify({ 
						error: '不支持的文件类型。请上传 PDF、图片、HTML、XML、Office 文档、CSV 或 Numbers 文件。' 
					}), {
						status: 400,
						headers: { 'Content-Type': 'application/json' }
					});
				}

				console.log(`[${new Date().toISOString()}] 收到文件: ${file.name}, 大小: ${file.size} 字节, 类型: ${file.type}`);
				
				// 调用 AI 进行转换
				// console.log(`[${new Date().toISOString()}] 开始调用 AI 进行转换`);
				const results = await env.AI.toMarkdown([
					{
						name: file.name,
						blob: file
					}
				]);
				// console.log(`[${new Date().toISOString()}] AI 转换完成, 结果长度: ${results[0].data.length} 字符`);

				// 返回第一个文档的转换结果
				// console.log(`[${new Date().toISOString()}] 返回转换结果`);
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

		// console.log(`[${new Date().toISOString()}] 未找到匹配的路由, 返回 404`);
		return new Response('Not Found', { status: 404 });
	}
};
