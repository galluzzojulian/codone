/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { createClient } from '@supabase/supabase-js';

interface Env {
	SUPABASE_URL: string;
	SUPABASE_ANON_KEY: string;
	CACHE_TTL: string;
}

// Helper function to parse file IDs (adapted from Supabase edge function)
function parseFileIds(fileIdsField: any): number[] {
	if (!fileIdsField) return [];
	try {
		if (Array.isArray(fileIdsField)) {
			return fileIdsField.map(id => typeof id === 'object' && id !== null ? Number(id.id) : Number(id))
				.filter(id => !isNaN(id));
		}
		if (typeof fileIdsField === 'string') {
			try {
				const parsed = JSON.parse(fileIdsField);
				if (Array.isArray(parsed)) {
					return parsed.map(id => typeof id === 'object' && id !== null ? Number(id.id) : Number(id))
						.filter(id => !isNaN(id));
				}
				return [];
			} catch (e) {
				console.error(`Failed to parse file IDs string: ${fileIdsField}`);
				return [];
			}
		}
		return [];
	} catch (err: any) {
		console.error(`Error parsing file IDs: ${err.message}`);
		return [];
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// Handle CORS
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type',
				},
			});
		}

		// Only allow GET requests
		if (request.method !== 'GET') {
			return new Response('Method not allowed', { status: 405 });
		}

		try {
			const url = new URL(request.url);
			const pageId = url.searchParams.get('pageId');
			const location = url.searchParams.get('location'); // 'head' or 'body'

			if (!pageId || !location) {
				return new Response('Missing required parameters', { status: 400 });
			}

			// Create cache key
			const cacheKey = `code-${pageId}-${location}`;
			
			// Try to get from cache first
			const cache = caches.default;
			let response = await cache.match(request);
			
			if (response) {
				return response;
			}

			// Initialize Supabase client
			const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

			// 1. Load page data to get file IDs
			const { data: page, error: pageError } = await supabase
				.from('Pages')
				.select(location === 'head' ? 'head_files' : 'body_files')
				.eq('id', pageId) // Assuming pageId is a number, adjust if it's a string
				.single();

			if (pageError) {
				console.error(`Page query error for page ID ${pageId}: ${pageError.message}`);
				// Differentiate between not found and other errors
				if (pageError.code === 'PGRST116') { // PGRST116: "The result contains 0 rows"
					return new Response(JSON.stringify({ error: `Page not found with ID ${pageId}` }), {
						status: 404,
						headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
					});
				}
				throw pageError; // For other errors, let the generic handler catch it
			}

			if (!page) {
				return new Response(JSON.stringify({ error: `Page not found with ID ${pageId}` }), {
					status: 404,
					headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
				});
			}
			
			console.log(`Page data found for page ID ${pageId}:`, page);

			// const fileIdsField = location === 'head' ? page.head_files : page.body_files;
			// Access the dynamically selected field by casting page to any to satisfy TypeScript
			const fileIdsField = (page as any)[location === 'head' ? 'head_files' : 'body_files'];
			console.log(`Raw ${location} files data for page ID ${pageId}:`, fileIdsField);
			
			const fileIds = parseFileIds(fileIdsField);
			console.log(`Parsed file IDs for page ID ${pageId}:`, fileIds);

			if (!fileIds || fileIds.length === 0) {
				// Return empty code structure if no files are associated
				response = new Response(JSON.stringify({ html: '', css: '', js: '' }), {
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*',
						'Cache-Control': `public, max-age=${env.CACHE_TTL || '3600'}`,
					},
				});
				ctx.waitUntil(cache.put(request, response.clone()));
				return response;
			}

			// 2. Fetch all required files based on IDs
			const { data: files, error: filesError } = await supabase
				.from('Files')
				.select('*') // Select all columns, including 'code' and 'language'
				.in('id', fileIds);

			if (filesError) {
				console.error(`Files query error for IDs ${fileIds.join(', ')}: ${filesError.message}`);
				throw filesError;
			}

			if (!files) {
                // This case should ideally be covered by filesError, but as a fallback
                return new Response(JSON.stringify({ error: 'Files data is unexpectedly null after query.' }), {
					status: 500,
					headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
				});
            }

			console.log(`Found ${files.length} files for IDs ${fileIds.join(', ')}:`, files.map(f => ({ id: f.id, name: f.name, lang: f.language })));

			// Organize files by language
			const html = files.filter(f => f.language === 'html').map(f => f.code).join('\\n'); // Use file.code
			const css = files.filter(f => f.language === 'css').map(f => f.code).join('\\n');  // Use file.code
			const js = files.filter(f => f.language === 'js').map(f => f.code).join('\\n');    // Use file.code
			
			const bundledCode = { html, css, js };

			// Create response with CORS headers
			response = new Response(JSON.stringify(bundledCode), {
				headers: {
					'Content-Type': 'application/json', // Changed to application/json
					'Access-Control-Allow-Origin': '*',
					'Cache-Control': `public, max-age=${env.CACHE_TTL || '3600'}`,
				},
			});

			// Store in cache
			ctx.waitUntil(cache.put(request, response.clone()));

			return response;
		} catch (error) {
			console.error('Error:', error);
			return new Response('Internal Server Error', { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;
