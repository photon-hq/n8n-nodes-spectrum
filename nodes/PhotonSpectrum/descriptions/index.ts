import type { INodeProperties } from 'n8n-workflow';

import {
	ACTION_QUICK_START,
	FROM_MESSAGE_ID,
	FROM_SENDER,
	FROM_TEXT,
	TO_IMESSAGE_REPLY,
	TO_IMESSAGE_SEND,
	TO_SLACK_REPLY,
	TO_SLACK_SEND,
} from '../../shared/uxNotices';
import { BUBBLE_EFFECTS, SCREEN_EFFECTS, TAPBACKS } from '../../shared/messaging/types';

const REACTION_OPTIONS = [
	...TAPBACKS.map((tapback) => ({
		name: tapback.charAt(0).toUpperCase() + tapback.slice(1),
		value: tapback,
	})),
	{ name: 'Custom', value: '__custom__' },
];

const EFFECT_OPTIONS = [
	{ name: 'None', value: 'none' as const },
	...BUBBLE_EFFECTS.map((effect) => ({
		name: `Bubble: ${effect.charAt(0).toUpperCase() + effect.slice(1)}`,
		value: effect,
	})),
	...SCREEN_EFFECTS.map((effect) => ({
		name: `Screen: ${effect.charAt(0).toUpperCase() + effect.slice(1)}`,
		value: effect,
	})),
];

const CORE_OPERATIONS: INodeProperties['options'] = [
	{
		name: 'Send',
		value: 'send',
		action: 'Send a message',
		description: 'Text, attachment, or other content — configure in Options',
	},
	{
		name: 'Reply',
		value: 'reply',
		action: 'Reply to a message',
		description: 'Threaded reply — wire after Spectrum Trigger',
	},
	{
		name: 'React',
		value: 'react',
		action: 'React to a message',
		description: 'Tapback on iMessage',
	},
];

const IMESSAGE_SEND_CONTENT_TYPES: INodeProperties['options'] = [
	{ name: 'Text', value: 'text' },
	{ name: 'Attachment', value: 'attachment' },
	{ name: 'Voice Note', value: 'voice' },
	{ name: 'Rich Link', value: 'richLink' },
	{ name: 'Poll', value: 'poll' },
	{ name: 'Contact Card', value: 'contact' },
	{ name: 'Album', value: 'group' },
	{ name: 'Custom JSON', value: 'custom' },
];

const SLACK_SEND_CONTENT_TYPES: INodeProperties['options'] = [
	{ name: 'Text', value: 'text' },
	{ name: 'Attachment', value: 'attachment' },
];

