import type { INodeProperties } from 'n8n-workflow';

import {
	ACTION_QUICK_START,
	EMAIL_OUTBOUND_CONTACT_PLAIN,
	FROM_MESSAGE_ID,
	FROM_SENDER,
	FROM_TEXT,
	TO_IMESSAGE_REPLY,
	TO_IMESSAGE_SEND,
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

const SEND_FORMAT_OPTIONS: INodeProperties['options'] = [
	{ name: 'Text', value: 'text' },
	{ name: 'File', value: 'file' },
	{ name: 'Poll', value: 'poll' },
	{ name: 'Contact Card', value: 'contact' },
];

const GROUP_OPERATION_OPTIONS: INodeProperties['options'] = [
	{
		name: 'Create Group Chat',
		value: 'create',
		description: 'Start a new iMessage group with two or more people',
	},
	{
		name: 'Send Album',
		value: 'sendAlbum',
		description: 'Send multiple files as one visual group (e.g. photo album)',
	},
];

export const spectrumProperties: INodeProperties[] = [
	{
		displayName: ACTION_QUICK_START,
		name: 'quickStartNotice',
		type: 'notice',
		default: '',
	},
	{
		displayName: 'Action',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Group',
				value: 'group',
				action: 'Create or message a group',
				description: 'Create a group chat or send a file album',
			},
			{
				name: 'React',
				value: 'react',
				action: 'React to a message',
				description: 'IMessage tapback',
			},
			{
				name: 'Reply',
				value: 'reply',
				action: 'Reply to a message',
				description: 'Threaded reply — wire after Spectrum Trigger',
			},
			{
				name: 'Send',
				value: 'send',
				action: 'Send a message',
				description: 'Text, file, poll, or contact card',
			},
			{
				name: 'Show Typing',
				value: 'typing',
				action: 'Show or hide typing indicator',
				description: 'Show “typing…” before a slow reply',
			},
		],
		default: 'send',
	},
	{
		displayName: TO_IMESSAGE_SEND,
		name: 'toImessageSendNotice',
		type: 'notice',
		default: '',
		displayOptions: { show: { operation: ['send', 'typing', 'group'] } },
	},
	{
		displayName: TO_IMESSAGE_REPLY,
		name: 'toImessageReplyNotice',
		type: 'notice',
		default: '',
		displayOptions: { show: { operation: ['reply', 'react'] } },
	},
	{
		displayName: 'Group Operation',
		name: 'groupOperation',
		type: 'options',
		noDataExpression: true,
		options: GROUP_OPERATION_OPTIONS,
		default: 'create',
		displayOptions: { show: { operation: ['group'] } },
	},
	{
		displayName: 'To',
		name: 'recipients',
		type: 'string',
		required: true,
		default: FROM_SENDER,
		placeholder: '={{ $json.sender }}',
		description:
			`E.164 phone number only (e.g. +15551234567). Apple ID email is not supported for outbound yet. ${EMAIL_OUTBOUND_CONTACT_PLAIN}`,
		displayOptions: {
			show: {
				operation: ['send', 'typing', 'group'],
			},
		},
	},
	{
		displayName: 'Message Format',
		name: 'sendFormat',
		type: 'options',
		noDataExpression: true,
		options: SEND_FORMAT_OPTIONS,
		default: 'text',
		displayOptions: { show: { operation: ['send'] } },
	},
	{
		displayName: 'Message',
		name: 'text',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		placeholder: 'Hello!',
		description: 'Plain text. URLs can show an iMessage link preview when Link Preview is on.',
		displayOptions: {
			show: {
				operation: ['send'],
				sendFormat: ['text'],
			},
		},
	},
	{
		displayName: 'Link Preview',
		name: 'linkPreview',
		type: 'boolean',
		default: true,
		description:
			'Whether iMessage should show a link preview for URLs in the message (enableLinkPreview)',
		displayOptions: {
			show: {
				operation: ['send'],
				sendFormat: ['text'],
			},
		},
	},
	{
		displayName: 'Effect',
		name: 'effect',
		type: 'options',
		options: EFFECT_OPTIONS,
		default: 'none',
		description: 'Bubble or screen effect (text sends only)',
		displayOptions: {
			show: {
				operation: ['send'],
				sendFormat: ['text'],
			},
		},
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
		displayOptions: {
			show: {
				operation: ['send'],
				sendFormat: ['file'],
			},
		},
	},
	{
		displayName: 'File Path',
		name: 'filePath',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				operation: ['send'],
				sendFormat: ['file'],
				attachmentSource: ['path'],
			},
		},
	},
	{
		displayName: 'Binary Property',
		name: 'binaryProperty',
		type: 'string',
		default: 'data',
		displayOptions: {
			show: {
				operation: ['send'],
				sendFormat: ['file'],
				attachmentSource: ['binary'],
			},
		},
	},
	{
		displayName: 'File Name',
		name: 'fileName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				operation: ['send'],
				sendFormat: ['file'],
			},
		},
	},
	{
		displayName: 'MIME Type',
		name: 'mimeType',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				operation: ['send'],
				sendFormat: ['file'],
			},
		},
	},
	{
		displayName: 'Send as Voice Note',
		name: 'asVoiceNote',
		type: 'boolean',
		default: false,
		description:
			'Whether to deliver audio as an iMessage voice memo (waveform) instead of a file',
		displayOptions: {
			show: {
				operation: ['send'],
				sendFormat: ['file'],
			},
		},
	},
	{
		displayName: 'Voice Duration (Seconds)',
		name: 'duration',
		type: 'number',
		default: 0,
		displayOptions: {
			show: {
				operation: ['send'],
				sendFormat: ['file'],
				asVoiceNote: [true],
			},
		},
	},
	{
		displayName: 'Poll Title',
		name: 'pollTitle',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				operation: ['send'],
				sendFormat: ['poll'],
			},
		},
	},
	{
		displayName: 'Poll Options',
		name: 'pollOptions',
		type: 'string',
		default: '',
		placeholder: 'Option 1, Option 2, Option 3',
		description: 'Comma-separated (minimum 2). Poll replies are not in the trigger yet.',
		displayOptions: {
			show: {
				operation: ['send'],
				sendFormat: ['poll'],
			},
		},
	},
	{
		displayName: 'Contact First Name',
		name: 'contactFirst',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				operation: ['send'],
				sendFormat: ['contact'],
			},
		},
	},
	{
		displayName: 'Contact Last Name',
		name: 'contactLast',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				operation: ['send'],
				sendFormat: ['contact'],
			},
		},
	},
	{
		displayName: 'Contact Phones',
		name: 'contactPhones',
		type: 'string',
		default: '',
		placeholder: '+15551234567',
		displayOptions: {
			show: {
				operation: ['send'],
				sendFormat: ['contact'],
			},
		},
	},
	{
		displayName: 'Contact vCard',
		name: 'vcard',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		displayOptions: {
			show: {
				operation: ['send'],
				sendFormat: ['contact'],
			},
		},
	},
	{
		displayName: 'Welcome Message',
		name: 'groupWelcomeMessage',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		placeholder: 'Welcome to the group!',
		description: 'Optional first message after the group is created',
		displayOptions: {
			show: {
				operation: ['group'],
				groupOperation: ['create'],
			},
		},
	},
	{
		displayName: 'Source',
		name: 'groupAttachmentSource',
		type: 'options',
		options: [
			{ name: 'File Paths', value: 'path' },
			{ name: 'Binary Properties', value: 'binary' },
		],
		default: 'path',
		displayOptions: {
			show: {
				operation: ['group'],
				groupOperation: ['sendAlbum'],
			},
		},
	},
	{
		displayName: 'File Paths',
		name: 'groupFilePaths',
		type: 'string',
		default: '',
		placeholder: '/path/a.jpg, /path/b.jpg',
		description: 'Comma-separated paths (minimum 2 files)',
		displayOptions: {
			show: {
				operation: ['group'],
				groupOperation: ['sendAlbum'],
				groupAttachmentSource: ['path'],
			},
		},
	},
	{
		displayName: 'Binary Properties',
		name: 'groupBinaryProperties',
		type: 'string',
		default: '',
		placeholder: 'data, data2',
		description: 'Comma-separated n8n binary property names (minimum 2 files)',
		displayOptions: {
			show: {
				operation: ['group'],
				groupOperation: ['sendAlbum'],
				groupAttachmentSource: ['binary'],
			},
		},
	},
	{
		displayName: 'Album Caption',
		name: 'groupCaption',
		type: 'string',
		default: '',
		description: 'Optional text sent with the album (one caption per group)',
		displayOptions: {
			show: {
				operation: ['group'],
				groupOperation: ['sendAlbum'],
			},
		},
	},
	{
		displayName: 'Conversation With',
		name: 'targetRecipients',
		type: 'string',
		required: true,
		default: FROM_SENDER,
		placeholder: '={{ $json.sender }}',
		description:
			`E.164 phone only (e.g. +15551234567). Must match whoever sent the inbound iMessage — email Apple IDs are not supported for outbound. ${EMAIL_OUTBOUND_CONTACT_PLAIN}`,
		displayOptions: { show: { operation: ['reply', 'react'] } },
	},
	{
		displayName: 'Message ID',
		name: 'targetMessageId',
		type: 'string',
		required: true,
		default: FROM_MESSAGE_ID,
		placeholder: '={{ $json.messageId }}',
		description: 'From Spectrum Trigger output — the message to reply to or react to',
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
		displayName: 'Link Preview',
		name: 'replyLinkPreview',
		type: 'boolean',
		default: true,
		description: 'Whether iMessage should show a link preview for URLs in the reply text',
		displayOptions: { show: { operation: ['reply'] } },
	},
	{
		displayName: 'Reply Attachment Path',
		name: 'replyAttachmentPath',
		type: 'string',
		default: '',
		displayOptions: { show: { operation: ['reply'] } },
	},
	{
		displayName: 'Reply Attachment Binary',
		name: 'replyAttachmentBinary',
		type: 'string',
		default: '',
		displayOptions: { show: { operation: ['reply'] } },
	},
	{
		displayName: 'Reaction',
		name: 'reaction',
		type: 'options',
		options: REACTION_OPTIONS,
		default: 'love',
		displayOptions: { show: { operation: ['react'] } },
	},
	{
		displayName: 'Custom Reaction',
		name: 'reactionCustom',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				operation: ['react'],
				reaction: ['__custom__'],
			},
		},
	},
	{
		displayName: 'Typing Indicator',
		name: 'typingAction',
		type: 'options',
		options: [
			{ name: 'Start', value: 'start' },
			{ name: 'Stop', value: 'stop' },
		],
		default: 'start',
		displayOptions: { show: { operation: ['typing'] } },
	},
	{
		displayName: 'Send From Phone',
		name: 'fromPhone',
		type: 'string',
		default: '',
		description: 'Dedicated iMessage line in E.164 format (e.g. +15551234567) — leave blank for default',
	},
];
