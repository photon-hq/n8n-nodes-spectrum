import type {
	IHookFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { verifySpectrumWebhook } from '../shared/verifySignature';
import {
	buildWebhookOutput,
	CONTENT_TYPE_OPTIONS,
	matchesContentTypeFilter,
	normalizePlatform,
	SPECTRUM_EVENT_OPTIONS,
	type SpectrumWebhookPayload,
} from '../shared/webhookPayload';
import {
	deleteSpectrumWebhook,
	listSpectrumWebhooks,
	registerSpectrumWebhook,
	type WebhookRegistration,
} from '../shared/webhookApi';

const SPACE_TYPE_OPTIONS = [
	{ name: 'Any', value: 'any' },
	{ name: 'DM', value: 'dm', description: 'One-to-one conversations only' },
	{ name: 'Group', value: 'group', description: 'Group chats only' },
];

const PLATFORM_FILTER_OPTIONS = [
	{ name: 'Any', value: '' },
	{ name: 'iMessage', value: 'imessage' },
	{ name: 'Slack', value: 'slack' },
	{ name: 'Voice', value: 'voice' },
	{ name: 'WhatsApp Business', value: 'whatsapp_business' },
];

interface StoredWebhook {
	id: string;
	signingSecret: string;
	webhookUrl: string;
}

async function readRawBody(
	req: ReturnType<IWebhookFunctions['getRequestObject']> & {
		rawBody?: Buffer | string;
		readRawBody?: () => Promise<void>;
	},
): Promise<string> {
	if (!req.rawBody && typeof req.readRawBody === 'function') {
		try {
			await req.readRawBody();
		} catch {
			// ignore
		}
	}
	const rawBody = (req.rawBody ?? '').toString();
	return rawBody || JSON.stringify(req.body ?? {});
}

// eslint-disable-next-line @n8n/community-nodes/node-usable-as-tool
export class PhotonSpectrumTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Spectrum by Photon Trigger',
		name: 'photonSpectrumTrigger',
		icon: 'file:Dark.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{ ($parameter["events"] || []).join(", ") || "messages" }}',
		description: 'Triggers on real-time Spectrum Cloud webhook events',
		defaults: {
			name: 'On Spectrum Event',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
				rawBody: true,
			},
		],
		credentials: [
			{
				name: 'photonSpectrumCloudApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				options: SPECTRUM_EVENT_OPTIONS,
				default: ['messages'],
				required: true,
				description: 'Which Spectrum webhook event types should trigger the workflow',
			},
			{
				displayName: 'Content Types',
				name: 'contentTypes',
				type: 'multiOptions',
				options: CONTENT_TYPE_OPTIONS,
				default: ['*'],
				description: 'Filter message events by content type',
				displayOptions: {
					show: {
						events: ['messages', '*'],
					},
				},
			},
			{
				displayName: 'Signing Secret',
				name: 'signingSecret',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description:
					'Optional override. Leave blank to use the secret returned when the webhook was registered.',
			},
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				options: [
					{
						displayName: 'Ignore Outbound Messages',
						name: 'ignoreOutbound',
						type: 'boolean',
						default: true,
						description: 'Whether to skip messages sent by your project',
					},
					{
						displayName: 'Platform',
						name: 'platform',
						type: 'options',
						options: PLATFORM_FILTER_OPTIONS,
						default: '',
					},
					{
						displayName: 'Sender Address',
						name: 'senderAddress',
						type: 'string',
						default: '',
						placeholder: '+15551234567 or alice@example.com',
						description: 'Only trigger when the sender matches (case-insensitive)',
					},
					{
						displayName: 'Space ID',
						name: 'spaceId',
						type: 'string',
						default: '',
						placeholder: 'any;-;+15551234567',
						description: 'Only trigger for messages in this exact space ID',
					},
					{
						displayName: 'Space Type',
						name: 'spaceType',
						type: 'options',
						options: SPACE_TYPE_OPTIONS,
						default: 'any',
					},
				],
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node') as Record<string, unknown>;
				const stored = staticData.webhook as StoredWebhook | undefined;
				const webhookUrl = this.getNodeWebhookUrl('default');
				if (!webhookUrl) return false;

				const webhooks = await listSpectrumWebhooks(this);
				const existing = webhooks.find((row) => row.webhookUrl === webhookUrl);
				if (!existing) return false;

				return stored?.id === existing.id && !!stored.signingSecret;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				if (!webhookUrl) return false;

				const existing = (await listSpectrumWebhooks(this)).find(
					(row) => row.webhookUrl === webhookUrl,
				);
				if (existing?.id) {
					await deleteSpectrumWebhook(this, existing.id);
				}

				const registration: WebhookRegistration = await registerSpectrumWebhook(
					this,
					webhookUrl,
				);
				const staticData = this.getWorkflowStaticData('node') as Record<string, unknown>;
				staticData.webhook = {
					id: registration.id,
					signingSecret: registration.signingSecret,
					webhookUrl: registration.webhookUrl,
				} satisfies StoredWebhook;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node') as Record<string, unknown>;
				const stored = staticData.webhook as StoredWebhook | undefined;
				if (!stored?.id) return true;

				await deleteSpectrumWebhook(this, stored.id);
				delete staticData.webhook;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject() as ReturnType<IWebhookFunctions['getRequestObject']> & {
			rawBody?: Buffer | string;
			readRawBody?: () => Promise<void>;
		};
		const rawBody = await readRawBody(req);
		const headers = this.getHeaderData() as Record<string, string | undefined>;
		const signature = headers['x-spectrum-signature'];
		const timestamp = headers['x-spectrum-timestamp'];
		const eventHeader = headers['x-spectrum-event'];
		const webhookIdHeader = headers['x-spectrum-webhook-id'];

		const staticData = this.getWorkflowStaticData('node') as Record<string, unknown>;
		const stored = staticData.webhook as StoredWebhook | undefined;
		const signingSecret =
			(this.getNodeParameter('signingSecret', '') as string) || stored?.signingSecret || '';

		if (!signingSecret) {
			return {
				webhookResponse: 'webhook is not registered',
				noWebhookResponse: false,
			};
		}

		const verification = verifySpectrumWebhook({
			rawBody,
			signingSecret,
			signature,
			timestamp,
		});

		if (!verification.ok) {
			return {
				webhookResponse: `signature verification failed: ${verification.reason}`,
				noWebhookResponse: false,
			};
		}

		const payload = req.body as SpectrumWebhookPayload | undefined;
		if (!payload?.event) {
			return { webhookResponse: 'missing event field', noWebhookResponse: false };
		}

		const selectedEvents = this.getNodeParameter('events', []) as string[];
		if (
			selectedEvents.length > 0 &&
			!selectedEvents.includes('*') &&
			!selectedEvents.includes(payload.event)
		) {
			return { webhookResponse: 'ok', noWebhookResponse: false };
		}

		if (payload.event !== 'messages') {
			const output: INodeExecutionData = {
				json: buildWebhookOutput(payload, {
					eventHeader: eventHeader ?? null,
					webhookId: webhookIdHeader ?? null,
				}),
			};
			return { workflowData: [[output]] };
		}

		const message = payload.message ?? {};
		const content = (message.content ?? {}) as IDataObject;
		const rawContentType = String(content.type ?? '');
		const senderAddress = message.sender?.id ?? '';
		const spaceId = message.space?.id ?? payload.space?.id ?? '';
		const platform = normalizePlatform(message.platform ?? payload.space?.platform);

		const contentTypes = this.getNodeParameter('contentTypes', []) as string[];
		if (!matchesContentTypeFilter(contentTypes, rawContentType, content)) {
			return { webhookResponse: 'ok', noWebhookResponse: false };
		}

		const filters = this.getNodeParameter('filters', {}) as {
			platform?: string;
			senderAddress?: string;
			spaceType?: 'any' | 'dm' | 'group';
			spaceId?: string;
			ignoreOutbound?: boolean;
		};

		if (filters.platform && platform && filters.platform !== platform) {
			return { webhookResponse: 'ok', noWebhookResponse: false };
		}

		if (
			filters.senderAddress &&
			filters.senderAddress.toLowerCase() !== senderAddress.toLowerCase()
		) {
			return { webhookResponse: 'ok', noWebhookResponse: false };
		}

		if (filters.spaceId && filters.spaceId !== spaceId) {
			return { webhookResponse: 'ok', noWebhookResponse: false };
		}

		if (filters.spaceType && filters.spaceType !== 'any') {
			const isDm = spaceId.includes(';-;');
			const isGroup = !isDm && spaceId !== '';
			if (filters.spaceType === 'dm' && !isDm) {
				return { webhookResponse: 'ok', noWebhookResponse: false };
			}
			if (filters.spaceType === 'group' && !isGroup) {
				return { webhookResponse: 'ok', noWebhookResponse: false };
			}
		}

		if (filters.ignoreOutbound !== false && message.direction === 'outbound') {
			return { webhookResponse: 'ok', noWebhookResponse: false };
		}

		const output: INodeExecutionData = {
			json: buildWebhookOutput(payload, {
				eventHeader: eventHeader ?? null,
				webhookId: webhookIdHeader ?? null,
			}),
		};

		return { workflowData: [[output]] };
	}
}
