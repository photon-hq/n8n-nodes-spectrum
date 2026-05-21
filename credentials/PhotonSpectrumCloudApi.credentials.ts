import type {
	IAuthenticateGeneric,
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IDataObject,
	IHttpRequestHelper,
	IHttpRequestOptions,
	INodeProperties,
} from 'n8n-workflow';

import { platformStatusFields } from './platformStatus';
import {
	formatProjectList,
	pickExistingProject,
	projectResolutionError,
} from './projectResolve';
import {
	createDashboardProject,
	provisionCloudProject,
} from './cloudProvision';

function isAuthError(err: unknown): boolean {
	const status =
		(err as { httpCode?: number; statusCode?: number }).httpCode ??
		(err as { statusCode?: number }).statusCode;
	return status === 401 || status === 403;
}

const DEFAULT_CLIENT_ID = 'photon-cli';
const DEFAULT_DASHBOARD = 'https://app.photon.codes';
const DEFAULT_RUNTIME = 'https://spectrum.photon.codes';
const DEFAULT_SCOPE = 'openid profile email';
const PENDING_SIGN_IN_TEST_MESSAGE =
	'Still waiting for browser approval. Open the sign-in link above, confirm the approval code, then click Retry at the top (not Save).';
const BEARER_MANUAL_SENTINEL = 'manual';
const CREDENTIAL_TEST_URL = `${DEFAULT_DASHBOARD}/api/auth/ok`;
const DEVICE_HTTP_TIMEOUT_MS = 60_000;

type ConnectionState = 'setup' | 'pending' | 'connected';

interface DeviceCodeResponse {
	device_code: string;
	user_code: string;
	verification_uri: string;
	verification_uri_complete?: string;
	interval: number;
	expires_in: number;
}

interface DeviceTokenSuccess {
	access_token: string;
	expires_in?: number;
}

interface DeviceTokenError {
	error: string;
	error_description?: string;
}

interface ProjectSummary {
	id: string;
	name?: string;
	spectrum?: boolean;
	spectrumProjectId?: string;
	projectSecret?: string;
}

function trimHost(host: unknown, fallback: string): string {
	const raw = (typeof host === 'string' && host) || fallback;
	return raw.replace(/\/+$/, '');
}

function withConnectionState(data: IDataObject, state: ConnectionState): IDataObject {
	return { ...data, connectionState: state };
}

function wantsManualCredentials(credentials: ICredentialDataDecryptedObject): boolean {
	return credentials.manualFallback === true;
}

function wantsAutoCreateProject(credentials: ICredentialDataDecryptedObject): boolean {
	const v = credentials.createProjectIfNone;
	if (v === false) return false;
	return true;
}

export class PhotonSpectrumCloudApi implements ICredentialType {
	name = 'photonSpectrumCloudApi';
	displayName = 'Photon Spectrum Cloud API';
	icon = {
		light: 'file:../nodes/PhotonSpectrum/Dark.svg',
		dark: 'file:../nodes/PhotonSpectrum/Dark.svg',
	} as const;
	documentationUrl = 'https://docs.photon.codes/spectrum-ts/getting-started';

