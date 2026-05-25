import type { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { resolveEffect } from './effects';
import {
	assertResolvedSpacePhone,
	pollOptionsFromParameter,
	readMessagingOptions,
	resolveAttachmentSource,
	resolveBinaryProperty,
	resolveFilePath,
	resolveOptionalAttachmentSource,
	splitList,
	type NodeMessagingOptions,
} from './params';
import { resolveAttachmentMeta } from './fileMeta';
import { assertPhoneRecipient } from './recipients';
import { resolveSpace, splitAddresses } from './resolveSpace';
import type { SpectrumSession } from './spectrumClient';
import type { IMessageEffect } from './types';

type SpectrumModule = SpectrumSession['sp'];

function textContent(sp: SpectrumModule, message: string, linkPreview: boolean): unknown {
	if (!linkPreview) {
		return sp.text(message);
	}
	return {
		build: async () => ({ type: 'richlink', url: message }),
	};
}

function getSpacePhone(options: NodeMessagingOptions): string {
	return options.phone?.trim() ?? '';
}

type FileBuilderKind = 'attachment' | 'voice';

async function buildFileContent(
	ctx: IExecuteFunctions,
	sp: SpectrumModule,
	itemIndex: number,
	options: NodeMessagingOptions,
	kind: FileBuilderKind,
): Promise<unknown> {
	const source = resolveAttachmentSource(ctx, itemIndex, options);
	const builder = kind === 'voice' ? sp.voice : sp.attachment;
	const filePath = resolveFilePath(options);

	if (source === 'path') {
		const meta: Record<string, unknown> = { ...resolveAttachmentMeta(filePath, options) };
		if (kind === 'voice' && options.duration) meta.duration = options.duration;
		return Object.keys(meta).length > 0
			? (builder as (path: string, meta: unknown) => unknown)(filePath, meta)
			: (builder as (path: string) => unknown)(filePath);
	}

	const property = resolveBinaryProperty(options);
	const binary = await ctx.helpers.getBinaryDataBuffer(itemIndex, property);
	const binaryMeta = ctx.helpers.assertBinaryData(itemIndex, property);
	const meta: Record<string, unknown> = { ...resolveAttachmentMeta('', options, binaryMeta) };
	if (kind === 'voice' && options.duration) meta.duration = options.duration;
	return (builder as (buffer: Buffer, meta: unknown) => unknown)(binary, meta);
}

async function buildOptionalFileContent(
	ctx: IExecuteFunctions,
	sp: SpectrumModule,
	itemIndex: number,
	options: NodeMessagingOptions,
): Promise<unknown | undefined> {
	const source = resolveOptionalAttachmentSource(ctx, itemIndex, options);
	if (!source) return undefined;

	const filePath = resolveFilePath(options);
	const builder = sp.attachment;

	if (source === 'path') {
		const meta: Record<string, unknown> = { ...resolveAttachmentMeta(filePath, options) };
		return Object.keys(meta).length > 0
			? builder(filePath, meta)
			: builder(filePath);
	}

	const property = resolveBinaryProperty(options);
	const binary = await ctx.helpers.getBinaryDataBuffer(itemIndex, property);
	const binaryMeta = ctx.helpers.assertBinaryData(itemIndex, property);
	const meta: Record<string, unknown> = { ...resolveAttachmentMeta('', options, binaryMeta) };
	return builder(binary, meta);
}

export async function executeImessageOperation(
	ctx: IExecuteFunctions,
	session: SpectrumSession,
	operation: string,
	itemIndex: number,
	optionsInput?: NodeMessagingOptions,
): Promise<IDataObject> {
	const options = optionsInput ?? readMessagingOptions(ctx, itemIndex);
	assertResolvedSpacePhone(ctx, itemIndex, options);
	const { runtime, sp, imessageModule, effect: effectBuilder } = session;

	if (!imessageModule || !effectBuilder) {
		throw new NodeOperationError(ctx.getNode(), 'iMessage provider is not loaded', { itemIndex });
	}

	switch (operation) {
		case 'sendMessage':
			return sendMessage(ctx, runtime, sp, imessageModule, effectBuilder, itemIndex, options);
		case 'sendAttachment':
		case 'sendVoice':
			return sendAttachmentOrVoice(ctx, runtime, sp, operation, itemIndex, options);
		case 'sendRichLink':
			return sendRichLink(ctx, runtime, sp, itemIndex, options);
		case 'replyToMessage':
			return replyToMessage(ctx, runtime, sp, itemIndex, options);
		case 'editMessage':
			return editMessage(ctx, runtime, sp, itemIndex, options);
		case 'reactToMessage':
			return reactToMessage(ctx, runtime, itemIndex, options);
		case 'sendCustom':
			return sendCustom(ctx, runtime, sp, itemIndex, options);
		case 'createPoll':
			return createPoll(ctx, runtime, sp, itemIndex, options);
		case 'shareContact':
			return shareContact(ctx, runtime, sp, itemIndex, options);
		case 'sendTyping':
			return sendTyping(ctx, runtime, sp, itemIndex, options);
		case 'setBackground':
			return setBackground(ctx, session, itemIndex, options);
		case 'createGroup':
			return createGroup(ctx, runtime, sp, itemIndex, options);
		case 'sendGroupAlbum':
			return sendGroupAlbum(ctx, runtime, sp, itemIndex, options);
		default:
			throw new NodeOperationError(
				ctx.getNode(),
				`Unknown iMessage operation "${operation}"`,
				{ itemIndex },
			);
	}
}

async function sendMessage(
	ctx: IExecuteFunctions,
	runtime: SpectrumSession['runtime'],
	sp: SpectrumModule,
	imessageModule: NonNullable<SpectrumSession['imessageModule']>,
	effectBuilder: NonNullable<SpectrumSession['effect']>,
	itemIndex: number,
	options: NodeMessagingOptions,
): Promise<IDataObject> {
	const recipients = splitAddresses(ctx.getNodeParameter('recipients', itemIndex) as string);
	const message = ctx.getNodeParameter('text', itemIndex) as string;
	const space = await resolveSpace(runtime, recipients, getSpacePhone(options));
	const linkPreview = options.linkPreview !== false;

	let content: unknown = textContent(sp, message, linkPreview);
	const expert = ctx.getNodeParameter('showExpertOptions', itemIndex, false) as boolean;
	const effect = expert ? ((options.effect ?? 'none') as IMessageEffect) : 'none';
	if (effect && effect !== 'none') {
		const effectValue = resolveEffect(imessageModule.imessage, effect, ctx.logger);
		if (effectValue) content = effectBuilder(content, effectValue);
	}

	const result = await space.send(content as Parameters<typeof space.send>[0]);
	return {
		platform: 'imessage',
		spaceId: space.id,
		messageId: (result as { id?: string } | undefined)?.id,
	};
}

async function sendAttachmentOrVoice(
	ctx: IExecuteFunctions,
	runtime: SpectrumSession['runtime'],
	sp: SpectrumModule,
	operation: string,
	itemIndex: number,
	options: NodeMessagingOptions,
): Promise<IDataObject> {
	const recipients = splitAddresses(ctx.getNodeParameter('recipients', itemIndex) as string);
	const space = await resolveSpace(runtime, recipients, getSpacePhone(options));
	const kind: FileBuilderKind = operation === 'sendVoice' ? 'voice' : 'attachment';
	const content = await buildFileContent(ctx, sp, itemIndex, options, kind);

	const result = await space.send(content as Parameters<typeof space.send>[0]);
	return { platform: 'imessage', spaceId: space.id, messageId: (result as { id?: string } | undefined)?.id };
}

async function sendRichLink(
	ctx: IExecuteFunctions,
	runtime: SpectrumSession['runtime'],
	sp: SpectrumModule,
	itemIndex: number,
	options: NodeMessagingOptions,
): Promise<IDataObject> {
	const recipients = splitAddresses(ctx.getNodeParameter('recipients', itemIndex) as string);
	const url = ctx.getNodeParameter('url', itemIndex) as string;
	const space = await resolveSpace(runtime, recipients, getSpacePhone(options));
	const result = await space.send(sp.richlink(url) as Parameters<typeof space.send>[0]);
	return { platform: 'imessage', spaceId: space.id, messageId: (result as { id?: string } | undefined)?.id };
}

async function editMessage(
	ctx: IExecuteFunctions,
	runtime: SpectrumSession['runtime'],
	sp: SpectrumModule,
	itemIndex: number,
	options: NodeMessagingOptions,
): Promise<IDataObject> {
	const recipients = splitAddresses(ctx.getNodeParameter('targetRecipients', itemIndex) as string);
	const targetId = ctx.getNodeParameter('targetMessageId', itemIndex) as string;
	const newText = ctx.getNodeParameter('editText', itemIndex) as string;
	const space = await resolveSpace(runtime, recipients, getSpacePhone(options), 'Conversation With');
	const target = (await space.getMessage(targetId)) as Parameters<typeof sp.edit>[1];
	await space.send(sp.edit(sp.text(newText), target) as Parameters<typeof space.send>[0]);
	return { platform: 'imessage', spaceId: space.id, editedId: targetId };
}

async function replyToMessage(
	ctx: IExecuteFunctions,
	runtime: SpectrumSession['runtime'],
	sp: SpectrumModule,
	itemIndex: number,
	options: NodeMessagingOptions,
): Promise<IDataObject> {
	const recipients = splitAddresses(ctx.getNodeParameter('targetRecipients', itemIndex) as string);
	const targetId = ctx.getNodeParameter('targetMessageId', itemIndex) as string;
	const replyText = String(ctx.getNodeParameter('replyText', itemIndex, '')).trim();
	const space = await resolveSpace(runtime, recipients, getSpacePhone(options), 'Conversation With');
	const target = (await space.getMessage(targetId)) as Parameters<typeof sp.reply>[1];
	const linkPreview = options.replyLinkPreview !== false;

	const inner: unknown[] = [];
	if (replyText) inner.push(textContent(sp, replyText, linkPreview));

	const attachment = await buildOptionalFileContent(ctx, sp, itemIndex, options);
	if (attachment) inner.push(attachment);

	if (inner.length === 0) {
		throw new NodeOperationError(
			ctx.getNode(),
			'Reply requires text or a file',
			{ itemIndex },
		);
	}

	const wrapped = inner.map(
		(content) => sp.reply(content as Parameters<typeof sp.reply>[0], target) as unknown,
	);
	const result =
		wrapped.length === 1
			? await space.send(wrapped[0] as Parameters<typeof space.send>[0])
			: await (space.send as (...args: unknown[]) => Promise<unknown>)(...wrapped);
	const ids = Array.isArray(result)
		? (result as Array<{ id?: string }>).map((row) => row?.id).filter(Boolean)
		: [(result as { id?: string } | undefined)?.id].filter(Boolean);
	return { platform: 'imessage', spaceId: space.id, messageIds: ids, messageId: ids[0] };
}

async function reactToMessage(
	ctx: IExecuteFunctions,
	runtime: SpectrumSession['runtime'],
	itemIndex: number,
	options: NodeMessagingOptions,
): Promise<IDataObject> {
	const recipients = splitAddresses(ctx.getNodeParameter('targetRecipients', itemIndex) as string);
	const targetId = ctx.getNodeParameter('targetMessageId', itemIndex) as string;
	const reactionRaw = ctx.getNodeParameter('reaction', itemIndex) as string;
	const reaction =
		reactionRaw === '__custom__'
			? (ctx.getNodeParameter('reactionCustom', itemIndex) as string)
			: reactionRaw;
	if (!reaction) {
		throw new NodeOperationError(ctx.getNode(), 'Reaction is required', { itemIndex });
	}
	const space = await resolveSpace(runtime, recipients, getSpacePhone(options), 'Conversation With');
	const target = await space.getMessage(targetId);
	await target.react(reaction);
	return { platform: 'imessage', spaceId: space.id, targetId, reaction };
}

async function sendTyping(
	ctx: IExecuteFunctions,
	runtime: SpectrumSession['runtime'],
	sp: SpectrumModule,
	itemIndex: number,
	options: NodeMessagingOptions,
): Promise<IDataObject> {
	const recipients = splitAddresses(ctx.getNodeParameter('recipients', itemIndex) as string);
	const typingAction = (options.typingAction ??
		ctx.getNodeParameter('typingAction', itemIndex, 'start')) as 'start' | 'stop';
	const space = await resolveSpace(runtime, recipients, getSpacePhone(options));
	await space.send(sp.typing(typingAction) as Parameters<typeof space.send>[0]);
	return {
		platform: 'imessage',
		spaceId: space.id,
		typing: typingAction,
	};
}

async function createGroup(
	ctx: IExecuteFunctions,
	runtime: SpectrumSession['runtime'],
	sp: SpectrumModule,
	itemIndex: number,
	options: NodeMessagingOptions,
): Promise<IDataObject> {
	const recipients = splitAddresses(ctx.getNodeParameter('recipients', itemIndex) as string);
	if (recipients.length < 2) {
		throw new NodeOperationError(
			ctx.getNode(),
			'Create Group requires at least two recipients (comma-separated phone numbers)',
			{ itemIndex },
		);
	}
	const space = await resolveSpace(runtime, recipients, getSpacePhone(options));
	const welcome = String(ctx.getNodeParameter('groupWelcomeMessage', itemIndex, '')).trim();
	let messageId: string | undefined;
	if (welcome) {
		const result = await space.send(sp.text(welcome) as Parameters<typeof space.send>[0]);
		messageId = (result as { id?: string } | undefined)?.id;
	}
	return {
		platform: 'imessage',
		spaceId: space.id,
		type: 'group',
		messageId,
	};
}

async function sendGroupAlbum(
	ctx: IExecuteFunctions,
	runtime: SpectrumSession['runtime'],
	sp: SpectrumModule,
	itemIndex: number,
	options: NodeMessagingOptions,
): Promise<IDataObject> {
	const recipients = splitAddresses(ctx.getNodeParameter('recipients', itemIndex) as string);
	const space = await resolveSpace(runtime, recipients, getSpacePhone(options));
	const source = options.groupAttachmentSource ?? 'path';
	const items: unknown[] = [];

	const caption = options.groupCaption?.trim();
	if (caption) items.push(sp.text(caption));

	if (source === 'path') {
		const paths = splitList(options.groupFilePaths);
		if (paths.length < 2) {
			throw new NodeOperationError(
				ctx.getNode(),
				'Send Album requires at least two file paths (comma-separated in Options)',
				{ itemIndex },
			);
		}
		for (const filePath of paths) {
			items.push(sp.attachment(filePath));
		}
	} else {
		const properties = splitList(options.groupBinaryProperties);
		if (properties.length < 2) {
			throw new NodeOperationError(
				ctx.getNode(),
				'Send Album requires at least two binary properties (comma-separated in Options)',
				{ itemIndex },
			);
		}
		for (const property of properties) {
			const binary = await ctx.helpers.getBinaryDataBuffer(itemIndex, property);
			const binaryMeta = ctx.helpers.assertBinaryData(itemIndex, property);
			items.push(
				sp.attachment(binary, {
					name: binaryMeta.fileName || 'file',
					mimeType: binaryMeta.mimeType,
				}),
			);
		}
	}

	if (items.length < 2) {
		throw new NodeOperationError(ctx.getNode(), 'Send Album requires at least two items', {
			itemIndex,
		});
	}

	const result = await space.send(
		(sp.group as (...parts: unknown[]) => unknown)(...items) as Parameters<typeof space.send>[0],
	);
	return {
		platform: 'imessage',
		spaceId: space.id,
		messageId: (result as { id?: string } | undefined)?.id,
		itemCount: items.length,
	};
}

async function sendCustom(
	ctx: IExecuteFunctions,
	runtime: SpectrumSession['runtime'],
	sp: SpectrumModule,
	itemIndex: number,
	options: NodeMessagingOptions,
): Promise<IDataObject> {
	const recipients = splitAddresses(ctx.getNodeParameter('recipients', itemIndex) as string);
	const payload = options.customPayload ?? {};
	const space = await resolveSpace(runtime, recipients, getSpacePhone(options));
	const result = await space.send(
		(sp.custom as (raw: unknown) => unknown)(payload) as Parameters<typeof space.send>[0],
	);
	return { platform: 'imessage', spaceId: space.id, messageId: (result as { id?: string } | undefined)?.id };
}

async function createPoll(
	ctx: IExecuteFunctions,
	runtime: SpectrumSession['runtime'],
	sp: SpectrumModule,
	itemIndex: number,
	options: NodeMessagingOptions,
): Promise<IDataObject> {
	const recipients = splitAddresses(ctx.getNodeParameter('recipients', itemIndex) as string);
	const title = options.pollTitle ?? '';
	const pollOptions = pollOptionsFromParameter(ctx, itemIndex);
	if (!title || pollOptions.length < 2) {
		throw new NodeOperationError(
			ctx.getNode(),
			'Poll title and at least 2 options are required',
			{ itemIndex },
		);
	}
	const space = await resolveSpace(runtime, recipients, getSpacePhone(options));
	const result = await space.send(
		(sp.poll as (...args: unknown[]) => unknown)(title, ...pollOptions) as Parameters<
			typeof space.send
		>[0],
	);
	return {
		platform: 'imessage',
		spaceId: space.id,
		messageId: (result as { id?: string } | undefined)?.id,
		title,
		options: pollOptions,
	};
}

async function shareContact(
	ctx: IExecuteFunctions,
	runtime: SpectrumSession['runtime'],
	sp: SpectrumModule,
	itemIndex: number,
	options: NodeMessagingOptions,
): Promise<IDataObject> {
	const recipients = splitAddresses(ctx.getNodeParameter('recipients', itemIndex) as string);
	const space = await resolveSpace(runtime, recipients, getSpacePhone(options));
	const source = options.contactSource ?? 'structured';

	let contactContent: unknown;
	if (source === 'vcard') {
		const vcard = options.vcard?.trim();
		if (!vcard) {
			throw new NodeOperationError(ctx.getNode(), 'vCard is required', { itemIndex });
		}
		contactContent = sp.contact(vcard);
	} else {
		const phones = (options.contactPhones ?? '')
			.split(',')
			.map((value) => value.trim())
			.filter(Boolean);
		for (const phone of phones) {
			assertPhoneRecipient(phone, 'Contact Phones');
		}
		const emails = (options.contactEmails ?? '')
			.split(',')
			.map((value) => value.trim())
			.filter(Boolean);
		const phoneEntries = phones.map((value) => ({ value }));
		const emailEntries = emails.map((value) => ({ value }));
		const orgName = options.contactOrg?.trim();
		const input: Record<string, unknown> = {
			name: {
				first: options.contactFirst || undefined,
				last: options.contactLast || undefined,
			},
		};
		if (phoneEntries.length > 0) input.phones = phoneEntries;
		if (emailEntries.length > 0) input.emails = emailEntries;
		if (orgName) input.org = { name: orgName };
		contactContent = (sp.contact as (input: unknown) => unknown)(input);
	}

	const result = await space.send(contactContent as Parameters<typeof space.send>[0]);
	return { platform: 'imessage', spaceId: space.id, messageId: (result as { id?: string } | undefined)?.id };
}

async function setBackground(
	ctx: IExecuteFunctions,
	session: SpectrumSession,
	itemIndex: number,
	options: NodeMessagingOptions,
): Promise<IDataObject> {
	const backgroundBuilder = session.background;
	if (!backgroundBuilder) {
		throw new NodeOperationError(ctx.getNode(), 'Background builder is not loaded', { itemIndex });
	}

	const recipients = splitAddresses(ctx.getNodeParameter('recipients', itemIndex) as string);
	const space = await resolveSpace(session.runtime, recipients, getSpacePhone(options));
	const source = ctx.getNodeParameter('backgroundSource', itemIndex, 'path') as
		| 'path'
		| 'binary'
		| 'clear';

	if (source === 'clear') {
		await space.send(backgroundBuilder('clear') as Parameters<typeof space.send>[0]);
		return withBackgroundMeta({ platform: 'imessage', spaceId: space.id, background: 'clear' }, space);
	}

	if (source === 'path') {
		const path = ctx.getNodeParameter('backgroundPath', itemIndex, '') as string;
		if (!path.trim()) {
			throw new NodeOperationError(ctx.getNode(), 'Background file path is required', { itemIndex });
		}
		await space.send(backgroundBuilder(path) as Parameters<typeof space.send>[0]);
		return withBackgroundMeta(
			{ platform: 'imessage', spaceId: space.id, background: 'set', source: path },
			space,
		);
	}

	const property = ctx.getNodeParameter('backgroundBinary', itemIndex, 'data') as string;
	const mime = ctx.getNodeParameter('backgroundMime', itemIndex, '') as string;
	const binary = await ctx.helpers.getBinaryDataBuffer(itemIndex, property);
	const binaryMeta = ctx.helpers.assertBinaryData(itemIndex, property);
	await space.send(
		backgroundBuilder(binary, { mimeType: mime || binaryMeta.mimeType }) as Parameters<
			typeof space.send
		>[0],
	);
	return withBackgroundMeta(
		{ platform: 'imessage', spaceId: space.id, background: 'set', source: 'binary' },
		space,
	);
}

function withBackgroundMeta(result: IDataObject, space: { phone?: string }): IDataObject {
	const linePhone = space.phone && space.phone !== 'shared' ? space.phone : undefined;
	return linePhone ? { ...result, linePhone } : result;
}
