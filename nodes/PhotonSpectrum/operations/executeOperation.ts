import type { IExecuteFunctions, IDataObject } from 'n8n-workflow';

import { getPhotonSpectrumCloudApiCredentials } from '../../shared/credentials';
import { executeMessagingOperation } from '../../shared/messaging/executeMessaging';
import { withSpectrum } from '../../shared/messaging/spectrumClient';

export type OperationResult = IDataObject | IDataObject[];

export async function executeOperation(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<OperationResult> {
	const credentials = await getPhotonSpectrumCloudApiCredentials(this);

	return await withSpectrum(credentials, 'imessage', async (session) =>
		executeMessagingOperation(this, session, itemIndex),
	);
}