	properties: INodeProperties[] = [
		{ displayName: 'Connection State', name: 'connectionState', type: 'hidden', default: 'setup' },
		{ displayName: 'Setup Method', name: 'setupMethod', type: 'hidden', default: 'browser' },
		{
			displayName: 'Sign-in link',
			name: 'verificationUrl',
			type: 'string',
			default: '',
			typeOptions: { editable: false },
			displayOptions: {
				show: { connectionState: ['pending'] },
				hide: { manualFallback: [true] },
			},
		},
		{
			displayName: 'Approval code',
			name: 'userCode',
			type: 'string',
			default: '',
			typeOptions: { editable: false },
			displayOptions: {
				show: { connectionState: ['pending'] },
				hide: { manualFallback: [true] },
			},
		},
		{
			displayName: 'Use Project ID & Secret',
			name: 'manualFallback',
			type: 'boolean',
			default: false,
			description: 'Paste credentials from app.photon.codes → Settings.',
			displayOptions: {
				show: { connectionState: ['setup'] },
				hide: { verificationUrl: [{ _cnd: { not: '' } }] },
			},
		},
		{
			displayName: 'Project ID',
			name: 'manualProjectId',
			type: 'string',
			default: '',
			placeholder: 'From app.photon.codes → Settings',
			displayOptions: {
				show: { connectionState: ['setup'], manualFallback: [true] },
			},
		},
		{
			displayName: 'Project Secret',
			name: 'manualProjectSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			placeholder: 'From app.photon.codes → Settings',
			displayOptions: {
				show: { connectionState: ['setup'], manualFallback: [true] },
				hide: { connectionState: ['pending', 'connected'] },
			},
		},
		{ displayName: 'Project ID', name: 'projectId', type: 'hidden', default: '' },
		{
			displayName: 'Project Secret',
			name: 'projectSecret',
			type: 'hidden',
			typeOptions: { password: true },
			default: '',
		},
		{
			displayName: 'Show project options',
			name: 'showProjectOptions',
			type: 'boolean',
			default: false,
			displayOptions: {
				show: { connectionState: ['setup'] },
				hide: {
					manualFallback: [true],
					verificationUrl: [{ _cnd: { not: '' } }],
				},
			},
		},
		{
			displayName: 'Auto-create Photon project',
			name: 'createProjectIfNone',
			type: 'boolean',
			default: true,
			displayOptions: {
				show: {
					connectionState: ['setup'],
					showProjectOptions: [true],
					manualFallback: [false],
				},
			},
		},
		{
			displayName: 'New Project Name',
			name: 'projectName',
			type: 'string',
			default: 'n8n Spectrum',
			placeholder: 'n8n Spectrum',
			displayOptions: {
				show: {
					connectionState: ['setup'],
					showProjectOptions: [true],
					createProjectIfNone: [true],
					manualFallback: [false],
				},
			},
		},
		{
			displayName: 'Platform status',
			name: 'platformSummary',
			type: 'string',
			default: '',
			typeOptions: { editable: false, rows: 4 },
			displayOptions: {
				show: {
					connectionState: ['connected'],
					platformSummary: [{ _cnd: { not: '' } }],
				},
				hide: { verificationUrl: [{ _cnd: { not: '' } }] },
			},
		},
		{
			displayName: 'Your iPhone Number (E.164, optional)',
			name: 'yourPhoneNumber',
			type: 'string',
			default: '',
			placeholder: '+15551234567',
			displayOptions: {
				hide: { manualFallback: [true], verificationUrl: [{ _cnd: { not: '' } }] },
				show: { connectionState: ['setup', 'pending', 'connected'] },
			},
		},
		{
			displayName: 'Your iMessage Line',
			name: 'primaryLineNumber',
			type: 'string',
			default: '',
			typeOptions: { editable: false },
			displayOptions: {
				show: {
					projectId: [{ _cnd: { not: '' } }],
					primaryLineNumber: [{ _cnd: { not: '' } }],
				},
				hide: { verificationUrl: [{ _cnd: { not: '' } }] },
			},
		},
		{
			displayName: 'Show technical details',
			name: 'showTechnicalDetails',
			type: 'boolean',
			default: false,
			displayOptions: {
				show: { projectId: [{ _cnd: { not: '' } }] },
				hide: { verificationUrl: [{ _cnd: { not: '' } }] },
			},
		},
		{
			displayName: 'Project ID',
			name: 'projectRef',
			type: 'string',
			default: '',
			typeOptions: { editable: false },
			displayOptions: {
				show: {
					projectId: [{ _cnd: { not: '' } }],
					showTechnicalDetails: [true],
				},
				hide: { verificationUrl: [{ _cnd: { not: '' } }] },
			},
		},

		{ displayName: 'iMessage mode', name: 'imessageMode', type: 'hidden', default: '' },
		{ displayName: 'Enabled platforms', name: 'enabledPlatforms', type: 'hidden', default: '' },
		{ displayName: 'Spectrum Runtime URL', name: 'apiHost', type: 'hidden', default: DEFAULT_RUNTIME },
		{ displayName: 'Dashboard URL', name: 'dashboardHost', type: 'hidden', default: DEFAULT_DASHBOARD },
		{ displayName: 'OAuth Client ID', name: 'clientId', type: 'hidden', default: DEFAULT_CLIENT_ID },
		{
			displayName: 'Bearer token',
			name: 'bearerToken',
			type: 'hidden',
			typeOptions: { expirable: true, password: true },
			default: '',
		},
		{ displayName: 'Device code', name: 'deviceCode', type: 'hidden', default: '' },
		{ displayName: 'Device code expires at', name: 'deviceCodeExpiresAt', type: 'hidden', default: 0 },
	];

