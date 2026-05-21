import type { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import type { DashboardPlatform } from '../../shared/constants';
import { createSpectrumCloudClient } from '../../shared/cloudClient';
import { getPhotonSpectrumCloudApiCredentials } from '../../shared/credentials';
import { getLimitParameters, parseJsonField, sliceList } from '../helpers/request';

export type OperationResult = IDataObject | IDataObject[];

export async function executeOperation(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<OperationResult> {
	const resource = this.getNodeParameter('resource', itemIndex) as string;
	const operation = this.getNodeParameter('operation', itemIndex) as string;
	const { projectId } = await getPhotonSpectrumCloudApiCredentials(this);
	const cloud = createSpectrumCloudClient(this, projectId);
	const key = `${resource}.${operation}`;

	switch (key) {
		case 'project.getProject':
			return cloud.getProject();

		case 'billing.getSubscription':
			return cloud.getSubscription();

		case 'billing.getBillingStatus':
			return cloud.getBillingStatus();

		case 'platform.getPlatforms':
			return cloud.getPlatforms();

		case 'platform.togglePlatform':
			return cloud.togglePlatform(
				this.getNodeParameter('platform', itemIndex) as DashboardPlatform,
				this.getNodeParameter('enabled', itemIndex) as boolean,
			);

		case 'platform.updatePlatformMetadata': {
			const platform = this.getNodeParameter('platform', itemIndex) as string;
			const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
			const body: IDataObject = {};
			if (platform === 'imessage' && additionalFields.imessageEnabled !== undefined) {
				body.imessage_enabled = additionalFields.imessageEnabled;
			}
			return cloud.updatePlatformMetadata(platform, body);
		}

		case 'imessage.getImessageInfo':
			return cloud.getImessageInfo();

		case 'imessage.issueImessageTokens':
			return cloud.issueImessageTokens();

		case 'line.listLines': {
			const platform = this.getNodeParameter('linePlatform', itemIndex, '') as string;
			const data = await cloud.listLines(platform || undefined);
			return applyListLimit.call(this, itemIndex, data);
		}

		case 'line.addLine':
			return cloud.addLine();

		case 'line.removeLine': {
			const lineId = this.getNodeParameter('lineId', itemIndex) as string;
			await cloud.removeLine(lineId);
			return { deleted: true, lineId };
		}

		case 'user.createUser': {
			const userType = this.getNodeParameter('userType', itemIndex) as string;
			const body: IDataObject = {
				type: userType,
				phoneNumber: this.getNodeParameter('phoneNumber', itemIndex),
			};
			const additionalFields = this.getNodeParameter('userAdditionalFields', itemIndex, {}) as IDataObject;
			if (additionalFields.firstName) body.firstName = additionalFields.firstName;
			if (additionalFields.lastName) body.lastName = additionalFields.lastName;
			if (additionalFields.email) body.email = additionalFields.email;
			if (userType === 'dedicated') {
				body.assignedPhoneNumber = this.getNodeParameter('assignedPhoneNumber', itemIndex);
			}
			return cloud.createUser(body);
		}

		case 'user.listUsers': {
			const qs: IDataObject = {};
			const userType = this.getNodeParameter('userTypeFilter', itemIndex, '') as string;
			const userId = this.getNodeParameter('userIdFilter', itemIndex, '') as string;
			if (userType) qs.type = userType;
			if (userId) qs.id = userId;
			return applyListLimit.call(this, itemIndex, await cloud.listUsers(qs));
		}

		case 'user.getUser':
			return cloud.getUser(this.getNodeParameter('userId', itemIndex) as string);

		case 'user.deleteUser': {
			const userId = this.getNodeParameter('userId', itemIndex) as string;
			await cloud.deleteUser(userId);
			return { deleted: true, userId };
		}

		case 'webhook.listWebhooks':
			return applyListLimit.call(this, itemIndex, await cloud.listWebhooks());

		case 'webhook.registerWebhook':
			return cloud.registerWebhook(this.getNodeParameter('webhookUrl', itemIndex) as string);

		case 'webhook.deleteWebhook': {
			const webhookId = this.getNodeParameter('webhookId', itemIndex) as string;
			await cloud.deleteWebhook(webhookId);
			return { deleted: true, webhookId };
		}

		case 'slack.getSlackConfig':
			return cloud.getSlackConfig();

		case 'slack.upsertSlackConfig':
			return cloud.upsertSlackConfig(buildSlackConfigBody(this, itemIndex));

		case 'slack.deleteSlackConfig':
			await cloud.deleteSlackConfig();
			return { deleted: true };

		case 'slack.listInstallations':
			return applyListLimit.call(this, itemIndex, await cloud.listSlackInstallations());

		case 'slack.upsertInstallation': {
			const teamId = this.getNodeParameter('teamId', itemIndex) as string;
			return cloud.upsertSlackInstallation(teamId, buildSlackInstallationBody(this, itemIndex));
		}

		case 'slack.deleteInstallation': {
			const teamId = this.getNodeParameter('installationTeamId', itemIndex) as string;
			await cloud.deleteSlackInstallation(teamId);
			return { deleted: true, teamId };
		}

		case 'slack.setupSlack': {
			const body: IDataObject = {
				appName: this.getNodeParameter('appName', itemIndex),
				enabledFeatures: (this.getNodeParameter('enabledFeatures', itemIndex) as string)
					.split(',')
					.map((feature) => feature.trim())
					.filter(Boolean),
			};
			const additionalFields = this.getNodeParameter('slackSetupAdditionalFields', itemIndex, {}) as IDataObject;
			if (additionalFields.configToken) body.configToken = additionalFields.configToken;
			if (additionalFields.refreshToken) body.refreshToken = additionalFields.refreshToken;
			return cloud.setupSlack(body);
		}

		case 'slack.issueSlackTokens':
			return cloud.issueSlackTokens();

		case 'whatsappBusiness.issueWhatsappTokens':
			return cloud.issueWhatsappBusinessTokens();

		case 'whatsappBusiness.listAccounts':
			return applyListLimit.call(this, itemIndex, await cloud.listWhatsappAccounts());

		case 'whatsappBusiness.listTemplates': {
			const accountId = this.getNodeParameter('accountId', itemIndex) as string;
			return applyListLimit.call(this, itemIndex, await cloud.listWhatsappTemplates(accountId));
		}

		case 'whatsappBusiness.createTemplate': {
			const accountId = this.getNodeParameter('accountId', itemIndex) as string;
			return cloud.createWhatsappTemplate(accountId, buildWhatsappTemplateBody(this, itemIndex, true));
		}

		case 'whatsappBusiness.updateTemplate': {
			const accountId = this.getNodeParameter('accountId', itemIndex) as string;
			const templateId = this.getNodeParameter('templateId', itemIndex) as string;
			return cloud.updateWhatsappTemplate(
				accountId,
				templateId,
				buildWhatsappTemplateBody(this, itemIndex, false),
			);
		}

		case 'whatsappBusiness.deleteTemplate': {
			const accountId = this.getNodeParameter('accountId', itemIndex) as string;
			const templateId = this.getNodeParameter('templateId', itemIndex) as string;
			await cloud.deleteWhatsappTemplate(accountId, templateId);
			return { deleted: true, accountId, templateId };
		}

		case 'voice.getSipInbound':
			return cloud.getVoiceSipInbound();

		case 'voice.updateSipInbound': {
			const body: IDataObject = {};
			const sipUri = this.getNodeParameter('sipUri', itemIndex, '') as string;
			const additionalFields = this.getNodeParameter('sipAdditionalFields', itemIndex, {}) as IDataObject;
			if (sipUri) body.sipUri = sipUri;
			if (additionalFields.username !== undefined && additionalFields.username !== '') {
				body.username = additionalFields.username;
			}
			if (additionalFields.password !== undefined && additionalFields.password !== '') {
				body.password = additionalFields.password;
			}
			return cloud.updateVoiceSipInbound(body);
		}

		case 'voice.deleteSipInbound':
			await cloud.deleteVoiceSipInbound();
			return { deleted: true };

		case 'voice.issueVoiceTokens':
			return cloud.issueVoiceTokens();

		default:
			throw new NodeOperationError(
				this.getNode(),
				`Unknown operation "${operation}" for resource "${resource}"`,
				{ itemIndex },
			);
	}
}

function applyListLimit(
	this: IExecuteFunctions,
	itemIndex: number,
	data: unknown,
): OperationResult {
	if (!Array.isArray(data)) {
		return (data ?? {}) as IDataObject;
	}
	const { returnAll, limit } = getLimitParameters.call(this, itemIndex);
	return sliceList(data as IDataObject[], returnAll, limit);
}

function buildSlackConfigBody(context: IExecuteFunctions, itemIndex: number): IDataObject {
	const body: IDataObject = {};
	const additionalFields = context.getNodeParameter('slackConfigFields', itemIndex, {}) as IDataObject;
	if (additionalFields.enabledFeatures) {
		body.enabledFeatures = (additionalFields.enabledFeatures as string)
			.split(',')
			.map((feature) => feature.trim())
			.filter(Boolean);
	}
	if (additionalFields.clientId) body.clientId = additionalFields.clientId;
	if (additionalFields.clientSecret) body.clientSecret = additionalFields.clientSecret;
	if (additionalFields.signingSecret) body.signingSecret = additionalFields.signingSecret;
	if (additionalFields.appId) body.appId = additionalFields.appId;
	return body;
}

function buildSlackInstallationBody(context: IExecuteFunctions, itemIndex: number): IDataObject {
	const body: IDataObject = {
		teamName: context.getNodeParameter('teamName', itemIndex),
		appId: context.getNodeParameter('appId', itemIndex),
		botToken: context.getNodeParameter('botToken', itemIndex),
		botUserId: context.getNodeParameter('botUserId', itemIndex),
		grantedScopes: (context.getNodeParameter('grantedScopes', itemIndex) as string)
			.split(',')
			.map((scope) => scope.trim())
			.filter(Boolean),
	};
	const additionalFields = context.getNodeParameter(
		'slackInstallationAdditionalFields',
		itemIndex,
		{},
	) as IDataObject;
	if (additionalFields.botRefreshToken) body.botRefreshToken = additionalFields.botRefreshToken;
	if (additionalFields.botTokenExpiresInSec) {
		body.botTokenExpiresInSec = additionalFields.botTokenExpiresInSec;
	}
	return body;
}

function buildWhatsappTemplateBody(
	context: IExecuteFunctions,
	itemIndex: number,
	isCreate: boolean,
): IDataObject {
	const body: IDataObject = {};
	if (isCreate) {
		body.name = context.getNodeParameter('templateName', itemIndex);
		body.language = context.getNodeParameter('templateLanguage', itemIndex);
		body.category = context.getNodeParameter('templateCategory', itemIndex);
	}
	const componentsJson = context.getNodeParameter('templateComponents', itemIndex, '') as string;
	if (componentsJson) {
		body.components = parseJsonField(
			context,
			itemIndex,
			componentsJson,
			'Template Components',
		) as IDataObject[];
	} else if (isCreate) {
		throw new NodeOperationError(
			context.getNode(),
			'Template Components is required when creating a template',
			{ itemIndex },
		);
	}
	const additionalFields = context.getNodeParameter(
		'templateAdditionalFields',
		itemIndex,
		{},
	) as IDataObject;
	if (additionalFields.parameterFormat) body.parameterFormat = additionalFields.parameterFormat;
	if (additionalFields.allowCategoryChange !== undefined) {
		body.allowCategoryChange = additionalFields.allowCategoryChange;
	}
	if (!isCreate) {
		if (additionalFields.category) body.category = additionalFields.category;
		if (additionalFields.messageSendTtlSeconds) {
			body.messageSendTtlSeconds = additionalFields.messageSendTtlSeconds;
		}
	}
	return body;
}
