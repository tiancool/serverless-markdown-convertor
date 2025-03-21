/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { Ai } from '@cloudflare/ai';

export default {
	async fetch(request, env, ctx) {
		// 处理静态文件
		if (request.method === 'GET') {
			const url = new URL(request.url);
			if (url.pathname === '/') {
				return env.ASSETS.fetch(request);
			}
			return env.ASSETS.fetch(request);
		}

		// 处理文件转换请求
		if (request.method === 'POST' && new URL(request.url).pathname === '/convert') {
			try {
				const formData = await request.formData();
				const file = formData.get('file');
				
				if (!file) {
					return new Response(JSON.stringify({ error: '请上传文件' }), {
						status: 400,
						headers: { 'Content-Type': 'application/json' }
					});
				}

				// 读取文件内容
				const fileContent = await file.text();
				
				// 初始化 AI
				const ai = new Ai(env.AI);

				// 调用 AI 进行转换
				const response = await ai.run('@cf/tomarkdown', { text: fileContent });

				return new Response(JSON.stringify({ markdown: response }), {
					headers: { 'Content-Type': 'application/json' }
				});
			} catch (error) {
				return new Response(JSON.stringify({ error: error.message }), {
					status: 500,
					headers: { 'Content-Type': 'application/json' }
				});
			}
		}

		return new Response('Not Found', { status: 404 });
	}
};
