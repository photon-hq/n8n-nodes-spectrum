import type {
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IDataObject,
	IHttpRequestMethods,
} from 'n8n-workflow';

import { SPECTRUM_CLOUD_URL, type DashboardPlatform } from './constants';
import { parseSpectrumCloudError } from './spectrumCloudError';

type SpectrumContext = IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions;

type RequestOptions = {
	body?: IDataObject | Record<string, unknown>;
	qs?: IDataObject;
};

export function createSpectrumCloudClient(context: SpectrumContext, projectId: string) {
	const request = async <T>(
		method: IHttpRequestMethods,
		path: string,
		options: RequestOptions = {},
	): Promise<T> => {
		try {
			const response = await context.helpers.httpRequestWithAuthentication.call(
				context,
				'photonSpectrumCloudApi',
				{
					method,
					url: `${SPECTRUM_CLOUD_URL}${path}`,
					json: true,
					body: options.body,
					qs: options.qs,
				},
			);

			if (typeof response === 'object' && response !== null && 'data' in response) {
				return (response as { data: T }).data;
			}

			return response as T;
		} catch (error) {
			const apiError = error as {
				statusCode?: number;
				message?: string;
				error?: string;
				description?: string;
			};
			const status = apiError.statusCode ?? 500;
			const message = apiError.message ?? apiError.description ?? apiError.error ?? 'Request failed';
			throw parseSpectrumCloudError(status, message);
		}
	};

	const projectPath = `/projects/${projectId}`;

	return {
		getProject: () => request<IDataObject>('GET', `${projectPath}/`),

		getSubscription: () => request<IDataObject>('GET', `${projectPath}/billing/subscription`),

		getBillingStatus: () => request<IDataObject>('GET', `${projectPath}/billing/status`),

		getPlatforms: () => request<IDataObject>('GET', `${projectPath}/platforms/`),

		togglePlatform: (platform: DashboardPlatform, enabled: boolean) =>
			request<IDataObject>('PATCH', `${projectPath}/platforms/`, {
				body: { platform, enabled },
			}),

		updatePlatformMetadata: (platform: string, body: IDataObject) =>
			request<IDataObject>('PATCH', `${projectPath}/platforms/${platform}`, { body }),

		getImessageInfo: () => request<IDataObject>('GET', `${projectPath}/imessage/`),

		issueImessageTokens: () => request<IDataObject>('POST', `${projectPath}/imessage/tokens`),

		listLines: (platform?: string) =>
			request<IDataObject[]>('GET', `${projectPath}/lines/`, {
				qs: platform ? { platform } : {},
			}),

		addLine: () =>
			request<IDataObject>('POST', `${projectPath}/lines/`, {
				body: { platform: 'imessage' },
			}),

		removeLine: (lineId: string) =>
			request<IDataObject>('DELETE', `${projectPath}/lines/${encodeURIComponent(lineId)}`),

		createUser: (body: IDataObject) =>
			request<IDataObject>('POST', `${projectPath}/users/`, { body }),

		listUsers: (qs: IDataObject) => request<IDataObject[]>('GET', `${projectPath}/users/`, { qs }),

		getUser: (userId: string) =>
			request<IDataObject>('GET', `${projectPath}/users/${encodeURIComponent(userId)}/`),

		deleteUser: (userId: string) =>
			request<IDataObject>('DELETE', `${projectPath}/users/${encodeURIComponent(userId)}/`),

		listWebhooks: () => request<IDataObject[]>('GET', `${projectPath}/webhooks/`),

		registerWebhook: (webhookUrl: string) =>
			request<IDataObject>('POST', `${projectPath}/webhooks/`, {
				body: { webhookUrl },
			}),

		deleteWebhook: (webhookId: string) =>
			request<IDataObject>('DELETE', `${projectPath}/webhooks/${encodeURIComponent(webhookId)}`),

		getSlackConfig: () => request<IDataObject>('GET', `${projectPath}/slack/`),

		upsertSlackConfig: (body: IDataObject) =>
			request<IDataObject>('PUT', `${projectPath}/slack/`, { body }),

		deleteSlackConfig: () => request<IDataObject>('DELETE', `${projectPath}/slack/`),

		listSlackInstallations: () =>
			request<IDataObject[]>('GET', `${projectPath}/slack/installations`),

		upsertSlackInstallation: (teamId: string, body: IDataObject) =>
			request<IDataObject>(
				'PUT',
				`${projectPath}/slack/installations/${encodeURIComponent(teamId)}`,
				{ body },
			),

		deleteSlackInstallation: (teamId: string) =>
			request<IDataObject>(
				'DELETE',
				`${projectPath}/slack/installations/${encodeURIComponent(teamId)}`,
			),

		setupSlack: (body: IDataObject) =>
			request<IDataObject>('POST', `${projectPath}/slack/setup`, { body }),

		issueSlackTokens: () => request<IDataObject>('POST', `${projectPath}/slack/tokens`),

		issueWhatsappBusinessTokens: () =>
			request<IDataObject>('POST', `${projectPath}/whatsapp-business/tokens`),

		listWhatsappAccounts: () =>
			request<IDataObject[]>('GET', `${projectPath}/whatsapp-business/accounts`),

		listWhatsappTemplates: (accountId: string) =>
			request<IDataObject[]>(
				'GET',
				`${projectPath}/whatsapp-business/accounts/${encodeURIComponent(accountId)}/templates/`,
			),

		createWhatsappTemplate: (accountId: string, body: IDataObject) =>
			request<IDataObject>(
				'POST',
				`${projectPath}/whatsapp-business/accounts/${encodeURIComponent(accountId)}/templates/`,
				{ body },
			),

		updateWhatsappTemplate: (accountId: string, templateId: string, body: IDataObject) =>
			request<IDataObject>(
				'PATCH',
				`${projectPath}/whatsapp-business/accounts/${encodeURIComponent(accountId)}/templates/${encodeURIComponent(templateId)}`,
				{ body },
			),

		deleteWhatsappTemplate: (accountId: string, templateId: string) =>
			request<IDataObject>(
				'DELETE',
				`${projectPath}/whatsapp-business/accounts/${encodeURIComponent(accountId)}/templates/${encodeURIComponent(templateId)}`,
			),

		getVoiceSipInbound: () => request<IDataObject>('GET', `${projectPath}/voice/sip-inbound/`),

		updateVoiceSipInbound: (body: IDataObject) =>
			request<IDataObject>('PATCH', `${projectPath}/voice/sip-inbound/`, { body }),

		deleteVoiceSipInbound: () =>
			request<IDataObject>('DELETE', `${projectPath}/voice/sip-inbound/`),

		issueVoiceTokens: () => request<IDataObject>('POST', `${projectPath}/voice/tokens`),
	};
}

export type SpectrumCloudClient = ReturnType<typeof createSpectrumCloudClient>;
