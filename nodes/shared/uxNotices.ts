export const DASHBOARD_URL = 'https://app.photon.codes';

/** Expression defaults — match Spectrum Trigger output (see webhookPayload.ts). */
export const FROM_SENDER = '={{ $json.sender || $json.phoneNumber || $json.phone }}';
export const FROM_MESSAGE_ID = '={{ $json.messageId }}';
export const FROM_TEXT = '={{ $json.text }}';

export const TO_IMESSAGE_SEND =
	'<b>Who to message:</b> A phone number in E.164 format (e.g. <code>+15551234567</code>) or an Apple ID email (e.g. <code>alice@icloud.com</code>). After <b>Spectrum Trigger</b>, leave the default <code>{{ $json.sender }}</code>.';

export const TO_SLACK_SEND =
	'<b>Who to message:</b> A Slack member ID (starts with <code>U</code>, e.g. <code>U012AB3CD</code>), a channel ID (starts with <code>C</code>), or a channel name (e.g. <code>#general</code>). After <b>Spectrum Trigger</b>, leave the default <code>{{ $json.sender }}</code> — that is whoever DM’d you.';

export const TO_IMESSAGE_REPLY =
	'<b>Reply to:</b> Same person who sent the inbound message — usually <code>{{ $json.sender }}</code> from the trigger (their phone or email).';

export const TO_SLACK_REPLY =
	'<b>Reply to:</b> The Slack member who messaged you — use <code>{{ $json.sender }}</code> from the trigger (their Slack user ID, e.g. <code>U012AB3CD</code>).';

export const TRIGGER_QUICK_START =
	'<b>Quick start:</b> Add credentials → connect <b>Spectrum by Photon</b> to reply → toggle this workflow <b>Active</b>. Inbound text exposes <code>$json.text</code>, <code>$json.sender</code>, and <code>$json.messageId</code>.';

export const TRIGGER_REPLY_HINT =
	'<b>Want to reply?</b> Wire this → <b>Spectrum by Photon</b> → pick your platform → <b>Reply to Message</b>. Fields auto-fill from the trigger.';

export const TRIGGER_WEBHOOK_HINT =
	'<b>n8n Cloud:</b> toggle Active and you are done — n8n provides a public webhook URL automatically. ' +
	'<b>Local dev:</b> run <code>npm run dev</code> in this repo — ngrok starts automatically so Spectrum can reach your trigger.';

export const TRIGGER_WEBHOOK_SCOPE =
	'<b>Text only:</b> this trigger runs on inbound text messages. Photos, files, polls, and reactions are not supported until Spectrum adds webhook delivery with downloadable content.';

export const ACTION_QUICK_START =
	`<b>Quick start:</b> Turn on channels in the <a href="${DASHBOARD_URL}" target="_blank">Spectrum dashboard</a>, then pick a platform below. Wire after <b>Spectrum Trigger</b> to auto-reply.`;

export const ACTION_REPLY_HINT =
	'Pre-filled from Spectrum Trigger when this node is wired right after <b>On Spectrum Message</b>.';

export const CREDENTIAL_QUICK_START =
	`<b>Quick start:</b> Open <a href="${DASHBOARD_URL}" target="_blank">app.photon.codes</a> → your project → <b>Settings</b> → copy <b>Project ID</b> and <b>API Key</b> below → Save → Test.`;
