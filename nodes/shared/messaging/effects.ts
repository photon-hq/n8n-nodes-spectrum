import type { IMessageEffect } from './types';

export function resolveEffect(
	imessageNamespace: { effect: { message: Record<string, string> } },
	effect: IMessageEffect,
	logger?: { warn: (msg: string) => void },
): string | undefined {
	if (!effect || effect === 'none') return undefined;
	const value = imessageNamespace.effect.message[effect];
	if (value === undefined) {
		logger?.warn(
			`[Spectrum by Photon] Unknown effect "${effect}" — not found in spectrum-ts imessage.effect.message.`,
		);
		return undefined;
	}
	return value;
}
