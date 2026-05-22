import type { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { createSpectrumCloudClient } from '../../shared/cloudClient';
import { getPhotonSpectrumCloudApiCredentials } from '../../shared/credentials';
import { getLimitParameters, sliceList } from '../helpers/request';

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
		case 'platform.getPlatforms':
			return cloud.getPlatforms();

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
