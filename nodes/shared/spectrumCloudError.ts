export class SpectrumCloudError extends Error {
	readonly status: number;
	readonly code: string;

	constructor(status: number, code: string, message: string) {
		super(message);
		this.name = 'SpectrumCloudError';
		this.status = status;
		this.code = code;
	}
}

export function parseSpectrumCloudError(status: number, body: string): SpectrumCloudError {
	try {
		const parsed = JSON.parse(body) as { code?: string; message?: string };
		return new SpectrumCloudError(status, parsed.code ?? 'UNKNOWN', parsed.message ?? body);
	} catch {
		return new SpectrumCloudError(status, 'UNKNOWN', body || 'Request failed');
	}
}
