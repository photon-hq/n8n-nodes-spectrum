import type { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { executeImessageOperation } from './imessageExecute';
import { readMessagingOptions } from './params';
import type { SpectrumSession } from './spectrumClient';
import type { MessagingPlatform } from './types';

function mapSendOperation(platform: MessagingPlatform, contentType: string): string {
	if (platform === 'slack') {
		return contentType === 'attachment' ? 'sendAttachment' : 'sendMessage';
	}

	switch (contentType) {
		case 'attachment':
			return 'sendAttachment';
		case 'voice':
			return 'sendVoice';
		case 'richLink':
			return 'sendRichLink';
		case 'poll':
			return 'createPoll';
		case 'contact':
			return 'shareContact';
		case 'custom':
			return 'sendCustom';
		default:
			return 'sendMessage';
	}
}

export async function executeMessagingOperation(
	ctx: IExecuteFunctions,
	session: SpectrumSession,
	platform: MessagingPlatform,
	itemIndex: number,
): Promise<IDataObject> {
	if (platform === 'slack') {
		throw new NodeOperationError(
			ctx.getNode(),
			'Slack send is not available yet — the Spectrum SDK does not include a Slack provider. Use the trigger to receive Slack messages; outbound Slack is coming soon.',
			{ itemIndex },
		);
	}

	const operation = ctx.getNodeParameter('operation', itemIndex) as string;
	const options = readMessagingOptions(ctx, itemIndex);

	if (operation === 'send') {
		const contentType = options.sendContentType ?? 'text';
		const mapped = mapSendOperation(platform, contentType);
		if (mapped === 'sendMessage' && !String(ctx.getNodeParameter('text', itemIndex, '')).trim()) {
			throw new NodeOperationError(ctx.getNode(), 'Message text is required', { itemIndex });
		}
		return executeImessageOperation(ctx, session, mapped, itemIndex, options);
	}

	if (operation === 'reply') {
		return executeImessageOperation(ctx, session, 'replyToMessage', itemIndex, options);
	}

	if (operation === 'react') {
		return executeImessageOperation(ctx, session, 'reactToMessage', itemIndex, options);
	}

	throw new NodeOperationError(ctx.getNode(), `Unknown operation "${operation}"`, { itemIndex });
}
