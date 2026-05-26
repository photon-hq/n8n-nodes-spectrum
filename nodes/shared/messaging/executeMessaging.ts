import type { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { executeImessageOperation } from './imessageExecute';
import { readMessagingOptions, resolveOptionalAttachmentSource } from './params';
import type { SpectrumSession } from './spectrumClient';

export type SpectrumOperation =
	| 'sendMessage'
	| 'sendAttachment'
	| 'sendVoice'
	| 'sendRichLink'
	| 'replyToMessage'
	| 'editMessage'
	| 'reactToMessage'
	| 'sendTyping'
	| 'createPoll'
	| 'shareContact'
	| 'setBackground';

const GROUP_OPERATIONS = new Set(['createGroup', 'sendGroupAlbum', 'group']);

function rejectGroupOperation(ctx: IExecuteFunctions, itemIndex: number, operation: string): void {
	if (!GROUP_OPERATIONS.has(operation)) return;
	throw new NodeOperationError(
		ctx.getNode(),
		'Group operations are not available. Use Send Message or Send Attachment instead',
		{ itemIndex },
	);
}

function resolveOperation(ctx: IExecuteFunctions, itemIndex: number): SpectrumOperation {
	const operation = ctx.getNodeParameter('operation', itemIndex, 'sendMessage') as string;
	rejectGroupOperation(ctx, itemIndex, operation);

	if (operation === 'sendMessage' || operation === 'sendAttachment') {
		return operation;
	}
	if (operation === 'sendRichLink') {
		return operation;
	}
	if (operation === 'replyToMessage' || operation === 'reply') {
		return 'replyToMessage';
	}
	if (operation === 'editMessage') {
		return operation;
	}
	if (operation === 'reactToMessage' || operation === 'react') {
		return 'reactToMessage';
	}
	if (operation === 'sendTyping' || operation === 'typing' || operation === 'typingIndicator' || operation === 'startTyping' || operation === 'stopTyping') {
		return 'sendTyping';
	}
	if (operation === 'createPoll') {
		return 'createPoll';
	}
	if (operation === 'shareContact') {
		return 'shareContact';
	}
	if (operation === 'setBackground') {
		return operation;
	}
	if (operation === 'sendVoice') {
		return operation;
	}

	if (operation === 'send') {
		const sendFormat = ctx.getNodeParameter('sendFormat', itemIndex, 'text') as string;
		const asVoiceNote = ctx.getNodeParameter('asVoiceNote', itemIndex, false) as boolean;
		if (sendFormat === 'file') {
			return asVoiceNote ? 'sendVoice' : 'sendAttachment';
		}
		if (sendFormat === 'poll') return 'createPoll';
		if (sendFormat === 'contact') return 'shareContact';
		return 'sendMessage';
	}

	return operation as SpectrumOperation;
}

export async function executeMessagingOperation(
	ctx: IExecuteFunctions,
	session: SpectrumSession,
	itemIndex: number,
): Promise<IDataObject> {
	const operation = resolveOperation(ctx, itemIndex);
	const options = readMessagingOptions(ctx, itemIndex);

	if (operation === 'sendMessage') {
		if (!String(ctx.getNodeParameter('text', itemIndex, '')).trim()) {
			throw new NodeOperationError(ctx.getNode(), 'Message text is required', { itemIndex });
		}
		return executeImessageOperation(ctx, session, operation, itemIndex, options);
	}

	if (operation === 'sendAttachment' || operation === 'sendVoice') {
		return executeImessageOperation(ctx, session, operation, itemIndex, options);
	}

	if (operation === 'sendRichLink') {
		if (!String(ctx.getNodeParameter('url', itemIndex, '')).trim()) {
			throw new NodeOperationError(ctx.getNode(), 'URL is required', { itemIndex });
		}
		return executeImessageOperation(ctx, session, operation, itemIndex, options);
	}

	if (operation === 'createPoll') {
		const title = ctx.getNodeParameter('pollTitle', itemIndex, '') as string;
		if (!title.trim()) {
			throw new NodeOperationError(ctx.getNode(), 'Poll title is required', { itemIndex });
		}
		return executeImessageOperation(ctx, session, operation, itemIndex, options);
	}

	if (operation === 'shareContact') {
		return executeImessageOperation(ctx, session, operation, itemIndex, options);
	}

	if (operation === 'setBackground') {
		return executeImessageOperation(ctx, session, operation, itemIndex, options);
	}

	if (operation === 'replyToMessage') {
		const replyText = String(ctx.getNodeParameter('replyText', itemIndex, '')).trim();
		const hasFile = resolveOptionalAttachmentSource(ctx, itemIndex, options);
		if (!replyText && !hasFile) {
			throw new NodeOperationError(
				ctx.getNode(),
				'Reply requires text or a file',
				{ itemIndex },
			);
		}
		return executeImessageOperation(ctx, session, operation, itemIndex, options);
	}

	if (operation === 'editMessage') {
		if (!String(ctx.getNodeParameter('editText', itemIndex, '')).trim()) {
			throw new NodeOperationError(ctx.getNode(), 'New text is required', { itemIndex });
		}
		return executeImessageOperation(ctx, session, operation, itemIndex, options);
	}

	if (operation === 'reactToMessage') {
		return executeImessageOperation(ctx, session, operation, itemIndex, options);
	}

	if (operation === 'sendTyping') {
		const rawOperation = ctx.getNodeParameter('operation', itemIndex) as string;
		const typingAction =
			(options.typingAction as 'start' | 'stop' | undefined) ??
			(rawOperation === 'stopTyping'
				? 'stop'
				: rawOperation === 'startTyping'
					? 'start'
					: 'start');
		return executeImessageOperation(ctx, session, operation, itemIndex, {
			...options,
			typingAction,
		});
	}

	throw new NodeOperationError(ctx.getNode(), `Unknown operation "${operation}"`, { itemIndex });
}
