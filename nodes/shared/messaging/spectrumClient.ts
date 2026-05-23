import { installPhotonIpv4Fetch } from '../photonHttp';

import type { MessagingPlatform, SpectrumCredentials } from './types';

installPhotonIpv4Fetch();

type SpectrumModule = typeof import('spectrum-ts');

export interface ImessageProviderModule {
	imessage: {
		config: (opts?: unknown) => unknown;
		effect: { message: Record<string, string> };
		(app: unknown): PlatformRuntimeFromProvider;
	};
	effect: (content: unknown, effectValue: string) => unknown;
	background: (input: unknown, opts?: { mimeType?: string }) => unknown;
}

interface PlatformRuntimeFromProvider {
	user: (id: string) => Promise<{ id: string }>;
	space: (...args: unknown[]) => Promise<unknown>;
}

let cachedSpectrum: SpectrumModule | undefined;
let cachedImessage: ImessageProviderModule | undefined;

async function importSpectrum(): Promise<SpectrumModule> {
	// SPECTRUM_TS_IMPORT
	return (await (0, eval)('import("spectrum-ts")')) as SpectrumModule;
}

async function importImessage(): Promise<ImessageProviderModule> {
	// SPECTRUM_TS_IMESSAGE_IMPORT
	return (await (0, eval)(
		'import("spectrum-ts/providers/imessage")',
	)) as ImessageProviderModule;
}

async function loadSpectrum(): Promise<SpectrumModule> {
	if (cachedSpectrum) return cachedSpectrum;
	cachedSpectrum = await importSpectrum();
	return cachedSpectrum;
}

async function loadImessageProvider(): Promise<ImessageProviderModule> {
	if (cachedImessage) return cachedImessage;
	cachedImessage = await importImessage();
	return cachedImessage;
}

export interface SpectrumSession {
	app: Awaited<ReturnType<SpectrumModule['Spectrum']>>;
	platform: MessagingPlatform;
	runtime: PlatformRuntimeFromProvider;
	sp: SpectrumModule;
	imessageModule?: ImessageProviderModule;
	effect?: ImessageProviderModule['effect'];
	background?: ImessageProviderModule['background'];
	stop: () => Promise<void>;
}

export async function openSpectrum(
	credentials: SpectrumCredentials,
	platform: MessagingPlatform,
): Promise<SpectrumSession> {
	const sp = await loadSpectrum();
	const im = await loadImessageProvider();
	const app = await sp.Spectrum({
		projectId: credentials.projectId,
		projectSecret: credentials.projectSecret,
		providers: [im.imessage.config() as Parameters<typeof sp.Spectrum>[0]['providers'][number]],
	});

	return {
		app,
		platform,
		runtime: im.imessage(app),
		sp,
		imessageModule: im,
		effect: im.effect,
		background: im.background,
		stop: () => app.stop(),
	};
}

export async function withSpectrum<T>(
	credentials: SpectrumCredentials,
	platform: MessagingPlatform,
	fn: (session: SpectrumSession) => Promise<T>,
): Promise<T> {
	let session: SpectrumSession | undefined;
	try {
		session = await openSpectrum(credentials, platform);
		return await fn(session);
	} catch (err) {
		throw wrapSpectrumConnectError(err);
	} finally {
		await session?.stop().catch(() => undefined);
	}
}

function wrapSpectrumConnectError(err: unknown): Error {
	if (!(err instanceof Error) || err.message !== 'fetch failed') {
		return err instanceof Error ? err : new Error(String(err));
	}
	const cause = (err as Error & { cause?: NodeJS.ErrnoException }).cause;
	const detail = cause?.message ?? cause?.code ?? '';
	return new Error(
		'Could not reach Spectrum Cloud (spectrum.photon.codes). ' +
			'Check your internet connection and that Project ID / API Key are correct.' +
			(detail ? ` (${detail})` : ''),
		{ cause: err },
	);
}
