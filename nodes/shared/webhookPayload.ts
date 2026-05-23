import type { IDataObject } from 'n8n-workflow';

export interface SpectrumWebhookPayload {
	event?: string;
	space?: { id?: string; platform?: string };
	message?: {
		id?: string;
		platform?: string;
		direction?: string;
		timestamp?: string;
		sender?: { id?: string; platform?: string };
		space?: { id?: string; platform?: string };
		content?: IDataObject;
	};
}

export function isWebhookTextMessage(rawType: string): boolean {
	return rawType === 'text';
}

export function normalizePlatform(platform: string | undefined): string {
	const raw = (platform ?? '').trim().toLowerCase();
	if (!raw) return '';
	if (raw === 'imessage' || raw === 'i message') return 'imessage';
	return raw.replace(/\s+/g, '_');
}

export function buildWebhookOutput(
	payload: SpectrumWebhookPayload,
	headers: {
		eventHeader?: string | null;
		webhookId?: string | null;
	},
): IDataObject {
	const message = payload.message ?? {};
	const content = (message.content ?? {}) as IDataObject;
	const spaceId = message.space?.id ?? payload.space?.id ?? '';
	const senderAddress = message.sender?.id ?? '';
	const platform = normalizePlatform(message.platform ?? payload.space?.platform);

	return {
		event: payload.event ?? null,
		webhookId: headers.webhookId ?? null,
		eventHeader: headers.eventHeader ?? null,
		messageId: message.id ?? null,
		platform: platform || null,
		direction: message.direction ?? null,
		spaceId: spaceId || null,
		spaceType: spaceId.includes(';-;') ? 'dm' : spaceId ? 'group' : null,
		sender: senderAddress || null,
		senderPlatform: message.sender?.platform ?? null,
		timestamp: message.timestamp ?? null,
		text: (content.text as string | undefined) ?? null,
	};
}
