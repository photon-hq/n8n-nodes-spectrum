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

import {
	TRIGGER_LINE_HINT,
	TRIGGER_QUICK_START,
	TRIGGER_REPLY_HINT,
	TRIGGER_SENDER_NOTE,
	TRIGGER_WEBHOOK_HINT,
	TRIGGER_WEBHOOK_SCOPE,
} from '../shared/uxNotices';
import { extractSpacePhone } from '../shared/spacePhone';
import {
	buildWebhookOutput,
	isWebhookTextMessage,
	normalizePlatform,
	type SpectrumWebhookPayload,
} from '../shared/webhookPayload';
import { verifySpectrumWebhook } from '../shared/verifySignature';
import {
	deleteSpectrumWebhook,
	listSpectrumWebhooks,
	registerSpectrumWebhook,
	type WebhookRegistration,
} from '../shared/webhookApi';
import { assertPublicWebhookUrl, isLocalWebhookUrl } from '../shared/webhookUrl';

const SPACE_TYPE_OPTIONS = [
	{ name: 'Any', value: 'any' },
	{ name: 'DM', value: 'dm', description: 'One-to-one conversations only' },
	{ name: 'Group', value: 'group', description: 'Group chats only' },
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
		subtitle: 'inbound text',
		description:
			'Starts your workflow when someone sends an iMessage text on Spectrum. Activating registers the webhook automatically.',
		defaults: {
			name: 'On Spectrum Message',
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
				displayName: TRIGGER_QUICK_START,
				name: 'quickStartNotice',
				type: 'notice',
				default: '',
			},
			{
				displayName: TRIGGER_LINE_HINT,
				name: 'lineNotice',
				type: 'notice',
				default: '',
			},
			{
				displayName: TRIGGER_REPLY_HINT,
				name: 'replyNotice',
				type: 'notice',
				default: '',
			},
			{
				displayName: TRIGGER_SENDER_NOTE,
				name: 'senderPhoneNotice',
				type: 'notice',
				default: '',
			},
			{
				displayName: TRIGGER_WEBHOOK_HINT,
				name: 'webhookModeNotice',
				type: 'notice',
				default: '',
			},
			{
				displayName: TRIGGER_WEBHOOK_SCOPE,
				name: 'webhookScopeNotice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Advanced Options',
				name: 'advancedOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Signing Secret',
						name: 'signingSecret',
						type: 'string',
						typeOptions: { password: true },
						default: '',
						description:
							'Leave blank — saved automatically when you activate the workflow. Only change this if support asks you to.',
					},
				],
			},
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				options: [
					{
						displayName: 'Line Phone Number',
						name: 'phoneNumber',
						type: 'string',
						default: '',
						placeholder: '+15551234567',
						description:
							'Only run when this line handled the conversation ($JSON.phone). Leave blank for all lines.',
					},
					{
						displayName: 'Sender Address',
						name: 'senderAddress',
						type: 'string',
						default: '',
						placeholder: '+15551234567',
						description:
							'Only run when this sender ID matches (phone or email as delivered in the webhook)',
					},
					{
						displayName: 'Space ID',
						name: 'spaceId',
						type: 'string',
						default: '',
						placeholder: 'any;-;+15551234567',
						description: 'Advanced — only run in one specific conversation. Leave blank for all.',
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
				if (!webhookUrl || isLocalWebhookUrl(webhookUrl)) return false;

				const webhooks = await listSpectrumWebhooks(this);
				const existing = webhooks.find((row) => row.webhookUrl === webhookUrl);
				if (!existing) return false;

				return stored?.id === existing.id && !!stored.signingSecret;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				if (!webhookUrl) return false;

				assertPublicWebhookUrl(this.getNode(), webhookUrl);

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
		const advanced = this.getNodeParameter('advancedOptions', {}) as { signingSecret?: string };
		const signingSecret =
			(advanced.signingSecret ?? '').trim() || stored?.signingSecret || '';

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

		if (payload.event !== 'messages') {
			return { webhookResponse: 'ok', noWebhookResponse: false };
		}

		const message = payload.message ?? {};
		const content = (message.content ?? {}) as IDataObject;
		const rawContentType = String(content.type ?? '');

		if (!isWebhookTextMessage(rawContentType)) {
			return { webhookResponse: 'ok', noWebhookResponse: false };
		}

		const senderAddress = message.sender?.id ?? '';
		const spaceId = message.space?.id ?? payload.space?.id ?? '';
		const platform = normalizePlatform(message.platform ?? payload.space?.platform);
		if (platform && platform !== 'imessage') {
			return { webhookResponse: 'ok', noWebhookResponse: false };
		}

		const filters = this.getNodeParameter('filters', {}) as {
			senderAddress?: string;
			spaceType?: 'any' | 'dm' | 'group';
			spaceId?: string;
			phoneNumber?: string;
		};

		const spacePhone = extractSpacePhone(payload);

		if (filters.phoneNumber) {
			const filterPhone = filters.phoneNumber.trim();
			if (!spacePhone || filterPhone !== spacePhone) {
				return { webhookResponse: 'ok', noWebhookResponse: false };
			}
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

		const output: INodeExecutionData = {
			json: buildWebhookOutput(payload, {
				eventHeader: eventHeader ?? null,
				webhookId: webhookIdHeader ?? null,
			}),
		};

		return { workflowData: [[output]] };
	}
}