export const spectrumProperties: INodeProperties[] = [
	{
		displayName: ACTION_QUICK_START,
		name: 'quickStartNotice',
		type: 'notice',
		default: '',
	},
	{
		displayName: 'Platform',
		name: 'platform',
		type: 'options',
		noDataExpression: true,
		options: [
			{ name: 'iMessage', value: 'imessage' },
			{ name: 'Slack', value: 'slack' },
		],
		default: 'imessage',
	},
	{
		displayName: 'Action',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { platform: ['imessage'] } },
		options: CORE_OPERATIONS,
		default: 'send',
	},
	{
		displayName: 'Action',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { platform: ['slack'] } },
		options: CORE_OPERATIONS.filter((op) => 'value' in op && op.value !== 'react'),
		default: 'send',
	},
	{
		displayName: TO_IMESSAGE_SEND,
		name: 'toImessageSendNotice',
		type: 'notice',
		default: '',
		displayOptions: { show: { platform: ['imessage'], operation: ['send'] } },
	},
	{
		displayName: TO_SLACK_SEND,
		name: 'toSlackSendNotice',
		type: 'notice',
		default: '',
		displayOptions: { show: { platform: ['slack'], operation: ['send'] } },
	},
	{
		displayName: TO_IMESSAGE_REPLY,
		name: 'toImessageReplyNotice',
		type: 'notice',
		default: '',
		displayOptions: { show: { platform: ['imessage'], operation: ['reply', 'react'] } },
	},
	{
		displayName: TO_SLACK_REPLY,
		name: 'toSlackReplyNotice',
		type: 'notice',
		default: '',
		displayOptions: { show: { platform: ['slack'], operation: ['reply'] } },
	},
	{
		displayName: 'To',
		name: 'recipients',
		type: 'string',
		required: true,
		default: FROM_SENDER,
		placeholder: '={{ $json.sender }}',
		description:
			'Phone (+15551234567) or email (alice@icloud.com). Comma-separate to message multiple people.',
		displayOptions: { show: { platform: ['imessage'], operation: ['send'] } },
	},
	{
		displayName: 'To',
		name: 'recipients',
		type: 'string',
		required: true,
		default: FROM_SENDER,
		placeholder: '={{ $json.sender }}',
		description:
			'Slack user ID (U012AB3CD), channel ID (C012AB3CD), or channel name (#general). Comma-separate for multiple.',
		displayOptions: { show: { platform: ['slack'], operation: ['send'] } },
	},
	{
		displayName: 'Message',
		name: 'text',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		placeholder: 'Hello!',
		displayOptions: { show: { operation: ['send'] } },
	},
	{
		displayName: 'Conversation With',
		name: 'targetRecipients',
		type: 'string',
		required: true,
		default: FROM_SENDER,
		placeholder: '={{ $json.sender }}',
		description: 'Phone or email of whoever sent the inbound iMessage',
		displayOptions: { show: { platform: ['imessage'], operation: ['reply', 'react'] } },
	},
	{
		displayName: 'Conversation With',
		name: 'targetRecipients',
		type: 'string',
		required: true,
		default: FROM_SENDER,
		placeholder: '={{ $json.sender }}',
		description: 'Slack user ID of whoever sent the inbound message (e.g. U012AB3CD)',
		displayOptions: { show: { platform: ['slack'], operation: ['reply'] } },
	},
	{
		displayName: 'Message ID',
		name: 'targetMessageId',
		type: 'string',
		required: true,
		default: FROM_MESSAGE_ID,
		placeholder: '={{ $json.messageId }}',
		description:
			'The inbound message to reply to or react to — copy from Spectrum Trigger output',
		displayOptions: { show: { operation: ['reply', 'react'] } },
	},
	{
		displayName: 'Reply Text',
		name: 'replyText',
		type: 'string',
		typeOptions: { rows: 3 },
		default: FROM_TEXT,
		displayOptions: { show: { operation: ['reply'] } },
	},
	{
		displayName: 'Reaction',
		name: 'reaction',
		type: 'options',
		options: REACTION_OPTIONS,
		default: 'love',
		displayOptions: { show: { platform: ['imessage'], operation: ['react'] } },
	},
	{
		displayName: 'Custom Reaction',
		name: 'reactionCustom',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				platform: ['imessage'],
				operation: ['react'],
				reaction: ['__custom__'],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: { sendContentType: 'text' },
		options: [
			{
				displayName: 'Binary Property',
				name: 'binaryProperty',
				type: 'string',
				default: 'data',
			},
			{
				displayName: 'Contact First Name',
				name: 'contactFirst',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Contact Last Name',
				name: 'contactLast',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Contact Phones',
				name: 'contactPhones',
				type: 'string',
				default: '',
				placeholder: '+15551234567',
			},
			{
				displayName: 'Contact vCard',
				name: 'vcard',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
			},
			{
				displayName: 'Content Type',
				name: 'sendContentType',
				type: 'options',
				displayOptions: { show: { '/operation': ['send'] } },
				options: IMESSAGE_SEND_CONTENT_TYPES,
				default: 'text',
				description: 'What to send on iMessage',
			},
			{
				displayName: 'Content Type',
				name: 'sendContentType',
				type: 'options',
				displayOptions: { show: { '/operation': ['send'], '/platform': ['slack'] } },
				options: SLACK_SEND_CONTENT_TYPES,
				default: 'text',
				description: 'What to send on Slack',
			},
			{
				displayName: 'Custom Payload (JSON)',
				name: 'customPayload',
				type: 'json',
				default: '{}',
			},
			{
				displayName: 'Edit Text',
				name: 'editText',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
				description: 'Replace text on a message you sent (iMessage)',
			},
			{
				displayName: 'Effect',
				name: 'effect',
				type: 'options',
				options: EFFECT_OPTIONS,
				default: 'none',
				description: 'Bubble or screen effect for iMessage',
			},
			{
				displayName: 'File Name',
				name: 'fileName',
				type: 'string',
				default: '',
			},
			{
				displayName: 'File Path',
				name: 'filePath',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Lookup Message ID',
				name: 'lookupMessageId',
				type: 'string',
				default: '',
			},
			{
				displayName: 'MIME Type',
				name: 'mimeType',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Poll Options',
				name: 'pollOptions',
				type: 'string',
				default: '',
				placeholder: 'Option 1, Option 2, Option 3',
				description: 'Comma-separated (minimum 2)',
			},
			{
				displayName: 'Poll Title',
				name: 'pollTitle',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Reply Attachment Binary',
				name: 'replyAttachmentBinary',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Reply Attachment Path',
				name: 'replyAttachmentPath',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Send From Phone',
				name: 'fromPhone',
				type: 'string',
				default: '',
				description: 'Dedicated iMessage line only',
			},
			{
				displayName: 'Source',
				name: 'attachmentSource',
				type: 'options',
				options: [
					{ name: 'File Path', value: 'path' },
					{ name: 'Binary Property', value: 'binary' },
				],
				default: 'path',
			},
			{
				displayName: 'Typing Delay (Ms)',
				name: 'wrapDelay',
				type: 'number',
				default: 1500,
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				default: '',
				placeholder: 'https://example.com',
			},
			{
				displayName: 'Voice Duration (Seconds)',
				name: 'duration',
				type: 'number',
				default: 0,
			},
		],
	},
];
