import type { IExecuteFunctions } from 'n8n-workflow';

import type { IMessageEffect } from './types';

export interface NodeMessagingOptions {
	sendContentType?: string;
	effect?: IMessageEffect | 'none';
	fromPhone?: string;
	attachmentSource?: 'path' | 'binary';
	filePath?: string;
	binaryProperty?: string;
	fileName?: string;
	mimeType?: string;
	duration?: number;
	url?: string;
	replyAttachmentPath?: string;
	replyAttachmentBinary?: string;
	wrapDelay?: number;
	pollTitle?: string;
	pollOptions?: string;
	vcard?: string;
	contactFirst?: string;
	contactLast?: string;
	contactPhones?: string;
	customPayload?: unknown;
	lookupMessageId?: string;
}

export function readMessagingOptions(
	ctx: IExecuteFunctions,
	itemIndex: number,
): NodeMessagingOptions {
	return ctx.getNodeParameter('options', itemIndex, {}) as NodeMessagingOptions;
}

export function pollOptionsFromString(raw: string | undefined): Array<{ option: string }> {
	if (!raw?.trim()) return [];
	return raw
		.split(',')
		.map((value) => value.trim())
		.filter(Boolean)
		.map((option) => ({ option }));
}
