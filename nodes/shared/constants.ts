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
	createTemplate: 'Create template',
	createUser: 'Create user',
	delete: 'Delete',
	deleteInstallation: 'Delete installation',
	deleteSipInbound: 'Delete SIP inbound',
	deleteTemplate: 'Delete template',
	deleteUser: 'Delete user',
	deleteWebhook: 'Delete webhook',
	get: 'Get',
	getBillingStatus: 'Get billing status',
	getImessageInfo: 'Get iMessage info',
	getInstallation: 'Get installation',
	getPlatforms: 'Get platforms',
	getProject: 'Get project',
	getSipInbound: 'Get SIP inbound',
	getSlackConfig: 'Get Slack config',
	getSubscription: 'Get subscription',
	getTemplate: 'Get template',
	getUser: 'Get user',
	issueImessageTokens: 'Issue iMessage tokens',
	issueSlackTokens: 'Issue Slack tokens',
	issueVoiceTokens: 'Issue voice tokens',
	issueWhatsappTokens: 'Issue WhatsApp tokens',
	listAccounts: 'List accounts',
	listInstallations: 'List installations',
	listLines: 'List lines',
	listTemplates: 'List templates',
	listUsers: 'List users',
	listWebhooks: 'List webhooks',
	registerWebhook: 'Register webhook',
	removeLine: 'Remove line',
	setupSlack: 'Set up Slack',
	togglePlatform: 'Toggle platform',
	updatePlatformMetadata: 'Update platform metadata',
	updateSipInbound: 'Update SIP inbound',
	updateTemplate: 'Update template',
	upsertInstallation: 'Upsert installation',
	upsertSlackConfig: 'Upsert Slack config',
	addLine: 'Add line',
};
