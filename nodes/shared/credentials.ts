import type {
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IWebhookFunctions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export interface PhotonSpectrumCloudApiCredentials {
	projectId: string;
	projectSecret: string;
	apiHost: string;
}

const NOT_CONNECTED_HINT =
	'Photon Spectrum Cloud credential is incomplete. Enter your Project ID and API Key from the Spectrum dashboard, then Save.';

type CredentialContext =
	| IExecuteFunctions
	| IHookFunctions
	| ILoadOptionsFunctions
	| IWebhookFunctions;

export async function getPhotonSpectrumCloudApiCredentials(
	ctx: CredentialContext,
): Promise<PhotonSpectrumCloudApiCredentials> {
	const raw = await ctx.getCredentials('photonSpectrumCloudApi');
	const projectId = ((raw.projectId as string) || '').trim();
	const projectSecret = ((raw.projectSecret as string) || '').trim();
	const apiHost = ((raw.apiHost as string) || 'https://spectrum.photon.codes').replace(/\/+$/, '');

	if (!projectId || !projectSecret) {
		throw new NodeOperationError(ctx.getNode(), NOT_CONNECTED_HINT, {
			level: 'warning',
		});
	}

	return { projectId, projectSecret, apiHost };
}