	async preAuthentication(
		this: IHttpRequestHelper,
		credentials: ICredentialDataDecryptedObject,
	): Promise<IDataObject> {
		try {
			return await runPreAuthentication(this, credentials);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			const isPending = message.includes(PENDING_SIGN_IN_TEST_MESSAGE);
			if (isPending) {
				return withConnectionState(
					{
						bearerToken: '',
						projectId: '',
						projectSecret: '',
						setupMethod: 'browser',
						manualFallback: false,
					},
					'pending',
				);
			}
			return withConnectionState(
				{
					bearerToken: '',
					deviceCode: '',
					deviceCodeExpiresAt: 0,
					verificationUrl: '',
					userCode: '',
					projectId: '',
					projectSecret: '',
					platformSummary: `Sign-in error: ${message}`,
					setupMethod: 'browser',
					manualFallback: false,
				},
				'setup',
			);
		}
	}

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization:
					'={{ $credentials.projectSecret ? "Basic " + Buffer.from($credentials.projectId + ":" + $credentials.projectSecret).toString("base64") : "" }}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			url: CREDENTIAL_TEST_URL,
			method: 'GET',
		},
	};
}

async function enrichConnectedFields(
	helper: IHttpRequestHelper,
	credentials: ICredentialDataDecryptedObject,
	base: IDataObject,
	projectId: string,
	projectSecret: string,
): Promise<IDataObject> {
	const apiHost = trimHost(credentials.apiHost, DEFAULT_RUNTIME);
	const yourPhone = ((credentials.yourPhoneNumber as string) || '').trim();

	try {
		const provision = await provisionCloudProject(helper, {
			apiHost,
			projectId,
			projectSecret,
			contactPhone: yourPhone || undefined,
		});
		base.imessageMode = provision.imessageMode;
		if (provision.assignedPhone) {
			base.primaryLineNumber = provision.assignedPhone;
		}
	} catch (err) {
		if (isAuthError(err)) {
			throw new Error(
				'Invalid Project ID or Project Secret. Reconnect with valid credentials and retry.',
			);
		}
	}

	try {
		const status = await platformStatusFields(helper, apiHost, projectId, projectSecret);
		base.platformSummary = status.platformSummary;
		base.enabledPlatforms = status.enabledPlatforms;
	} catch (err) {
		if (isAuthError(err)) {
			throw new Error(
				'Invalid Project ID or Project Secret. Reconnect with valid credentials and retry.',
			);
		}
	}

	return base;
}

