import type {
	IAuthenticateGeneric,
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IDataObject,
	IHttpRequestHelper,
	INodeProperties,
} from 'n8n-workflow';

import { DASHBOARD_URL } from '../nodes/shared/uxNotices';
import { photonHttpsJson, spectrumBasicAuth } from '../nodes/shared/photonHttp';

const DEFAULT_RUNTIME = 'https://spectrum.photon.codes';
const CREDENTIAL_TEST_URL = `${DASHBOARD_URL}/api/auth/ok`;

export class PhotonSpectrumCloudApi implements ICredentialType {
	name = 'photonSpectrumCloudApi';
	displayName = 'Photon Spectrum Cloud API';
	icon = {
		light: 'file:../nodes/PhotonSpectrum/spectrum.svg',
		dark: 'file:../nodes/PhotonSpectrum/spectrum.svg',
	} as const;
	documentationUrl = 'https://docs.photon.codes/spectrum-ts/getting-started';

	properties: INodeProperties[] = [
		{
			displayName: 'Project ID',
			name: 'projectId',
			type: 'string',
			default: '',
			placeholder: 'e.g. proj_abc123',
			description: 'Your Spectrum project identifier',
			required: true,
		},
		{
			displayName: 'API Key',
			name: 'projectSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			placeholder: 'Paste your secret key here',
			description:
				'Your Spectrum secret key from the dashboard (Settings). Same value as “Secret Key” in app.photon.codes.',
			required: true,
		},
		{
			displayName: 'Spectrum Runtime URL',
			name: 'apiHost',
			type: 'hidden',
			default: DEFAULT_RUNTIME,
		},
	];

	async preAuthentication(
		this: IHttpRequestHelper,
		credentials: ICredentialDataDecryptedObject,
	): Promise<IDataObject> {
		const projectId = ((credentials.projectId as string) || '').trim();
		const projectSecret = ((credentials.projectSecret as string) || '').trim();
		const apiHost = ((credentials.apiHost as string) || DEFAULT_RUNTIME).replace(/\/+$/, '');

		if (!projectId || !projectSecret) {
			return credentials;
		}

		await photonHttpsJson(`${apiHost}/projects/${encodeURIComponent(projectId)}/platforms/`, {
			method: 'GET',
			headers: {
				Authorization: spectrumBasicAuth(projectId, projectSecret),
				Accept: 'application/json',
			},
		});

		return credentials;
	}

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization:
					'={{ "Basic " + Buffer.from($credentials.projectId.trim() + ":" + $credentials.projectSecret.trim()).toString("base64") }}',
			},
		},
	};

	// Dashboard auth endpoint — same Basic credentials, avoids IPv6/runtime quirks in n8n's test HTTP client.
	test: ICredentialTestRequest = {
		request: {
			url: CREDENTIAL_TEST_URL,
			method: 'GET',
		},
	};
}
