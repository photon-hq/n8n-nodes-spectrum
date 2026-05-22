export const SPECTRUM_CLOUD_URL = 'https://spectrum.photon.codes';

export type CloudPlatform = 'imessage' | 'slack' | 'whatsapp_business';

export type DashboardPlatform = CloudPlatform | 'voice';

export const PLATFORMS: Array<{ name: string; value: DashboardPlatform }> = [
	{ name: 'iMessage', value: 'imessage' },
	{ name: 'Slack', value: 'slack' },
	{ name: 'Voice', value: 'voice' },
	{ name: 'WhatsApp Business', value: 'whatsapp_business' },
] as const;

export const SUBTITLE_BY_OPERATION: Record<string, string> = {
	createUser: 'Create user',
	deleteUser: 'Delete user',
	getPlatforms: 'Get platforms',
	getUser: 'Get user',
	listUsers: 'List users',
	listWebhooks: 'List webhooks',
};
