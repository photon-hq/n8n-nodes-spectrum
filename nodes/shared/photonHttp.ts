const DEFAULT_TIMEOUT_MS = 20_000;

export interface PhotonRequestOptions {
	method?: string;
	headers?: Record<string, string>;
	body?: unknown;
	qs?: Record<string, string | number | boolean | undefined>;
	timeout?: number;
	returnFullResponse?: boolean;
	ignoreHttpStatusErrors?: boolean;
}

function appendQuery(urlString: string, qs?: PhotonRequestOptions['qs']): string {
	if (!qs) return urlString;
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(qs)) {
		if (value !== undefined && value !== '') {
			params.set(key, String(value));
		}
	}
	const query = params.toString();
	if (!query) return urlString;
	return `${urlString}${urlString.includes('?') ? '&' : '?'}${query}`;
}

export async function photonHttpsJson<T>(
	urlString: string,
	options: PhotonRequestOptions = {},
): Promise<T> {
	const url = appendQuery(urlString, options.qs);
	const timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
	const method = (options.method ?? 'GET').toUpperCase();
	const payload =
		options.body !== undefined && method !== 'GET' && method !== 'HEAD'
			? typeof options.body === 'string'
				? options.body
				: JSON.stringify(options.body)
			: undefined;

	const headers: Record<string, string> = {
		accept: 'application/json',
		...options.headers,
	};
	if (payload) {
		headers['content-type'] ??= 'application/json';
	}

	const response = await fetch(url, {
		method,
		headers,
		body: payload,
		signal: AbortSignal.timeout(timeout),
	});

	let parsed: unknown = {};
	const data = await response.text();
	if (data) {
		try {
			parsed = JSON.parse(data);
		} catch {
			// eslint-disable-next-line @n8n/community-nodes/require-node-api-error -- shared HTTP helper without node context
			throw new Error(`Invalid JSON response from ${url}`);
		}
	}

	const status = response.status;
	if (!options.ignoreHttpStatusErrors && (status < 200 || status >= 300)) {
		throw Object.assign(new Error(`${status} - ${JSON.stringify(parsed)}`), {
			statusCode: status,
			body: parsed,
		});
	}

	if (options.returnFullResponse) {
		return {
			statusCode: status,
			body: parsed,
			statusText: response.statusText,
		} as T;
	}

	return parsed as T;
}

export function spectrumBasicAuth(projectId: string, projectSecret: string): string {
	return 'Basic ' + Buffer.from(`${projectId}:${projectSecret}`).toString('base64');
}
