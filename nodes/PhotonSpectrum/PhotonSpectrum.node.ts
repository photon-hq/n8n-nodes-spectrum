import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes } from 'n8n-workflow';

import { SUBTITLE_BY_OPERATION } from '../shared/constants';
import { getPhotonSpectrumCloudApiCredentials } from '../shared/credentials';
import { imessageLines, lineOptions, listProjectLines } from '../shared/linesApi';
import {
	isDeliverabilityError,
	throwDeliverabilityError,
} from '../shared/messaging/outboundErrors';
import { spectrumProperties } from './descriptions';
import { executeOperation } from './operations/executeOperation';

function buildSubtitleExpression(): string {
	return `={{ ${JSON.stringify(SUBTITLE_BY_OPERATION)}[$parameter["operation"]] || $parameter["operation"] || 'Send Message' }}`;
}

export class PhotonSpectrum implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Spectrum by Photon',
		name: 'photonSpectrum',
		icon: 'file:spectrum.svg',
		group: ['output'],
		version: 1,
		subtitle: buildSubtitleExpression(),
		description: 'Send, reply, and react to messages on Spectrum',
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
			async getProjectLines(this: ILoadOptionsFunctions) {
				const credentials = await getPhotonSpectrumCloudApiCredentials(this);
				const lines = imessageLines(await listProjectLines(credentials));
				if (lines.length === 0) {
					return [{ name: 'No Lines in Project', value: '' }];
				}
				return lineOptions(lines);
			},
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

				if (isDeliverabilityError(error)) {
					throwDeliverabilityError(this, error, itemIndex);
				}

				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex });
			}
		}

		return [returnData];
	}
}
