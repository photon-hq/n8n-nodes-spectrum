import type { IDataObject, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

import { createSpectrumCloudClient } from './cloudClient';
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

function credentialErrorOption(error: unknown): INodePropertyOptions[] {
	const message =
		error instanceof Error
			? error.message
			: 'Could not load options — open Credentials and check your Project ID and API Key';
	return [
		{
			name: `⚠ ${message.slice(0, 120)}`,
			value: '',
		},
	];
}

async function withCloudClient(
	context: ILoadOptionsFunctions,
	run: (cloud: ReturnType<typeof createSpectrumCloudClient>) => Promise<INodePropertyOptions[]>,
): Promise<INodePropertyOptions[]> {
	try {
		const { projectId } = await getPhotonSpectrumCloudApiCredentials(context);
		const cloud = createSpectrumCloudClient(context, projectId);
		return await run(cloud);
	} catch (error) {
		return credentialErrorOption(error);
	}
}

export async function getUserOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	return withCloudClient(this, async (cloud) => {
		const users = await cloud.listUsers({});
		if (users.length === 0) {
			return [{ name: 'No Users Yet — Create One in the Dashboard or With Create User', value: '' }];
		}
		return users.map((user) => ({
			name: labelFromRecord(user, ['id'], ['phoneNumber', 'firstName']),
			value: String(user.id),
		}));
	});
}
