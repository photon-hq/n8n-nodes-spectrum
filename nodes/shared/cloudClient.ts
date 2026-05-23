import type {
	IDataObject,
	IHttpRequestMethods,
} from 'n8n-workflow';

import { SPECTRUM_CLOUD_URL } from './constants';
import type { PhotonSpectrumCloudApiCredentials } from './credentials';
import { photonHttpsJson, spectrumBasicAuth } from './photonHttp';
import { parseSpectrumCloudError } from './spectrumCloudError';

type RequestOptions = {
	body?: IDataObject | Record<string, unknown>;
	qs?: IDataObject;
};

interface SpectrumEnvelope<T> {
	succeed?: boolean;
	data?: T;
}

/** Minimal Spectrum Cloud HTTP client — webhooks only (used by the trigger). */
export function createSpectrumCloudClient(
	credentials: PhotonSpectrumCloudApiCredentials,
) {
	const baseUrl = (credentials.apiHost || SPECTRUM_CLOUD_URL).replace(/\/+$/, '');
	const auth = spectrumBasicAuth(credentials.projectId, credentials.projectSecret);
	const projectId = credentials.projectId;

	const request = async <T>(
		method: IHttpRequestMethods,
		path: string,
		options: RequestOptions = {},
	): Promise<T> => {
		try {
			const qs: Record<string, string | number | boolean | undefined> = {};
			if (options.qs) {
				for (const [key, value] of Object.entries(options.qs)) {
					if (value !== undefined && value !== null && value !== '') {
						qs[key] = value as string | number | boolean;
					}
				}
			}

			const response = await photonHttpsJson<SpectrumEnvelope<T> | T>(`${baseUrl}${path}`, {
				method,
				headers: {
					Authorization: auth,
					Accept: 'application/json',
				},
				body: options.body,
				qs: Object.keys(qs).length > 0 ? qs : undefined,
			});

			if (typeof response === 'object' && response !== null && 'data' in response) {
				return (response as SpectrumEnvelope<T>).data as T;
			}

			return response as T;
		} catch (error) {
			const apiError = error as {
				statusCode?: number;
				message?: string;
				body?: unknown;
			};
			const status = apiError.statusCode ?? 500;
			const message = apiError.message ?? 'Request failed';
			throw parseSpectrumCloudError(status, message);
		}
	};

	const projectPath = `/projects/${projectId}`;

	return {
		listWebhooks: () => request<IDataObject[]>('GET', `${projectPath}/webhooks/`),

		registerWebhook: (webhookUrl: string) =>
			request<IDataObject>('POST', `${projectPath}/webhooks/`, {
				body: { webhookUrl },
			}),

		deleteWebhook: (webhookId: string) =>
			request<IDataObject>('DELETE', `${projectPath}/webhooks/${encodeURIComponent(webhookId)}`),
	};
}

export type SpectrumCloudClient = ReturnType<typeof createSpectrumCloudClient>;
