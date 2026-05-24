const EXT_TO_MIME: Record<string, string> = {
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
	'.heic': 'image/heic',
	'.pdf': 'application/pdf',
	'.txt': 'text/plain',
	'.csv': 'text/csv',
	'.json': 'application/json',
	'.mp3': 'audio/mpeg',
	'.m4a': 'audio/mp4',
	'.wav': 'audio/wav',
	'.mp4': 'video/mp4',
	'.mov': 'video/quicktime',
	'.zip': 'application/zip',
	'.vcf': 'text/vcard',
};

function fileExtension(filePath: string): string {
	const normalized = filePath.trim().replace(/\\/g, '/');
	const base = normalized.slice(normalized.lastIndexOf('/') + 1);
	const dot = base.lastIndexOf('.');
	return dot >= 0 ? base.slice(dot).toLowerCase() : '';
}

export function inferFileNameFromPath(filePath: string): string {
	const normalized = filePath.trim().replace(/\\/g, '/');
	return normalized.slice(normalized.lastIndexOf('/') + 1);
}

export function inferMimeFromPath(filePath: string): string | undefined {
	return EXT_TO_MIME[fileExtension(filePath)];
}

export function resolveAttachmentMeta(
	filePath: string,
	overrides: { fileName?: string; mimeType?: string },
	binaryMeta?: { fileName?: string; mimeType?: string },
): { name?: string; mimeType?: string } {
	const meta: { name?: string; mimeType?: string } = {};

	const name =
		overrides.fileName?.trim() ||
		binaryMeta?.fileName?.trim() ||
		(filePath.trim() ? inferFileNameFromPath(filePath) : undefined);
	if (name) meta.name = name;

	const mimeType =
		overrides.mimeType?.trim() ||
		binaryMeta?.mimeType?.trim() ||
		(filePath.trim() ? inferMimeFromPath(filePath) : undefined);
	if (mimeType) meta.mimeType = mimeType;

	return meta;
}
