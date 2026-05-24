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

/** @deprecated Saved workflows may still have filter params — read at runtime only. */
type TriggerFilters = {
	senderAddress?: string;
	spaceType?: 'any' | 'dm' | 'group';
	spaceId?: string;
	phoneNumber?: string;
};

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
		displayName: 'On Spectrum Message Trigger',
		name: 'photonSpectrumTrigger',
		icon: 'file:spectrum.svg',
		group: ['trigger'],
		version: 1,
		subtitle: 'message',
		description: 'Starts the workflow when an inbound text message is received',
		eventTriggerDescription: 'On Spectrum Message',
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
		properties: [],
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

		const filters = this.getNodeParameter('filters', {}) as TriggerFilters;

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
