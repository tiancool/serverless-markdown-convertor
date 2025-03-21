export default {
	async fetch(request, env, ctx) {
		console.log(`[${new Date().toISOString()}] 收到请求: ${request.method} ${new URL(request.url).pathname}`);
		
		// 处理静态文件
		if (request.method === 'GET') {
			const url = new URL(request.url);
			console.log(`[${new Date().toISOString()}] 处理静态文件请求: ${url.pathname}`);
			if (url.pathname === '/') {
				console.log(`[${new Date().toISOString()}] 返回首页`);
				return env.ASSETS.fetch(request);
			}
			console.log(`[${new Date().toISOString()}] 返回静态资源: ${url.pathname}`);
			return env.ASSETS.fetch(request);
		}

		// 处理文件转换请求
		if (request.method === 'POST' && new URL(request.url).pathname === '/convert') {
			console.log(`[${new Date().toISOString()}] 处理文件转换请求`);
			try {
				console.log(`[${new Date().toISOString()}] 解析表单数据`);
				const formData = await request.formData();
				const file = formData.get('file');
				
				if (!file) {
					console.log(`[${new Date().toISOString()}] 错误: 未上传文件`);
					return new Response(JSON.stringify({ error: '请上传文件' }), {
						status: 400,
						headers: { 'Content-Type': 'application/json' }
					});
				}

				console.log(`[${new Date().toISOString()}] 收到文件: ${file.name}, 大小: ${file.size} 字节, 类型: ${file.type}`);
				
				// 调用 AI 进行转换
				console.log(`[${new Date().toISOString()}] 开始调用 AI 进行转换`);
				const results = await env.AI.toMarkdown([
					{
						name: file.name,
						blob: file
					}
				]);
				console.log(`[${new Date().toISOString()}] AI 转换完成, 结果长度: ${results[0].data.length} 字符`);

				// 返回第一个文档的转换结果
				console.log(`[${new Date().toISOString()}] 返回转换结果`);
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

		console.log(`[${new Date().toISOString()}] 未找到匹配的路由, 返回 404`);
		return new Response('Not Found', { status: 404 });
	}
};
