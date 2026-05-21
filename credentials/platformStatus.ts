import type { IHttpRequestHelper } from 'n8n-workflow';

import type { PlatformStatusMap, SpectrumEnvelope } from './cloudApiTypes';

const HTTP_TIMEOUT_MS = 20_000;

const PLATFORM_LABELS: Record<string, string> = {
	imessage: 'iMessage',
	slack: 'Slack',
	voice: 'Voice',
	whatsapp_business: 'WhatsApp Business',
};

async function spectrumGet<T>(
	helper: IHttpRequestHelper,
	apiHost: string,
	projectId: string,
	projectSecret: string,
	path: string,
): Promise<T> {
	const host = apiHost.replace(/\/+$/, '');
	const auth = 'Basic ' + Buffer.from(`${projectId}:${projectSecret}`).toString('base64');
	const raw = (await helper.helpers.httpRequest({
		method: 'GET',
		url: `${host}/projects/${encodeURIComponent(projectId)}${path}`,
		headers: { Authorization: auth, Accept: 'application/json' },
		json: true,
		timeout: HTTP_TIMEOUT_MS,
	})) as SpectrumEnvelope<T> | T;
	if (raw && typeof raw === 'object' && 'data' in raw) {
		return (raw as SpectrumEnvelope<T>).data;
	}
	return raw as T;
}

export interface PlatformStatusInfo {
	platformSummary: string;
	enabledPlatforms: string;
}

export async function platformStatusFields(
	helper: IHttpRequestHelper,
	apiHost: string,
	projectId: string,
	projectSecret: string,
): Promise<PlatformStatusInfo> {
	const platforms = await spectrumGet<PlatformStatusMap>(
		helper,
		apiHost,
		projectId,
		projectSecret,
		'/platforms/',
	);

	const rows = Object.entries(PLATFORM_LABELS).map(([key, label]) => {
		const enabled = platforms[key as keyof PlatformStatusMap]?.enabled === true;
		return `${label}: ${enabled ? 'enabled' : 'disabled'}`;
	});

	return {
		platformSummary: rows.join('\n'),
		enabledPlatforms: rows.filter((row) => row.endsWith('enabled')).join(', ') || 'None enabled yet',
	};
}
