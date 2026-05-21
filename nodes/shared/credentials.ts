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
	'Photon Spectrum Cloud credential is not connected. Open the credential, click Save, follow the sign-in link, approve in your browser, then click Retry.';
const PENDING_APPROVAL_HINT =
	'Sign-in is pending. Open the credential, complete browser approval, then click Retry at the top of the panel.';

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
	const connectionState = (raw.connectionState as string) || '';
	const deviceCode = ((raw.deviceCode as string) || '').trim();
	const apiHost = ((raw.apiHost as string) || 'https://spectrum.photon.codes').replace(/\/+$/, '');

	if (!projectId || !projectSecret) {
		const pending = connectionState === 'pending' || !!deviceCode;
		throw new NodeOperationError(ctx.getNode(), pending ? PENDING_APPROVAL_HINT : NOT_CONNECTED_HINT, {
			level: 'warning',
		});
	}

	return { projectId, projectSecret, apiHost };
}
