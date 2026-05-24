import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { assertOptionalPhone } from './recipients';
import type { IMessageEffect } from './types';

export type LineMode = 'auto' | 'dedicatedLine';

/** @deprecated Legacy values still resolved at runtime for saved workflows. */
export type PhoneRouting = LineMode | 'fromInbound' | 'selectLine' | 'expression';

export interface NodeMessagingOptions {
	effect?: IMessageEffect | 'none';
	phoneRouting?: PhoneRouting;
	phone?: string;
	attachmentSource?: 'path' | 'binary';
	filePath?: string;
	binaryProperty?: string;
	fileName?: string;
	mimeType?: string;
	duration?: number;
	asVoiceNote?: boolean;
	linkPreview?: boolean;
	replyLinkPreview?: boolean;
	replyAttachmentPath?: string;
	replyAttachmentBinary?: string;
	pollTitle?: string;
	pollOptions?: string;
	vcard?: string;
	contactFirst?: string;
	contactLast?: string;
	contactPhones?: string;
	customPayload?: unknown;
	groupCaption?: string;
	groupFilePaths?: string;
	groupBinaryProperties?: string;
	groupAttachmentSource?: 'path' | 'binary';
}

export function resolveSpacePhone(ctx: IExecuteFunctions, itemIndex: number): string {
	const routing = ctx.getNodeParameter('phoneRouting', itemIndex, 'auto') as string;

	if (routing === 'selectLine' || routing === 'dedicatedLine') {
		return String(ctx.getNodeParameter('phoneNumber', itemIndex, '')).trim();
	}

	if (routing === 'expression') {
		return String(ctx.getNodeParameter('phoneExpression', itemIndex, '')).trim();
	}

	const triggerPhone = readTriggerPhone(ctx, itemIndex);
	if (triggerPhone) return triggerPhone;

	if (routing === 'fromInbound') {
		return String(ctx.getNodeParameter('phone', itemIndex, '')).trim();
	}

	return '';
}

function readTriggerPhone(ctx: IExecuteFunctions, itemIndex: number): string {
	const item = ctx.getInputData()[itemIndex]?.json ?? {};
	const phone = item.phone;
	return typeof phone === 'string' ? phone.trim() : '';
}

export function readMessagingOptions(
	ctx: IExecuteFunctions,
	itemIndex: number,
): NodeMessagingOptions {
	const phone = resolveSpacePhone(ctx, itemIndex);

	return {
		phoneRouting: ctx.getNodeParameter('phoneRouting', itemIndex, 'auto') as PhoneRouting,
		phone,
		effect: ctx.getNodeParameter('effect', itemIndex, 'none') as IMessageEffect | 'none',
		attachmentSource: ctx.getNodeParameter('attachmentSource', itemIndex, 'path') as
			| 'path'
			| 'binary',
		filePath: ctx.getNodeParameter('filePath', itemIndex, '') as string,
		binaryProperty: ctx.getNodeParameter('binaryProperty', itemIndex, 'data') as string,
		fileName: ctx.getNodeParameter('fileName', itemIndex, '') as string,
		mimeType: ctx.getNodeParameter('mimeType', itemIndex, '') as string,
		duration: ctx.getNodeParameter('duration', itemIndex, 0) as number,
		asVoiceNote: ctx.getNodeParameter('asVoiceNote', itemIndex, false) as boolean,
		linkPreview: ctx.getNodeParameter('linkPreview', itemIndex, true) as boolean,
		replyLinkPreview: ctx.getNodeParameter('replyLinkPreview', itemIndex, true) as boolean,
		replyAttachmentPath: ctx.getNodeParameter('replyAttachmentPath', itemIndex, '') as string,
		replyAttachmentBinary: ctx.getNodeParameter(
			'replyAttachmentBinary',
			itemIndex,
			'',
		) as string,
		pollTitle: ctx.getNodeParameter('pollTitle', itemIndex, '') as string,
		pollOptions: ctx.getNodeParameter('pollOptions', itemIndex, '') as string,
		vcard: ctx.getNodeParameter('vcard', itemIndex, '') as string,
		contactFirst: ctx.getNodeParameter('contactFirst', itemIndex, '') as string,
		contactLast: ctx.getNodeParameter('contactLast', itemIndex, '') as string,
		contactPhones: ctx.getNodeParameter('contactPhones', itemIndex, '') as string,
		customPayload: ctx.getNodeParameter('customPayload', itemIndex, {}) as unknown,
		groupCaption: ctx.getNodeParameter('groupCaption', itemIndex, '') as string,
		groupFilePaths: ctx.getNodeParameter('groupFilePaths', itemIndex, '') as string,
		groupBinaryProperties: ctx.getNodeParameter('groupBinaryProperties', itemIndex, '') as string,
		groupAttachmentSource: ctx.getNodeParameter('groupAttachmentSource', itemIndex, 'path') as
			| 'path'
			| 'binary',
	};
}

export function assertResolvedSpacePhone(
	ctx: IExecuteFunctions,
	itemIndex: number,
	options: NodeMessagingOptions,
): void {
	const routing = options.phoneRouting ?? 'auto';

	if (
		(routing === 'selectLine' || routing === 'dedicatedLine') &&
		!options.phone
	) {
		throw new NodeOperationError(ctx.getNode(), 'Select a dedicated line', { itemIndex });
	}

	if (routing === 'expression' && !options.phone) {
		throw new NodeOperationError(
			ctx.getNode(),
			'Phone expression resolved to empty — set phone or switch routing mode',
			{ itemIndex },
		);
	}

	assertOptionalPhone(options.phone);
}

export function pollOptionsFromString(raw: string | undefined): Array<{ option: string }> {
	if (!raw?.trim()) return [];
	return raw
		.split(',')
		.map((value) => value.trim())
		.filter(Boolean)
		.map((option) => ({ option }));
}

export function splitList(raw: string | undefined): string[] {
	if (!raw?.trim()) return [];
	return raw
		.split(',')
		.map((value) => value.trim())
		.filter(Boolean);
}

export function resolveFilePath(options: NodeMessagingOptions): string {
	return (options.filePath ?? options.replyAttachmentPath ?? '').trim();
}

export function resolveBinaryProperty(options: NodeMessagingOptions): string {
	if (options.replyAttachmentBinary?.trim()) {
		return options.replyAttachmentBinary.trim();
	}
	return (options.binaryProperty ?? 'data').trim() || 'data';
}

export function hasBinaryAttachment(
	ctx: IExecuteFunctions,
	itemIndex: number,
	property: string,
): boolean {
	const name = property.trim() || 'data';
	return Boolean(ctx.getInputData()[itemIndex]?.binary?.[name]);
}

/** Returns null when no file path or binary data is available. */
export function resolveOptionalAttachmentSource(
	ctx: IExecuteFunctions,
	itemIndex: number,
	options: NodeMessagingOptions,
): 'path' | 'binary' | null {
	const filePath = resolveFilePath(options);
	if (filePath) return 'path';

	const property = resolveBinaryProperty(options);
	if (hasBinaryAttachment(ctx, itemIndex, property)) return 'binary';

	return null;
}

/** Path wins when set; otherwise uses binary data on the incoming item. */
export function resolveAttachmentSource(
	ctx: IExecuteFunctions,
	itemIndex: number,
	options: NodeMessagingOptions,
): 'path' | 'binary' {
	return resolveOptionalAttachmentSource(ctx, itemIndex, options) ?? 'binary';
}
