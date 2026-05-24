export const SPECTRUM_CLOUD_URL = 'https://spectrum.photon.codes';

export const OPERATION_LABELS: Record<string, string> = {
	sendMessage: 'Send Message',
	sendAttachment: 'Send Attachment',
	replyToMessage: 'Reply',
	reactToMessage: 'React',
	sendTyping: 'Show Typing',
	createPoll: 'Create Poll',
	shareContact: 'Share Contact Card',
};

/** @deprecated Legacy operation values from saved workflows */
export const LEGACY_OPERATION_LABELS: Record<string, string> = {
	send: 'Send',
	reply: 'Reply',
	react: 'React',
	typing: 'Show Typing',
	group: 'Group',
};

export const SUBTITLE_BY_OPERATION: Record<string, string> = {
	...OPERATION_LABELS,
	...LEGACY_OPERATION_LABELS,
};
