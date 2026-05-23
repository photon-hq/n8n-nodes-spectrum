import type { IExecuteFunctions, IDataObject } from 'n8n-workflow';

import { getPhotonSpectrumCloudApiCredentials } from '../../shared/credentials';
import { executeMessagingOperation } from '../../shared/messaging/executeMessaging';
import { withSpectrum } from '../../shared/messaging/spectrumClient';
import type { MessagingPlatform } from '../../shared/messaging/types';

export type OperationResult = IDataObject | IDataObject[];

export async function executeOperation(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<OperationResult> {
	const platform = this.getNodeParameter('platform', itemIndex) as MessagingPlatform;
	const credentials = await getPhotonSpectrumCloudApiCredentials(this);

	return await withSpectrum(credentials, platform, async (session) =>
		executeMessagingOperation(this, session, platform, itemIndex),
	);
}
