import type { IHookFunctions, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

import { createSpectrumCloudClient } from './cloudClient';
import { getPhotonSpectrumCloudApiCredentials } from './credentials';

export interface WebhookRegistration {
	id: string;
	signingSecret: string;
	webhookUrl: string;
}

export interface WebhookListEntry {
	id: string;
	webhookUrl: string;
	createdAt?: string;
	updatedAt?: string;
}

export async function registerSpectrumWebhook(
	ctx: IHookFunctions,
	webhookUrl: string,
): Promise<WebhookRegistration> {
	const creds = await getPhotonSpectrumCloudApiCredentials(ctx);
	const cloud = createSpectrumCloudClient(creds);
	const data = (await cloud.registerWebhook(webhookUrl)) as unknown as WebhookRegistration;
	if (!data?.id || !data?.signingSecret) {
		throw new NodeApiError(ctx.getNode(), {
			message: 'Spectrum did not return a webhook id and signing secret.',
		});
	}
	return {
		id: String(data.id),
		signingSecret: String(data.signingSecret),
		webhookUrl: String(data.webhookUrl ?? webhookUrl),
	};
}

export async function listSpectrumWebhooks(ctx: IHookFunctions): Promise<WebhookListEntry[]> {
	const creds = await getPhotonSpectrumCloudApiCredentials(ctx);
	const cloud = createSpectrumCloudClient(creds);
	const rows = await cloud.listWebhooks();
	return (rows ?? []).map((row) => ({
		id: String(row.id),
		webhookUrl: String(row.webhookUrl ?? ''),
		createdAt: row.createdAt as string | undefined,
		updatedAt: row.updatedAt as string | undefined,
	}));
}

export async function deleteSpectrumWebhook(ctx: IHookFunctions, webhookId: string): Promise<void> {
	const creds = await getPhotonSpectrumCloudApiCredentials(ctx);
	const cloud = createSpectrumCloudClient(creds);
	try {
		await cloud.deleteWebhook(webhookId);
	} catch (err) {
		const status =
			(err as { httpCode?: string | number; statusCode?: number }).httpCode ??
			(err as { statusCode?: number }).statusCode;
		if (status === 404 || status === '404') return;
		throw new NodeApiError(ctx.getNode(), err as JsonObject);
	}
}
