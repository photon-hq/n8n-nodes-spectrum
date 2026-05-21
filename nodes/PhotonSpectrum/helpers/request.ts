import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export function parseJsonField(
	context: IExecuteFunctions,
	itemIndex: number,
	value: string,
	fieldName: string,
): unknown {
	try {
		return JSON.parse(value);
	} catch {
		throw new NodeOperationError(
			context.getNode(),
			`Invalid JSON in ${fieldName}`,
			{ itemIndex },
		);
	}
}

export function getLimitParameters(
	this: IExecuteFunctions,
	itemIndex: number,
): { returnAll: boolean; limit: number } {
	const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;
	const limit = returnAll ? 1000 : (this.getNodeParameter('limit', itemIndex, 50) as number);
	return { returnAll, limit };
}

export function sliceList<T>(items: T[], returnAll: boolean, limit: number): T[] {
	return returnAll ? items : items.slice(0, limit);
}
