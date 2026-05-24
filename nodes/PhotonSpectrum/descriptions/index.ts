import type { INodeProperties } from 'n8n-workflow';

import {
	FROM_MESSAGE_ID,
	FROM_SENDER,
	FROM_TEXT,
	LINK_PREVIEW_DESC,
	PHONE_RECIPIENT_DESC,
} from '../../shared/uxNotices';
import { BUBBLE_EFFECTS, SCREEN_EFFECTS, TAPBACKS } from '../../shared/messaging/types';

const REACTION_OPTIONS = [
	...TAPBACKS.map((tapback) => ({
		name: tapback.charAt(0).toUpperCase() + tapback.slice(1),
		value: tapback,
	})),
	{ name: 'Custom (Emoji / String)', value: '__custom__' },
];

const EFFECT_OPTIONS = [
	{ name: 'None', value: 'none' as const, description: 'No effect' },
	...BUBBLE_EFFECTS.map((effect) => ({
		name: `Bubble: ${effect.charAt(0).toUpperCase() + effect.slice(1)}`,
		value: effect,
		description: 'Bubble effect on the message',
	})),
	...SCREEN_EFFECTS.map((effect) => ({
		name: `Screen: ${effect.charAt(0).toUpperCase() + effect.slice(1)}`,
		value: effect,
		description: 'Full-screen effect for the recipient',
	})),
];

const CORE_OPERATIONS: INodeProperties['options'] = [
	{
		name: 'Send Message',
		value: 'sendMessage',
		description: 'Send a text message',
	},
	{
		name: 'Send Attachment',
		value: 'sendAttachment',
		description: 'Send a file such as a photo or PDF',
	},
	{
		name: 'Reply to Message',
		value: 'replyToMessage',
		description: 'Reply in the message thread',
	},
	{
		name: 'React to Message',
		value: 'reactToMessage',
		description: 'Add a tapback reaction to a message',
	},
];

const PRIMARY_PICKER_ACTIONS: Record<string, string> = {
	sendMessage: 'Send a message',
	sendAttachment: 'Send an attachment',
	replyToMessage: 'Reply in thread',
	reactToMessage: 'React to a message',
};

const CORE_OPERATIONS_PICKER = (CORE_OPERATIONS ?? []).map((op) => ({
	...op,
	action: PRIMARY_PICKER_ACTIONS[(op as { value: string }).value],
}));

const MORE_OPERATIONS: INodeProperties['options'] = [
	{
		name: 'Send Voice Note',
		value: 'sendVoice',
		description: 'Send an audio file as a voice note',
	},
	{
		name: 'Show Typing',
		value: 'sendTyping',
		description: 'Show or hide the typing indicator',
	},
	{
		name: 'Create Poll',
		value: 'createPoll',
		description: 'Send a poll with multiple choice options',
	},
	{
		name: 'Share Contact Card',
		value: 'shareContact',
		description: 'Send a contact card',
	},
];

/** Saved workflows may still use v1 operation values. */
const OP_SEND = ['sendMessage', 'send'];
const OP_ATTACHMENT = ['sendAttachment', 'sendVoice'];
const OP_REPLY = ['replyToMessage', 'reply'];
const OP_REACT = ['reactToMessage', 'react'];
const OP_TARGET = ['replyToMessage', 'reactToMessage', 'reply', 'react'];
const OP_WITH_FILE = [...OP_ATTACHMENT, ...OP_REPLY, 'send'];
const OP_RECIPIENT = [
	'sendMessage',
	'sendAttachment',
	'sendVoice',
	'sendTyping',
	'createPoll',
	'shareContact',
	'send',
	'typing',
];

const LEGACY_SEND_FORMAT_OPTIONS: INodeProperties['options'] = [
	{ name: 'Text', value: 'text' },
	{ name: 'File', value: 'file' },
	{ name: 'Poll', value: 'poll' },
	{ name: 'Contact Card', value: 'contact' },
];

