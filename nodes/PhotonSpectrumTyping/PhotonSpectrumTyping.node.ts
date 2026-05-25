import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes } from 'n8n-workflow';

import { getPhotonSpectrumCloudApiCredentials } from '../shared/credentials';
import { imessageLines, lineOptions, listProjectLines } from '../shared/linesApi';
import {
	isDeliverabilityError,
	throwDeliverabilityError,
} from '../shared/messaging/outboundErrors';
import { executeImessageOperation } from '../shared/messaging/imessageExecute';
import { readMessagingOptions } from '../shared/messaging/params';
import { withSpectrum } from '../shared/messaging/spectrumClient';

const OPERATION_LABELS: Record<string, string> = {
	start: 'Start Typing',
	stop: 'Stop Typing',
};

export class PhotonSpectrumTyping implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Spectrum Typing Indicator',
		name: 'photonSpectrumTyping',
		icon: 'file:spectrum.svg',
		group: ['output'],
		version: 1,
		subtitle: `={{ (${JSON.stringify(OPERATION_LABELS)})[$parameter.operation] || 'Typing Indicator' }}`,
		description: 'Start or stop the typing indicator in a Spectrum thread',
		defaults: { name: 'Spectrum Typing Indicator' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'photonSpectrumCloudApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Action',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Start Typing', value: 'start', action: 'Start typing' },
					{ name: 'Stop Typing', value: 'stop', action: 'Stop typing' },
				],
				default: 'start',
			},
			{
				displayName: 'Thread With',
				name: 'recipients',
				type: 'string',
				required: true,
				default: '={{ $json.sender }}',
				placeholder: '={{ $json.sender }}',
				description:
					'Phone number in E.164 format (+15551234567). Apple ID emails are not supported.',
			},
			{
				displayName: 'Line',
				name: 'phoneRouting',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Auto',
						value: 'auto',
						description: 'Use the inbound line or the project default',
					},
					{
						name: 'Dedicated Line',
						value: 'dedicatedLine',
						description: 'Send from a specific line in the project',
					},
				],
				default: 'auto',
				description: 'Which line to send from',
			},
			{
				displayName: 'Send From Line Name or ID',
				name: 'phoneNumber',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getProjectLines',
				},
				default: '',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				displayOptions: { show: { phoneRouting: ['dedicatedLine', 'selectLine'] } },
			},
		],
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
		const credentials = await getPhotonSpectrumCloudApiCredentials(this);

		await withSpectrum(credentials, 'imessage', async (session) => {
			for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
				try {
					const typingAction = this.getNodeParameter('operation', itemIndex) as 'start' | 'stop';
					const options = readMessagingOptions(this, itemIndex);
					const result = await executeImessageOperation(
						this,
						session,
						'sendTyping',
						itemIndex,
						{ ...options, typingAction },
					);
					returnData.push({ json: result, pairedItem: { item: itemIndex } });
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
		});

		return [returnData];
	}
}
