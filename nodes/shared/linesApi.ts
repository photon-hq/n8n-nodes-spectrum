import type { INodePropertyOptions } from 'n8n-workflow';

import { SPECTRUM_CLOUD_URL } from './constants';
import type { PhotonSpectrumCloudApiCredentials } from './credentials';
import { photonHttpsJson, spectrumBasicAuth } from './photonHttp';
import { parseSpectrumCloudError } from './spectrumCloudError';

export interface SpectrumLine {
	id: string;
	phoneNumber: string;
	platform: string;
	createdAt?: string;
}

interface LinesEnvelope {
	lines?: SpectrumLine[];
}

interface SpectrumEnvelope<T> {
	succeed?: boolean;
	data?: T;
}

export async function listProjectLines(
	credentials: PhotonSpectrumCloudApiCredentials,
): Promise<SpectrumLine[]> {
	const baseUrl = (credentials.apiHost || SPECTRUM_CLOUD_URL).replace(/\/+$/, '');
	const auth = spectrumBasicAuth(credentials.projectId, credentials.projectSecret);

	try {
		const response = await photonHttpsJson<SpectrumEnvelope<LinesEnvelope> | LinesEnvelope>(
			`${baseUrl}/projects/${encodeURIComponent(credentials.projectId)}/lines/`,
			{
				method: 'GET',
				headers: {
					Authorization: auth,
					Accept: 'application/json',
				},
			},
		);

		let data: LinesEnvelope | undefined;
		if (typeof response === 'object' && response !== null && 'data' in response) {
			data = (response as SpectrumEnvelope<LinesEnvelope>).data;
		} else {
			data = response as LinesEnvelope;
		}

		const lines = data?.lines ?? [];
		return lines.filter(
			(line): line is SpectrumLine =>
				typeof line?.phoneNumber === 'string' && line.phoneNumber.trim().length > 0,
		);
	} catch (error) {
		const apiError = error as { statusCode?: number; message?: string };
		throw parseSpectrumCloudError(apiError.statusCode ?? 500, apiError.message ?? 'Request failed');
	}
}

export function imessageLines(lines: SpectrumLine[]): SpectrumLine[] {
	return lines.filter((line) => {
		const platform = (line.platform ?? '').toLowerCase();
		return platform.includes('imessage') || platform === 'imessage';
	});
}

export function lineOptions(lines: SpectrumLine[]): INodePropertyOptions[] {
	return lines.map((line) => ({
		name: line.phoneNumber,
		value: line.phoneNumber,
		description: line.platform ? `${line.platform}${line.id ? ` · ${line.id}` : ''}` : undefined,
	}));
}
