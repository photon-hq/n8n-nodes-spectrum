import type { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { executeImessageOperation } from './imessageExecute';
import { readMessagingOptions } from './params';
import type { SpectrumSession } from './spectrumClient';

function mapSendOperation(format: string, asVoiceNote: boolean): string {
	switch (format) {
		case 'file':
			return asVoiceNote ? 'sendVoice' : 'sendAttachment';
		case 'poll':
			return 'createPoll';
		case 'contact':
			return 'shareContact';
		default:
			return 'sendMessage';
	}
}

export async function executeMessagingOperation(
	ctx: IExecuteFunctions,
	session: SpectrumSession,
	itemIndex: number,
): Promise<IDataObject> {
	const operation = ctx.getNodeParameter('operation', itemIndex) as string;
	const options = readMessagingOptions(ctx, itemIndex);

	if (operation === 'send') {
		const sendFormat = ctx.getNodeParameter('sendFormat', itemIndex, 'text') as string;
		const mapped = mapSendOperation(sendFormat, options.asVoiceNote === true);
		if (mapped === 'sendMessage' && !String(ctx.getNodeParameter('text', itemIndex, '')).trim()) {
			throw new NodeOperationError(ctx.getNode(), 'Message text is required', { itemIndex });
		}
		if (mapped === 'createPoll') {
			const title = ctx.getNodeParameter('pollTitle', itemIndex, '') as string;
			if (!title.trim()) {
				throw new NodeOperationError(ctx.getNode(), 'Poll title is required', { itemIndex });
			}
			options.pollTitle = title;
			options.pollOptions = ctx.getNodeParameter('pollOptions', itemIndex, '') as string;
		}
		if (mapped === 'sendCustom') {
			options.customPayload = ctx.getNodeParameter('customPayload', itemIndex, {}) as unknown;
		}
		if (mapped === 'sendAttachment' || mapped === 'sendVoice') {
			if (options.attachmentSource === 'path') {
				options.filePath = ctx.getNodeParameter('filePath', itemIndex, '') as string;
			}
		}
		return executeImessageOperation(ctx, session, mapped, itemIndex, options);
	}

	if (operation === 'reply') {
		return executeImessageOperation(ctx, session, 'replyToMessage', itemIndex, options);
	}

	if (operation === 'react') {
		return executeImessageOperation(ctx, session, 'reactToMessage', itemIndex, options);
	}

	if (operation === 'typing') {
		return executeImessageOperation(ctx, session, 'sendTyping', itemIndex, options);
	}

	if (operation === 'group') {
		const groupOperation = ctx.getNodeParameter('groupOperation', itemIndex, 'create') as string;
		if (groupOperation === 'sendAlbum') {
			return executeImessageOperation(ctx, session, 'sendGroupAlbum', itemIndex, options);
		}
		return executeImessageOperation(ctx, session, 'createGroup', itemIndex, options);
	}

	throw new NodeOperationError(ctx.getNode(), `Unknown operation "${operation}"`, { itemIndex });
}
