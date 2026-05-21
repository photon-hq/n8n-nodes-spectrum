export interface SpectrumEnvelope<T> {
	succeed?: boolean;
	data: T;
}

export interface IMessageInfoData {
	type: 'shared' | 'dedicated';
}

export interface PlatformStatusMap {
	imessage?: { enabled?: boolean };
	whatsapp_business?: { enabled?: boolean };
	slack?: { enabled?: boolean };
	voice?: { enabled?: boolean };
}