export const spectrumProperties: INodeProperties[] = [
	{
		displayName: 'Show Expert Options',
		name: 'showExpertOptions',
		type: 'boolean',
		default: false,
		description: 'Whether to show additional actions and parameters',
	},
	{
		displayName: 'Action',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { showExpertOptions: [false] } },
		options: CORE_OPERATIONS_PICKER,
		default: 'sendMessage',
	},
	{
		displayName: 'Action',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { showExpertOptions: [true] } },
		options: [...(CORE_OPERATIONS ?? []), ...(MORE_OPERATIONS ?? [])],
		default: 'sendMessage',
	},
	{
		displayName: 'Message Format',
		name: 'sendFormat',
		type: 'options',
		noDataExpression: true,
		options: LEGACY_SEND_FORMAT_OPTIONS,
		default: 'text',
		displayOptions: { show: { operation: ['send'] } },
	},
	{
		displayName: 'Recipients',
		name: 'recipients',
		type: 'string',
		required: true,
		default: FROM_SENDER,
		placeholder: '={{ $json.sender }}',
		description: PHONE_RECIPIENT_DESC,
		displayOptions: { show: { operation: OP_RECIPIENT } },
	},
	{
		displayName: 'Message Text',
		name: 'text',
		type: 'string',
		typeOptions: { rows: 4 },
		required: true,
		default: '',
		placeholder: 'Hello!',
		description: 'Text of the message to send',
		displayOptions: {
			show: { operation: [...OP_SEND] },
			hide: { operation: ['send'], sendFormat: ['file', 'poll', 'contact'] },
		},
	},
	{
		displayName: 'Link Preview',
		name: 'linkPreview',
		type: 'boolean',
		default: true,
		description: LINK_PREVIEW_DESC,
		displayOptions: {
			show: { operation: ['sendMessage', 'send'] },
			hide: { operation: ['send'], sendFormat: ['file', 'poll', 'contact'] },
		},
	},
	{
		displayName: 'Effect',
		name: 'effect',
		type: 'options',
		options: EFFECT_OPTIONS,
		default: 'none',
		description: 'Bubble or screen effect to apply to the message',
		displayOptions: {
			show: {
				showExpertOptions: [true],
				operation: ['sendMessage', 'send'],
			},
			hide: { operation: ['send'], sendFormat: ['file', 'poll', 'contact'] },
		},
	},
	{
		displayName: 'Attachment File',
		name: 'filePath',
		type: 'string',
		default: '',
		placeholder: '/path/to/file.jpg',
		description: 'File to send. Uses the file from the previous step if empty.',
		displayOptions: {
			show: { operation: OP_WITH_FILE },
			hide: { operation: ['send'], sendFormat: ['text', 'poll', 'contact'] },
		},
	},
	{
		displayName: 'File Name',
		name: 'fileName',
		type: 'string',
		default: '',
		description: 'Name shown to the recipient. Detected from the file if empty.',
		displayOptions: {
			show: {
				showExpertOptions: [true],
				operation: OP_WITH_FILE,
			},
			hide: { operation: ['send'], sendFormat: ['text', 'poll', 'contact'] },
		},
	},
	{
		displayName: 'Send as Voice Note',
		name: 'asVoiceNote',
		type: 'boolean',
		default: false,
		description: 'Whether to send audio as a voice note instead of a file attachment',
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
		description: 'Length of the voice note in seconds, used for the waveform display',
		displayOptions: {
			show: {
				showExpertOptions: [true],
				operation: ['sendVoice'],
			},
		},
	},
	{
		displayName: 'Poll Title',
		name: 'pollTitle',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Where should we eat?',
		description: 'Title of the poll',
		displayOptions: {
			show: { operation: ['createPoll', 'send'] },
			hide: { operation: ['send'], sendFormat: ['text', 'file', 'contact'] },
		},
	},
	{
		displayName: 'Poll Options',
		name: 'pollOptions',
		type: 'string',
		default: '',
		placeholder: 'Option 1, Option 2, Option 3',
		description: 'Comma-separated list of at least two options',
		displayOptions: {
			show: { operation: ['createPoll', 'send'] },
			hide: { operation: ['send'], sendFormat: ['text', 'file', 'contact'] },
		},
	},
	{
		displayName: 'Contact First Name',
		name: 'contactFirst',
		type: 'string',
		default: '',
		description: 'First name on the contact card',
		displayOptions: {
			show: { operation: ['shareContact', 'send'] },
			hide: { operation: ['send'], sendFormat: ['text', 'file', 'poll'] },
		},
	},
	{
		displayName: 'Contact Last Name',
		name: 'contactLast',
		type: 'string',
		default: '',
		description: 'Last name on the contact card',
		displayOptions: {
			show: { operation: ['shareContact', 'send'] },
			hide: { operation: ['send'], sendFormat: ['text', 'file', 'poll'] },
		},
	},
	{
		displayName: 'Contact Phones',
		name: 'contactPhones',
		type: 'string',
		default: '',
		placeholder: '+15551234567',
		description: 'Phone numbers on the contact card, comma-separated',
		displayOptions: {
			show: { operation: ['shareContact', 'send'] },
			hide: { operation: ['send'], sendFormat: ['text', 'file', 'poll'] },
		},
	},
	{
		displayName: 'Contact vCard',
		name: 'vcard',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		description: 'Full vCard data. Used instead of the name and phone fields when set.',
		displayOptions: {
			show: { operation: ['shareContact', 'send'] },
			hide: { operation: ['send'], sendFormat: ['text', 'file', 'poll'] },
		},
	},
	{
		displayName: 'Conversation With',
		name: 'targetRecipients',
		type: 'string',
		required: true,
		default: FROM_SENDER,
		placeholder: '={{ $json.sender }}',
		description: 'Phone number of the person in the conversation. ,.',
		displayOptions: { show: { operation: OP_TARGET } },
	},
	{
		displayName: 'Message ID',
		name: 'targetMessageId',
		type: 'string',
		required: true,
		default: FROM_MESSAGE_ID,
		placeholder: '={{ $json.messageId }}',
		description: 'ID of the message to reply to or react to',
		displayOptions: { show: { operation: OP_TARGET } },
	},
	{
		displayName: 'Reply Text',
		name: 'replyText',
		type: 'string',
		typeOptions: { rows: 3 },
		default: FROM_TEXT,
		placeholder: 'Thanks for your message!',
		description: 'Text of the reply',
		displayOptions: { show: { operation: OP_REPLY } },
	},
	{
		displayName: 'Link Preview',
		name: 'replyLinkPreview',
		type: 'boolean',
		default: true,
		description: LINK_PREVIEW_DESC,
		displayOptions: { show: { operation: OP_REPLY } },
	},
	{
		displayName: 'Reaction',
		name: 'reaction',
		type: 'options',
		options: REACTION_OPTIONS,
		required: true,
		default: 'love',
		description: 'Tapback to send',
		displayOptions: { show: { operation: OP_REACT } },
	},
	{
		displayName: 'Custom Reaction',
		name: 'reactionCustom',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 🔥 or any emoji',
		description: 'Emoji or text for the reaction',
		displayOptions: {
			show: {
				operation: OP_REACT,
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
		description: 'Whether to start or stop showing typing',
		displayOptions: { show: { operation: ['sendTyping', 'typing'] } },
	},
	{
		displayName: 'Line',
		name: 'phoneRouting',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Auto',
				value: 'auto',
				description: 'Use the inbound line or the project default',
			},
			{
				name: 'Dedicated Line',
				value: 'dedicatedLine',
				description: 'Send from a specific line in the project',
			},
		],
		default: 'auto',
		description: 'Which line to send from',
	},
	{
		displayName: 'Send From Line Name or ID',
		name: 'phoneNumber',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getProjectLines',
		},
		default: '',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		displayOptions: { show: { phoneRouting: ['dedicatedLine', 'selectLine'] } },
	},
];
