import { assertOptionalPhone, assertPhoneRecipients } from './recipients';
import type { PlatformRuntime, ResolvedSpace } from './types';

export function splitAddresses(raw: string): string[] {
	return raw
		.split(',')
		.map((value) => value.trim())
		.filter(Boolean);
}

export async function resolveSpace(
	platform: PlatformRuntime,
	recipients: string[],
	phone?: string,
	fieldLabel = 'To',
): Promise<ResolvedSpace> {
	assertPhoneRecipients(recipients, fieldLabel);
	assertOptionalPhone(phone);
	const users = await Promise.all(recipients.map((recipient) => platform.user(recipient)));
	const args: unknown[] = [...users];
	if (phone) args.push({ phone });
	return (await platform.space(...args)) as ResolvedSpace;
}