async function runPreAuthentication(
	helper: IHttpRequestHelper,
	credentials: ICredentialDataDecryptedObject,
): Promise<IDataObject> {
	const dashboardHost = trimHost(credentials.dashboardHost, DEFAULT_DASHBOARD);
	const clientId = (credentials.clientId as string) || DEFAULT_CLIENT_ID;
	const manual = wantsManualCredentials(credentials);

	const manualProjectId = ((credentials.manualProjectId as string) || '').trim();
	const manualProjectSecret = ((credentials.manualProjectSecret as string) || '').trim();
	const storedProjectId = ((credentials.projectId as string) || '').trim();
	const storedProjectSecret = ((credentials.projectSecret as string) || '').trim();
	const projectIdInput = manual && manualProjectId ? manualProjectId : storedProjectId;
	const projectSecretInput =
		manual && manualProjectSecret ? manualProjectSecret : storedProjectSecret;
	const bearer = ((credentials.bearerToken as string) || '').trim();

	const looksLikeSpectrumSecret =
		projectSecretInput.length >= 24 && /^[A-Za-z0-9_-]+$/.test(projectSecretInput);
	const hasConnectedSecret =
		!!projectIdInput && !!projectSecretInput && looksLikeSpectrumSecret;

	if (hasConnectedSecret) {
		const base: IDataObject = {
			projectId: projectIdInput,
			projectSecret: projectSecretInput,
			bearerToken: bearer || BEARER_MANUAL_SENTINEL,
			projectRef: projectIdInput,
			setupMethod: manual ? 'manual' : 'browser',
			manualFallback: manual,
			deviceCode: '',
			deviceCodeExpiresAt: 0,
			verificationUrl: '',
			userCode: '',
		};
		await enrichConnectedFields(helper, credentials, base, projectIdInput, projectSecretInput);
		return withConnectionState(base, 'connected');
	}

	const deviceCode = ((credentials.deviceCode as string) || '').trim();
	const expiresAt = Number(credentials.deviceCodeExpiresAt ?? 0);
	if (deviceCode && expiresAt > Date.now()) {
		const polled = await pollDeviceToken(helper, dashboardHost, clientId, deviceCode);
		if (polled.ok) {
			const newBearer = polled.access_token;
			const { projectId, projectSecret } = await mintFromBearer(helper, {
				bearer: newBearer,
				dashboardHost,
				projectIdInput,
				projectName: (credentials.projectName as string) || undefined,
				createProjectIfNone: wantsAutoCreateProject(credentials),
			});
			const base: IDataObject = {
				bearerToken: newBearer,
				projectId,
				projectSecret,
				createProjectIfNone: wantsAutoCreateProject(credentials),
				deviceCode: '',
				deviceCodeExpiresAt: 0,
				verificationUrl: '',
				userCode: '',
				setupMethod: 'browser',
				manualFallback: false,
			};
			await enrichConnectedFields(helper, credentials, base, projectId, projectSecret);
			return connectedState(base);
		}
		if (polled.error === 'authorization_pending' || polled.error === 'slow_down') {
			throw new Error(PENDING_SIGN_IN_TEST_MESSAGE);
		}
	}

	if (manual) {
		if (manualProjectId && manualProjectSecret && looksLikeSpectrumSecret) {
			const base: IDataObject = {
				setupMethod: 'manual',
				manualFallback: true,
				projectId: manualProjectId,
				projectSecret: manualProjectSecret,
				bearerToken: BEARER_MANUAL_SENTINEL,
				deviceCode: '',
				deviceCodeExpiresAt: 0,
				verificationUrl: '',
				userCode: '',
			};
			await enrichConnectedFields(helper, credentials, base, manualProjectId, manualProjectSecret);
			return withConnectionState(base, 'connected');
		}
		return withConnectionState(
			{
				setupMethod: 'manual',
				manualFallback: true,
				bearerToken: '',
				deviceCode: '',
				deviceCodeExpiresAt: 0,
				verificationUrl: '',
				userCode: '',
			},
			'setup',
		);
	}

	if (!manual && !hasConnectedSecret) {
		return startPendingDeviceFlow(helper, dashboardHost, clientId);
	}

	return startPendingDeviceFlow(helper, dashboardHost, clientId);
}

async function startPendingDeviceFlow(
	helper: IHttpRequestHelper,
	dashboardHost: string,
	clientId: string,
): Promise<IDataObject> {
	const code = await startDeviceFlow(helper, dashboardHost, clientId);
	const verifyUrl = code.verification_uri_complete || code.verification_uri;
	return withConnectionState(
		{
			bearerToken: '',
			deviceCode: code.device_code,
			deviceCodeExpiresAt: Date.now() + code.expires_in * 1000,
			verificationUrl: verifyUrl,
			userCode: code.user_code,
			setupMethod: 'browser',
			manualFallback: false,
			projectId: '',
			projectSecret: '',
			platformSummary: '',
		},
		'pending',
	);
}

function connectedState(base: IDataObject): IDataObject {
	return withConnectionState(
		{
			...base,
			projectRef: base.projectId,
		},
		'connected',
	);
}

async function httpJson<T>(helper: IHttpRequestHelper, options: IHttpRequestOptions): Promise<T> {
	const response = (await helper.helpers.httpRequest({
		timeout: DEVICE_HTTP_TIMEOUT_MS,
		...options,
		json: true,
		returnFullResponse: false,
	} as IHttpRequestOptions)) as T;
	return response;
}

async function startDeviceFlow(
	helper: IHttpRequestHelper,
	dashboardHost: string,
	clientId: string,
): Promise<DeviceCodeResponse> {
	return httpJson<DeviceCodeResponse>(helper, {
		method: 'POST',
		url: `${dashboardHost}/api/auth/device/code`,
		headers: { 'content-type': 'application/json' },
		body: { client_id: clientId, scope: DEFAULT_SCOPE },
	});
}

