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

const EXTENDED_OPERATIONS: INodeProperties['options'] = [
	{
		name: 'Send Rich Link',
		value: 'sendRichLink',
		description: 'Send a URL as a rich link card',
	},
	{
		name: 'Send Voice Note',
		value: 'sendVoice',
		description: 'Send an audio file as a voice note',
	},
	{
		name: 'Edit Message',
		value: 'editMessage',
		description: 'Edit the text of a message you previously sent',
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
	{
		name: 'Set Chat Background',
		value: 'setBackground',
		description: 'Set or clear the chat background image',
	},
	{
		name: 'Typing Indicator',
		value: 'typingIndicator',
		description: 'Start or stop the typing indicator in a thread',
	},
];

const PRIMARY_PICKER_ACTIONS: Record<string, string> = {
	sendMessage: 'Send a message',
	sendAttachment: 'Send an attachment',
	replyToMessage: 'Reply in thread',
	reactToMessage: 'React to a message',
	typingIndicator: 'Show typing indicator',
};

const STANDARD_OPERATIONS = [...(CORE_OPERATIONS ?? []), ...(EXTENDED_OPERATIONS ?? [])];

const STANDARD_OPERATIONS_PICKER = STANDARD_OPERATIONS.map((op) => ({
	...op,
	...(PRIMARY_PICKER_ACTIONS[(op as { value: string }).value]
		? { action: PRIMARY_PICKER_ACTIONS[(op as { value: string }).value] }
		: {}),
}));

const OP_SEND = ['sendMessage', 'send'];
const ATTACHMENT_OPERATIONS = ['sendAttachment', 'sendVoice'];
const OP_REPLY = ['replyToMessage', 'reply'];
const OP_REACT = ['reactToMessage', 'react'];
const OP_TARGET = ['replyToMessage', 'editMessage', 'reactToMessage', 'reply', 'react'];
const OP_TYPING = ['typingIndicator', 'startTyping', 'stopTyping', 'typing', 'sendTyping'];
const OP_RECIPIENT = [
	'sendMessage',
	'sendAttachment',
	'sendVoice',
	'sendRichLink',
	'createPoll',
	'shareContact',
	'setBackground',
	...OP_TYPING,
	'send',
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
		description: 'Whether to show message effects and optional reply attachments',
	},
	{
		displayName: 'Action',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: STANDARD_OPERATIONS_PICKER,
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
		displayName: 'URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://example.com/article',
		displayOptions: { show: { operation: ['sendRichLink'] } },
	},
	{
		displayName: 'Attachment File',
		name: 'filePath',
		type: 'string',
		default: '',
		placeholder: '/path/to/file.jpg',
		description: 'File to send when using the legacy Send operation with File format',
		displayOptions: {
			show: { operation: ['send'], sendFormat: ['file'] },
		},
	},
	{
		displayName: 'Source',
		name: 'attachmentSource',
		type: 'options',
		options: [
			{
				name: 'Binary Property',
				value: 'binary',
				description: 'Use binary data on the incoming item',
			},
			{
				name: 'File Path',
				value: 'path',
				description: 'Absolute file path readable by the n8n process',
			},
		],
		default: 'path',
		displayOptions: { show: { operation: ATTACHMENT_OPERATIONS } },
	},
	{
		displayName: 'File Path',
		name: 'filePath',
		type: 'string',
		required: true,
		default: '',
		placeholder: '/path/to/file.jpg',
		displayOptions: {
			show: {
				operation: ATTACHMENT_OPERATIONS,
				attachmentSource: ['path'],
			},
		},
	},
	{
		displayName: 'Binary Property',
		name: 'binaryProperty',
		type: 'string',
		required: true,
		default: 'data',
		description: 'Name of the binary property on the incoming item that holds the file',
		displayOptions: {
			show: {
				operation: ATTACHMENT_OPERATIONS,
				attachmentSource: ['binary'],
			},
		},
	},
	{
		displayName: 'File Name',
		name: 'fileName',
		type: 'string',
		default: '',
		description: 'Name shown to the recipient. Detected from the file if empty.',
		displayOptions: { show: { operation: ATTACHMENT_OPERATIONS } },
	},
	{
		displayName: 'MIME Type',
		name: 'mimeType',
		type: 'string',
		default: '',
		description: 'Override MIME type when it cannot be inferred automatically',
		displayOptions: { show: { operation: ATTACHMENT_OPERATIONS } },
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
		displayOptions: { show: { operation: ['sendVoice'] } },
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
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, sortable: true },
		required: true,
		default: { values: [{ option: '' }, { option: '' }] },
		placeholder: 'Add Option',
		displayOptions: {
			show: { operation: ['createPoll', 'send'] },
			hide: { operation: ['send'], sendFormat: ['text', 'file', 'contact'] },
		},
		options: [
			{
				displayName: 'Option',
				name: 'values',
				values: [
					{
						displayName: 'Option Text',
						name: 'option',
						type: 'string',
						default: '',
					},
				],
			},
		],
	},
	{
		displayName: 'Contact Source',
		name: 'contactSource',
		type: 'options',
		options: [
			{ name: 'Structured Fields', value: 'structured' },
			{ name: 'vCard String', value: 'vcard' },
		],
		default: 'structured',
		displayOptions: {
			show: { operation: ['shareContact', 'send'] },
			hide: { operation: ['send'], sendFormat: ['text', 'file', 'poll'] },
		},
	},
	{
		displayName: 'Contact vCard',
		name: 'vcard',
		type: 'string',
		typeOptions: { rows: 6 },
		default: '',
		placeholder: 'BEGIN:VCARD...',
		required: true,
		displayOptions: {
			show: {
				operation: ['shareContact', 'send'],
				contactSource: ['vcard'],
			},
			hide: { operation: ['send'], sendFormat: ['text', 'file', 'poll'] },
		},
	},
	{
		displayName: 'Contact First Name',
		name: 'contactFirst',
		type: 'string',
		default: '',
		description: 'First name on the contact card',
		displayOptions: {
			show: {
				operation: ['shareContact', 'send'],
				contactSource: ['structured'],
			},
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
			show: {
				operation: ['shareContact', 'send'],
				contactSource: ['structured'],
			},
			hide: { operation: ['send'], sendFormat: ['text', 'file', 'poll'] },
		},
	},
	{
		displayName: 'Contact Phones',
		name: 'contactPhones',
		type: 'string',
		default: '',
		placeholder: '+15551234567, +15559876543',
		description: 'Phone numbers on the contact card, comma-separated',
		displayOptions: {
			show: {
				operation: ['shareContact', 'send'],
				contactSource: ['structured'],
			},
			hide: { operation: ['send'], sendFormat: ['text', 'file', 'poll'] },
		},
	},
	{
		displayName: 'Contact Emails',
		name: 'contactEmails',
		type: 'string',
		default: '',
		placeholder: 'alice@example.com',
		description: 'Email addresses on the contact card, comma-separated',
		displayOptions: {
			show: {
				operation: ['shareContact', 'send'],
				contactSource: ['structured'],
			},
			hide: { operation: ['send'], sendFormat: ['text', 'file', 'poll'] },
		},
	},
	{
		displayName: 'Contact Organization',
		name: 'contactOrg',
		type: 'string',
		default: '',
		description: 'Organization name on the contact card',
		displayOptions: {
			show: {
				operation: ['shareContact', 'send'],
				contactSource: ['structured'],
			},
			hide: { operation: ['send'], sendFormat: ['text', 'file', 'poll'] },
		},
	},
	{
		displayName: 'Background Source',
		name: 'backgroundSource',
		type: 'options',
		options: [
			{ name: 'Binary Property', value: 'binary' },
			{ name: 'Clear', value: 'clear', description: 'Remove the current chat background' },
			{ name: 'File Path', value: 'path' },
		],
		default: 'path',
		displayOptions: { show: { operation: ['setBackground'] } },
	},
	{
		displayName: 'Background File Path',
		name: 'backgroundPath',
		type: 'string',
		default: '',
		placeholder: '/path/to/wallpaper.jpg',
		required: true,
		displayOptions: {
			show: { operation: ['setBackground'], backgroundSource: ['path'] },
		},
	},
	{
		displayName: 'Background Binary Property',
		name: 'backgroundBinary',
		type: 'string',
		default: 'data',
		required: true,
		displayOptions: {
			show: { operation: ['setBackground'], backgroundSource: ['binary'] },
		},
	},
	{
		displayName: 'Background MIME Type',
		name: 'backgroundMime',
		type: 'string',
		default: '',
		placeholder: 'image/jpeg',
		description: 'Required when using a binary source',
		displayOptions: {
			show: { operation: ['setBackground'], backgroundSource: ['binary'] },
		},
	},
	{
		displayName: 'Conversation With',
		name: 'targetRecipients',
		type: 'string',
		required: true,
		default: FROM_SENDER,
		placeholder: '={{ $json.sender }}',
		description: 'Phone number of the person in the conversation',
		displayOptions: { show: { operation: OP_TARGET } },
	},
	{
		displayName: 'Message ID',
		name: 'targetMessageId',
		type: 'string',
		required: true,
		default: FROM_MESSAGE_ID,
		placeholder: '={{ $json.messageId }}',
		description: 'ID of the message to reply to, react to, or edit',
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
		displayName: 'Attachment File Path',
		name: 'replyAttachmentPath',
		type: 'string',
		default: '',
		description: 'Optional - reply with an attachment from a filesystem path',
		displayOptions: {
			show: { showExpertOptions: [true], operation: OP_REPLY },
		},
	},
	{
		displayName: 'Attachment Binary Property',
		name: 'replyAttachmentBinary',
		type: 'string',
		default: '',
		description: 'Optional - reply with an attachment from this binary property',
		displayOptions: {
			show: { showExpertOptions: [true], operation: OP_REPLY },
		},
	},
	{
		displayName: 'New Text',
		name: 'editText',
		type: 'string',
		typeOptions: { rows: 3 },
		required: true,
		default: '',
		description: 'Replacement text for the message',
		displayOptions: { show: { operation: ['editMessage'] } },
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
		placeholder: 'e.g. fire emoji or any emoji',
		description: 'Emoji or text for the reaction',
		displayOptions: {
			show: {
				operation: OP_REACT,
				reaction: ['__custom__'],
			},
		},
	},
	{
		displayName: 'Indicator',
		name: 'typingAction',
		type: 'options',
		noDataExpression: true,
		options: [
			{ name: 'Start', value: 'start', description: 'Show the typing indicator' },
			{ name: 'Stop', value: 'stop', description: 'Hide the typing indicator' },
		],
		default: 'start',
		description: 'Whether to start or stop the typing indicator',
		displayOptions: { show: { operation: OP_TYPING } },
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
