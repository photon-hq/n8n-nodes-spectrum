import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

import { CREDENTIAL_QUICK_START } from '../nodes/shared/uxNotices';

const DEFAULT_RUNTIME = 'https://spectrum.photon.codes';

export class PhotonSpectrumCloudApi implements ICredentialType {
	name = 'photonSpectrumCloudApi';
	displayName = 'Photon Spectrum Cloud API';
	icon = {
		light: 'file:../nodes/PhotonSpectrum/Dark.svg',
		dark: 'file:../nodes/PhotonSpectrum/Dark.svg',
	} as const;
	documentationUrl = 'https://docs.photon.codes/spectrum-ts/getting-started';

	properties: INodeProperties[] = [
		{
			displayName: CREDENTIAL_QUICK_START,
			name: 'quickStartNotice',
			type: 'notice',
			default: '',
		},
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
			description: 'Keep this private — it gives access to your Spectrum project',
			required: true,
		},
		{
			displayName: 'Spectrum Runtime URL',
			name: 'apiHost',
			type: 'hidden',
			default: DEFAULT_RUNTIME,
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization:
					'={{ "Basic " + Buffer.from($credentials.projectId + ":" + $credentials.projectSecret).toString("base64") }}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			url: '={{ ($credentials.apiHost || "https://spectrum.photon.codes").replace(/\\/+$/, "") + "/projects/" + encodeURIComponent($credentials.projectId) + "/platforms/" }}',
			method: 'GET',
		},
	};
}
