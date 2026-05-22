import type { INodeProperties } from 'n8n-workflow';

import {
	ACTION_CREATE_USER_HINT,
	ACTION_LIST_USERS_HINT,
	ACTION_PLATFORMS_HINT,
	ACTION_QUICK_START,
	ACTION_WEBHOOKS_HINT,
	FROM_SENDER,
} from '../../shared/uxNotices';

const listOptions: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 1000 },
		default: 50,
		description: 'Max number of results to return',
		displayOptions: { show: { returnAll: [false] } },
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
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'User',
				value: 'user',
				description: 'Add or look up people who can send and receive messages',
			},
			{
				name: 'Platform',
				value: 'platform',
				description: 'See which messaging channels are turned on (read-only)',
			},
			{
				name: 'Webhook',
				value: 'webhook',
				description: 'See registered webhook URLs (the Trigger node registers automatically)',
			},
		],
		default: 'user',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['platform'] } },
		options: [
			{
				name: 'Get Platforms',
				value: 'getPlatforms',
				action: 'Get platforms',
				description: 'See which channels (iMessage, Slack, etc.) are enabled on your project',
			},
		],
		default: 'getPlatforms',
	},
	{
		displayName: ACTION_PLATFORMS_HINT,
		name: 'platformsNotice',
		type: 'notice',
		default: '',
		displayOptions: { show: { resource: ['platform'] } },
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['user'] } },
		options: [
			{
				name: 'Create User',
				value: 'createUser',
				action: 'Create user',
				description: 'Add someone — wire after Spectrum Trigger to use the sender’s phone number',
			},
			{
				name: 'Delete User',
				value: 'deleteUser',
				action: 'Delete user',
				description: 'Remove a user from your project',
			},
			{
				name: 'Get User',
				value: 'getUser',
				action: 'Get user',
				description: 'Look up one user by ID',
			},
			{
				name: 'List Users',
				value: 'listUsers',
				action: 'List users',
				description: 'List everyone on your project',
			},
		],
		default: 'createUser',
	},
	{
		displayName: ACTION_CREATE_USER_HINT,
		name: 'createUserNotice',
		type: 'notice',
		default: '',
		displayOptions: { show: { resource: ['user'], operation: ['createUser'] } },
	},
	{
		displayName: ACTION_LIST_USERS_HINT,
		name: 'listUsersNotice',
		type: 'notice',
		default: '',
		displayOptions: { show: { resource: ['user'], operation: ['listUsers'] } },
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['webhook'] } },
		options: [
			{
				name: 'List Webhooks',
				value: 'listWebhooks',
				action: 'List webhooks',
				description: 'See webhook URLs registered with your project (for troubleshooting)',
			},
		],
		default: 'listWebhooks',
	},
	{
		displayName: ACTION_WEBHOOKS_HINT,
		name: 'webhooksNotice',
		type: 'notice',
		default: '',
		displayOptions: { show: { resource: ['webhook'] } },
	},
	{
		displayName: 'User Type',
		name: 'userType',
		type: 'options',
		required: true,
		options: [
			{
				name: 'Shared',
				value: 'shared',
				description: 'Best for most teams — users share your project line and get their own reply number',
			},
			{
				name: 'Dedicated',
				value: 'dedicated',
				description: 'Each user gets their own dedicated phone line (set up the line in the dashboard first)',
			},
		],
		default: 'shared',
		displayOptions: { show: { resource: ['user'], operation: ['createUser'] } },
	},
	{
		displayName: 'Phone Number',
		name: 'phoneNumber',
		type: 'string',
		required: true,
		default: FROM_SENDER,
		placeholder: '={{ $json.sender }}',
		description:
			'Who to add. After Spectrum Trigger, this defaults to whoever sent the message. For a signup form, map your phone field instead.',
		displayOptions: { show: { resource: ['user'], operation: ['createUser'] } },
	},
	{
		displayName: 'Assigned Phone Number',
		name: 'assignedPhoneNumber',
		type: 'string',
		required: true,
		default: '',
		placeholder: '+15551234567',
		description: 'The dedicated line phone number from your Spectrum dashboard',
		displayOptions: {
			show: { resource: ['user'], operation: ['createUser'], userType: ['dedicated'] },
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'userAdditionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['user'], operation: ['createUser'] } },
		options: [
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: '={{ $json.email }}',
				default: '',
				description: 'Optional — map from a form field if you have one',
			},
			{
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				default: '',
				placeholder: '={{ $json.firstName }}',
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				default: '',
				placeholder: '={{ $json.lastName }}',
			},
		],
	},
	{
		displayName: 'User Type',
		name: 'userTypeFilter',
		type: 'options',
		options: [
			{ name: 'All', value: '' },
			{ name: 'Dedicated', value: 'dedicated' },
			{ name: 'Shared', value: 'shared' },
		],
		default: '',
		description: 'Filter the list to shared or dedicated users only',
		displayOptions: { show: { resource: ['user'], operation: ['listUsers'] } },
	},
	{
		displayName: 'User ID',
		name: 'userIdFilter',
		type: 'string',
		default: '',
		description: 'Only return the user with this ID',
		displayOptions: { show: { resource: ['user'], operation: ['listUsers'] } },
	},
	...withListDisplayOptions(['user'], ['listUsers']),
	{
		displayName: 'User Name or ID',
		name: 'userId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getUserOptions' },
		required: true,
		default: '',
		description:
			'Pick the user to load or remove. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: { show: { resource: ['user'], operation: ['getUser', 'deleteUser'] } },
	},
	...withListDisplayOptions(['webhook'], ['listWebhooks']),
];

function withListDisplayOptions(resources: string[], operations: string[]): INodeProperties[] {
	return listOptions.map((field) => ({
		...field,
		displayOptions: { show: { resource: resources, operation: operations } },
	}));
}
