import { isE164Phone } from './messaging/recipients';
import type { SpectrumWebhookPayload } from './webhookPayload';

const DEDICATED_SPACE_PREFIX = /^(\+[1-9]\d{1,14});-;/;

export function parsePhoneFromSpaceId(spaceId: string): string | null {
	const match = spaceId.trim().match(DEDICATED_SPACE_PREFIX);
	if (!match?.[1]) return null;
	return isE164Phone(match[1]) ? match[1] : null;
}

export function extractSpacePhone(payload: SpectrumWebhookPayload): string | null {
	const message = payload.message ?? {};
	const space = message.space ?? payload.space;

	if (typeof space?.phone === 'string' && isE164Phone(space.phone)) {
		return space.phone.trim();
	}

	const spaceId = space?.id ?? '';
	return parsePhoneFromSpaceId(spaceId);
}
