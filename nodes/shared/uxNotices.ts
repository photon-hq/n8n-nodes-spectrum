export const DASHBOARD_URL = 'https://app.photon.codes';

/** Shown when Apple ID email outbound is requested but not supported yet. */
export const EMAIL_OUTBOUND_CONTACT_PLAIN =
	'If you need Apple ID email outbound, contact daniel@photon.codes.';

export const EMAIL_OUTBOUND_CONTACT_HTML =
	'Need Apple ID email outbound? Email <a href="mailto:daniel@photon.codes">daniel@photon.codes</a>.';

/** Expression defaults — match Spectrum Trigger output (see webhookPayload.ts). */
export const FROM_SENDER = '={{ $json.phoneNumber || $json.phone || $json.sender }}';
export const FROM_MESSAGE_ID = '={{ $json.messageId }}';
export const FROM_TEXT = '={{ $json.text }}';

export const TO_IMESSAGE_SEND =
	'<b>Who to message:</b> E.164 phone number only (e.g. <code>+15551234567</code>). Apple ID email is not supported for outbound yet. ' +
	EMAIL_OUTBOUND_CONTACT_HTML +
	' After <b>Spectrum Trigger</b>, use <code>{{ $json.sender }}</code> when it is a phone number.';

export const TO_IMESSAGE_REPLY =
	'<b>Reply to:</b> E.164 phone of whoever sent the inbound message — usually <code>{{ $json.sender }}</code> from the trigger. Email Apple IDs cannot be used for outbound yet. ' +
	EMAIL_OUTBOUND_CONTACT_HTML;

export const TRIGGER_QUICK_START =
	'<b>Quick start:</b> Add credentials → connect <b>Spectrum by Photon</b> to reply → toggle this workflow <b>Active</b>. Inbound text exposes <code>$json.text</code>, <code>$json.sender</code>, and <code>$json.messageId</code>.';

export const TRIGGER_REPLY_HINT =
	'<b>Want to reply?</b> Wire this → <b>Spectrum by Photon</b> → <b>Reply</b>. Outbound requires an E.164 phone number — Apple ID email senders cannot be replied to yet. ' +
	EMAIL_OUTBOUND_CONTACT_HTML;

export const TRIGGER_SENDER_NOTE =
	'<b>Phone numbers only for outbound:</b> <code>$json.sender</code> must be a phone (e.g. <code>+15551234567</code>) to reply from n8n. Email-based Apple IDs are not supported by Spectrum outbound yet. ' +
	EMAIL_OUTBOUND_CONTACT_HTML;

export const TRIGGER_WEBHOOK_HINT =
	'<b>n8n Cloud:</b> toggle Active and you are done — n8n provides a public webhook URL automatically. ' +
	'<b>Local dev:</b> run <code>npm run dev</code> in this repo — ngrok starts automatically so Spectrum can reach your trigger.';

export const TRIGGER_WEBHOOK_SCOPE =
	'<b>iMessage text only:</b> this trigger runs on inbound iMessage text. Photos, files, polls, and reactions are not supported until Spectrum adds webhook delivery with downloadable content.';

export const ACTION_QUICK_START =
	'<b>Quick start:</b> Wire after <b>Spectrum Trigger</b> to auto-reply, or set <b>To</b> manually. Actions: Send, Reply, React, Show Typing, Group.';

export const ACTION_REPLY_HINT =
	'Pre-filled from Spectrum Trigger when this node is wired right after <b>On Spectrum Message</b>.';

export const CREDENTIAL_QUICK_START =
	`<b>Quick start:</b> Open <a href="${DASHBOARD_URL}" target="_blank">app.photon.codes</a> → your project → <b>Settings</b> → copy <b>Project ID</b> and <b>API Key</b> below → Save → Test.`;