async function pollDeviceToken(
	helper: IHttpRequestHelper,
	dashboardHost: string,
	clientId: string,
	deviceCode: string,
): Promise<{ ok: true; access_token: string } | { ok: false; error: string }> {
	const response = (await helper.helpers.httpRequest({
		method: 'POST',
		url: `${dashboardHost}/api/auth/device/token`,
		headers: { 'content-type': 'application/json' },
		body: {
			grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
			device_code: deviceCode,
			client_id: clientId,
		},
		json: true,
		returnFullResponse: true,
		ignoreHttpStatusErrors: true,
		timeout: DEVICE_HTTP_TIMEOUT_MS,
	} as IHttpRequestOptions)) as {
		statusCode: number;
		body: DeviceTokenSuccess | DeviceTokenError;
	};

	const body = response.body;
	if ('access_token' in body && body.access_token) {
		return { ok: true, access_token: body.access_token };
	}
	const err = ('error' in body && body.error) || 'invalid_request';
	return { ok: false, error: err };
}

async function listProjects(
	helper: IHttpRequestHelper,
	dashboardHost: string,
	bearer: string,
): Promise<ProjectSummary[]> {
	const body = (await helper.helpers.httpRequest({
		method: 'GET',
		url: `${dashboardHost}/api/projects`,
		headers: { authorization: `Bearer ${bearer}` },
		json: true,
		timeout: DEVICE_HTTP_TIMEOUT_MS,
	} as IHttpRequestOptions)) as ProjectSummary[] | { projects?: ProjectSummary[]; data?: ProjectSummary[] };
	if (Array.isArray(body)) return body;
	return body.projects ?? body.data ?? [];
}

async function regenerateSecret(
	helper: IHttpRequestHelper,
	dashboardHost: string,
	bearer: string,
	projectId: string,
): Promise<string> {
	const body = (await helper.helpers.httpRequest({
		method: 'POST',
		url: `${dashboardHost}/api/projects/${encodeURIComponent(projectId)}/regenerate-secret`,
		headers: { authorization: `Bearer ${bearer}` },
		json: true,
		timeout: DEVICE_HTTP_TIMEOUT_MS,
	} as IHttpRequestOptions)) as { projectSecret?: string };
	if (!body?.projectSecret) {
		throw new Error('Spectrum did not return a projectSecret on rotation.');
	}
	return body.projectSecret;
}

async function mintFromBearer(
	helper: IHttpRequestHelper,
	args: {
		bearer: string;
		dashboardHost: string;
		projectIdInput: string;
		projectName?: string;
		createProjectIfNone?: boolean;
	},
): Promise<{ projectId: string; projectSecret: string }> {
	const { bearer, dashboardHost, projectIdInput, projectName } = args;
	const allowCreate = args.createProjectIfNone !== false;

	const projects = await listProjects(helper, dashboardHost, bearer);

	let picked: ProjectSummary | undefined;
	const wantedId = projectIdInput.trim();
	if (wantedId) {
		picked = projects.find((p) => p.id === wantedId || p.spectrumProjectId === wantedId);
	}

	if (!picked) {
		const pickedId = pickExistingProject(projects, {
			projectId: projectIdInput,
			preferredName: projectName,
		});
		if (pickedId) {
			picked = projects.find((p) => p.id === pickedId);
		} else if (allowCreate) {
			const newDashboardId = await createDashboardProject(
				helper,
				dashboardHost,
				bearer,
				(projectName ?? '').trim() || 'n8n Spectrum',
			);
			const refreshed = await listProjects(helper, dashboardHost, bearer);
			picked = refreshed.find((p) => p.id === newDashboardId);
			if (!picked) {
				throw new Error('Created dashboard project but could not load it back.');
			}
		} else {
			const msg = projectResolutionError(projects, { createIfNone: allowCreate });
			throw new Error(
				msg ||
					`Multiple Photon projects found: ${formatProjectList(projects)}. Paste the Project ID when using manual credentials, or rename one project to start with "n8n".`,
			);
		}
	}

	if (!picked) {
		throw new Error('Could not resolve a Photon project to use.');
	}

	const spectrumId = (picked.spectrumProjectId ?? '').trim();
	if (!spectrumId) {
		throw new Error(
			`Photon project "${picked.name ?? picked.id}" has Spectrum disabled. Enable Spectrum on the dashboard, then Save again.`,
		);
	}

	const inlineSecret = (picked.projectSecret ?? '').trim();
	if (inlineSecret) {
		return { projectId: spectrumId, projectSecret: inlineSecret };
	}

	const projectSecret = await regenerateSecret(helper, dashboardHost, bearer, picked.id);
	return { projectId: spectrumId, projectSecret };
}
