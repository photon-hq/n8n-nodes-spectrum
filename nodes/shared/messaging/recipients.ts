import { ApplicationError } from 'n8n-workflow';

/** E.164 — Spectrum iMessage outbound requires a leading country code. */
const E164_PHONE = /^\+[1-9]\d{1,14}$/;

export function looksLikeEmail(address: string): boolean {
	const trimmed = address.trim();
	return trimmed.includes('@') && !trimmed.startsWith('+');
}

export function isE164Phone(address: string): boolean {
	return E164_PHONE.test(address.trim());
}

function formatAddress(address: string): string {
	const trimmed = address.trim();
	if (trimmed.length <= 48) return trimmed;
	return `${trimmed.slice(0, 45)}…`;
}

export function assertPhoneRecipient(address: string, fieldLabel: string): void {
	const trimmed = address.trim();
	if (!trimmed) {
		throw new ApplicationError(`${fieldLabel} is required`);
	}
	if (looksLikeEmail(trimmed)) {
		throw new ApplicationError(
			`${fieldLabel} "${formatAddress(trimmed)}" is an email address. Apple ID email is not supported — use a phone number in E.164 format (e.g. +15551234567).`,
		);
	}
	if (!isE164Phone(trimmed)) {
		throw new ApplicationError(
			`${fieldLabel} must be a phone number in E.164 format starting with + (e.g. +15551234567). Got "${formatAddress(trimmed)}".`,
		);
	}
}

export function assertPhoneRecipients(recipients: string[], fieldLabel: string): void {
	if (recipients.length === 0) {
		throw new ApplicationError(`${fieldLabel}: at least one recipient is required`);
	}
	for (const recipient of recipients) {
		assertPhoneRecipient(recipient, fieldLabel);
	}
}

export function assertOptionalPhone(phone: string | undefined): void {
	const trimmed = phone?.trim();
	if (!trimmed) return;
	assertPhoneRecipient(trimmed, 'Phone');
}
