import { ApplicationError } from 'n8n-workflow';

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
	fromPhone?: string,
): Promise<ResolvedSpace> {
	if (recipients.length === 0) {
		throw new ApplicationError('At least one recipient is required');
	}
	const users = await Promise.all(recipients.map((recipient) => platform.user(recipient)));
	const args: unknown[] = [...users];
	if (fromPhone) args.push({ phone: fromPhone });
	return (await platform.space(...args)) as ResolvedSpace;
}
