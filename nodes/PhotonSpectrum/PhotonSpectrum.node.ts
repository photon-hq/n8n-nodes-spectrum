import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes } from 'n8n-workflow';

import { SUBTITLE_BY_OPERATION } from '../shared/constants';
import { spectrumProperties } from './descriptions';
import {
	getLineOptions,
	getPlatformOptions,
	getSlackTeamOptions,
	getUserOptions,
	getWebhookOptions,
	getWhatsappAccountOptions,
	getWhatsappTemplateOptions,
} from '../shared/loadOptions';
import { executeOperation } from './operations/executeOperation';

function buildSubtitleExpression(): string {
	const entries = Object.entries(SUBTITLE_BY_OPERATION)
		.map(([key, label]) => `"${key}":"${label}"`)
		.join(',');
	return `={{ {${entries}}[$parameter["operation"]] || $parameter["operation"] }}`;
}

export class PhotonSpectrum implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Spectrum by Photon',
		name: 'photonSpectrum',
		icon: 'file:Dark.svg',
		group: ['output'],
		version: 1,
		subtitle: buildSubtitleExpression(),
		description:
			'Manage Spectrum Cloud platforms, users, webhooks, and multi-channel messaging configuration',
		defaults: {
			name: 'Spectrum by Photon',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'photonSpectrumCloudApi',
				required: true,
			},
		],
		properties: spectrumProperties,
	};

	methods = {
		loadOptions: {
			getLineOptions,
			getPlatformOptions,
			getSlackTeamOptions,
			getUserOptions,
			getWebhookOptions,
			getWhatsappAccountOptions,
			getWhatsappTemplateOptions,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const result = await executeOperation.call(this, itemIndex);

				if (Array.isArray(result)) {
					for (const row of result) {
						returnData.push({
							json: row,
							pairedItem: { item: itemIndex },
						});
					}
					continue;
				}

				returnData.push({
					json: result,
					pairedItem: { item: itemIndex },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: error instanceof Error ? error.message : String(error) },
						pairedItem: { item: itemIndex },
					});
					continue;
				}

				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex });
			}
		}

		return [returnData];
	}
}
