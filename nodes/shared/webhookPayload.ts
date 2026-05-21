import type { IDataObject, INodePropertyOptions } from 'n8n-workflow';

export const CONTENT_TYPE_OPTIONS: INodePropertyOptions[] = [
	{ name: 'All Messages', value: '*', description: 'Every message event on this webhook' },
	{ name: 'Text', value: 'text', description: 'Plain text bodies' },
	{
		name: 'Photo (Image Attachment)',
		value: 'photo',
		description: 'Image attachments (mimeType image/*)',
	},
	{
		name: 'Voice Note / Audio',
		value: 'voice',
		description: 'Audio attachments (mimeType audio/*)',
	},
	{
		name: 'Video',
		value: 'video',
		description: 'Video attachments (mimeType video/*)',
	},
	{
		name: 'Document / File',
		value: 'document',
		description: 'Non-media attachments (mimeType application/*)',
	},
	{
		name: 'Other Attachment',
		value: 'attachment-other',
		description: 'Attachments outside the categories above',
	},
	{ name: 'Reaction (Tapback)', value: 'reaction', description: 'Tapback reactions' },
	{ name: 'Reply (Threaded)', value: 'reply', description: 'Threaded reply wrapping inner content' },
	{ name: 'Edit', value: 'edit', description: 'Rewrite of a previously sent message' },
	{ name: 'Rich Link Preview', value: 'richlink', description: 'Open Graph rich link card' },
	{ name: 'Poll', value: 'poll', description: 'A new poll posted to the conversation' },
	{ name: 'Poll Vote', value: 'poll_option', description: 'A vote on a poll option' },
	{ name: 'Contact Card', value: 'contact', description: 'Shared contact card (vCard)' },
	{ name: 'Group (Album / Bundle)', value: 'group', description: 'Multi-item group bundle' },
	{ name: 'Custom (Platform-Specific)', value: 'custom', description: 'Provider-defined custom payload' },
];

export const SPECTRUM_EVENT_OPTIONS: INodePropertyOptions[] = [
	{ name: 'All Events', value: '*', description: 'Every Spectrum webhook event type' },
	{ name: 'Messages', value: 'messages', description: 'Inbound and outbound message events' },
];

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

function classifyAttachment(mime: string): 'photo' | 'voice' | 'video' | 'document' | 'attachment-other' {
	if (mime.startsWith('image/')) return 'photo';
	if (mime.startsWith('audio/')) return 'voice';
	if (mime.startsWith('video/')) return 'video';
	if (mime.startsWith('application/')) return 'document';
	return 'attachment-other';
}

export function normalizePlatform(platform: string | undefined): string {
	const raw = (platform ?? '').trim().toLowerCase();
	if (!raw) return '';
	if (raw === 'imessage' || raw === 'i message') return 'imessage';
	if (raw.includes('whatsapp')) return 'whatsapp_business';
	if (raw === 'slack') return 'slack';
	if (raw === 'voice') return 'voice';
	return raw.replace(/\s+/g, '_');
}

export function matchesContentTypeFilter(
	selected: string[],
	rawType: string,
	content: IDataObject,
): boolean {
	if (selected.length === 0 || selected.includes('*')) return true;
	const mime = String(content.mimeType ?? '');
	for (const sel of selected) {
		if (sel === rawType) return true;
		if (rawType === 'attachment' && sel === classifyAttachment(mime)) return true;
	}
	return false;
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
	const rawContentType = String(content.type ?? '');
	const mime = String(content.mimeType ?? '');
	const attachmentKind =
		rawContentType === 'attachment' ? classifyAttachment(mime) : undefined;
	const contentType =
		rawContentType === 'attachment' && attachmentKind === 'voice'
			? 'voice'
			: rawContentType;
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
		contentType: contentType || null,
		attachmentKind: attachmentKind ?? null,
		text: contentType === 'text' ? ((content.text as string | undefined) ?? null) : null,
		attachment:
			rawContentType === 'attachment'
				? {
						kind: attachmentKind ?? null,
						name: content.name ?? null,
						mimeType: content.mimeType ?? null,
						size: content.size ?? null,
					}
				: null,
		reaction:
			contentType === 'reaction'
				? {
						emoji: content.emoji ?? null,
						targetId: (content.target as { id?: string } | undefined)?.id ?? null,
					}
				: null,
		reply:
			contentType === 'reply'
				? {
						targetId: (content.target as { id?: string } | undefined)?.id ?? null,
						innerType: (content.content as { type?: string } | undefined)?.type ?? null,
					}
				: null,
		edit:
			contentType === 'edit'
				? {
						targetId: (content.target as { id?: string } | undefined)?.id ?? null,
						innerType: (content.content as { type?: string } | undefined)?.type ?? null,
					}
				: null,
		richlink:
			contentType === 'richlink'
				? {
						url: (content.url as string | undefined) ?? null,
					}
				: null,
		poll:
			contentType === 'poll'
				? {
						title: (content.title as string | undefined) ?? null,
						options: ((content.options as Array<{ title?: string }> | undefined) ?? [])
							.map((option) => option?.title ?? '')
							.filter(Boolean),
					}
				: null,
		pollVote:
			contentType === 'poll_option'
				? {
						selected: (content.selected as boolean | undefined) ?? null,
						title: (content.title as string | undefined) ?? null,
						pollId: (content.poll as { id?: string } | undefined)?.id ?? null,
					}
				: null,
		contact:
			contentType === 'contact'
				? {
						name: content.name ?? null,
						phones: content.phones ?? null,
						emails: content.emails ?? null,
						org: content.org ?? null,
					}
				: null,
		group:
			contentType === 'group'
				? {
						itemCount: Array.isArray(content.items) ? (content.items as unknown[]).length : 0,
					}
				: null,
		custom: contentType === 'custom' ? (content.raw ?? content) : null,
		raw: payload,
	};
}
