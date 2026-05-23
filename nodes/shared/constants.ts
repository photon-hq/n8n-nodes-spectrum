export const SPECTRUM_CLOUD_URL = 'https://spectrum.photon.codes';

export type CloudPlatform = 'imessage' | 'slack' | 'whatsapp_business';

export type DashboardPlatform = CloudPlatform | 'voice';

export const PLATFORMS: Array<{ name: string; value: DashboardPlatform }> = [
	{ name: 'iMessage', value: 'imessage' },
	{ name: 'Slack', value: 'slack' },
	{ name: 'Voice', value: 'voice' },
	{ name: 'WhatsApp Business', value: 'whatsapp_business' },
] as const;

export const SUBTITLE_BY_PLATFORM: Record<string, string> = {
	imessage: 'iMessage',
	slack: 'Slack',
};

export const SUBTITLE_BY_OPERATION: Record<string, string> = {
	send: 'Send',
	reply: 'Reply',
	react: 'React',
};
