import type { IDataObject, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

import { createSpectrumCloudClient } from './cloudClient';
import { PLATFORMS } from './constants';
import { getPhotonSpectrumCloudApiCredentials } from './credentials';

function labelFromRecord(
	record: IDataObject,
	idKeys: string[],
	labelKeys: string[],
): string {
	const id = idKeys.map((key) => record[key]).find((value) => value != null && value !== '');
	const label =
		labelKeys.map((key) => record[key]).find((value) => typeof value === 'string' && value) ??
		id;
	return id ? `${label} (${id})` : String(label ?? 'Unknown');
}

async function withCloudClient(
	context: ILoadOptionsFunctions,
	run: (cloud: ReturnType<typeof createSpectrumCloudClient>) => Promise<INodePropertyOptions[]>,
): Promise<INodePropertyOptions[]> {
	try {
		const { projectId } = await getPhotonSpectrumCloudApiCredentials(context);
		const cloud = createSpectrumCloudClient(context, projectId);
		return await run(cloud);
	} catch {
		return [];
	}
}

export async function getPlatformOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	return withCloudClient(this, async (cloud) => {
		const platforms = (await cloud.getPlatforms()) as Record<string, { enabled?: boolean }>;
		return PLATFORMS.map(({ name, value }) => ({
			name: platforms[value]?.enabled ? name : `${name} (disabled)`,
			value,
		}));
	});
}

export async function getWhatsappAccountOptions(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	return withCloudClient(this, async (cloud) => {
		const accounts = await cloud.listWhatsappAccounts();
		return accounts.map((account) => ({
			name: labelFromRecord(account, ['id', 'accountId'], ['name', 'displayName']),
			value: String(account.id ?? account.accountId),
		}));
	});
}

export async function getUserOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	return withCloudClient(this, async (cloud) => {
		const users = await cloud.listUsers({});
		return users.map((user) => ({
			name: labelFromRecord(user, ['id'], ['phoneNumber', 'firstName']),
			value: String(user.id),
		}));
	});
}

export async function getWebhookOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	return withCloudClient(this, async (cloud) => {
		const webhooks = await cloud.listWebhooks();
		return webhooks.map((webhook) => ({
			name: labelFromRecord(webhook, ['id'], ['webhookUrl']),
			value: String(webhook.id),
		}));
	});
}

export async function getLineOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	return withCloudClient(this, async (cloud) => {
		const lines = await cloud.listLines('imessage');
		return lines.map((line) => ({
			name: labelFromRecord(line, ['id', 'lineId'], ['phoneNumber', 'platform']),
			value: String(line.id ?? line.lineId),
		}));
	});
}

export async function getSlackTeamOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	return withCloudClient(this, async (cloud) => {
		const installations = await cloud.listSlackInstallations();
		return installations.map((installation) => ({
			name: labelFromRecord(installation, ['teamId'], ['teamName']),
			value: String(installation.teamId),
		}));
	});
}

export async function getWhatsappTemplateOptions(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	return withCloudClient(this, async (cloud) => {
		const accountId = this.getNodeParameter('accountId') as string;
		if (!accountId) {
			return [];
		}
		const templates = await cloud.listWhatsappTemplates(accountId);
		return templates.map((template) => ({
			name: labelFromRecord(template, ['id', 'templateId'], ['name', 'language']),
			value: String(template.id ?? template.templateId),
		}));
	});
}
