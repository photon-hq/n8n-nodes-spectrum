import type { PhotonSpectrumCloudApiCredentials } from '../credentials';

export type MessagingPlatform = 'imessage';

export type SpectrumCredentials = PhotonSpectrumCloudApiCredentials;

export const TAPBACKS = [
	'love',
	'like',
	'dislike',
	'laugh',
	'emphasize',
	'question',
] as const;

export type NamedTapback = (typeof TAPBACKS)[number];

export const BUBBLE_EFFECTS = ['slam', 'loud', 'gentle', 'invisible'] as const;
export type BubbleEffect = (typeof BUBBLE_EFFECTS)[number];

export const SCREEN_EFFECTS = [
	'confetti',
	'fireworks',
	'balloons',
	'heart',
	'lasers',
	'celebration',
	'sparkles',
	'spotlight',
	'echo',
] as const;
export type ScreenEffect = (typeof SCREEN_EFFECTS)[number];

export type IMessageEffect = ScreenEffect | BubbleEffect | 'none';

export interface ResolvedSpace {
	id: string;
	phone?: string;
	type?: string;
	send: (content: unknown) => Promise<{ id?: string } | undefined>;
	responding: <T>(fn: () => T | Promise<T>) => Promise<T>;
	getMessage: (id: string) => Promise<{
		id: string;
		react: (emoji: string) => Promise<void>;
	}>;
}

export interface PlatformRuntime {
	user: (id: string) => Promise<{ id: string }>;
	space: (...args: unknown[]) => Promise<unknown>;
}
