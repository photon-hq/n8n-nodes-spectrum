export const DASHBOARD_URL = 'https://app.photon.codes';
export const IMESSAGE_NODE_URL = 'https://github.com/photon-hq/n8n-nodes-imessage';

/** Expression defaults — match Spectrum Trigger output (see webhookPayload.ts). */
export const FROM_SENDER = '={{ $json.sender || $json.phoneNumber || $json.phone }}';
export const FROM_MESSAGE_ID = '={{ $json.messageId }}';
export const FROM_TEXT = '={{ $json.text }}';

export const TRIGGER_QUICK_START =
	'<b>Quick start:</b> Add credentials → connect the next node to the output → toggle this workflow <b>Active</b>. Incoming messages expose <code>$json.text</code>, <code>$json.sender</code>, and <code>$json.messageId</code>.';

export const TRIGGER_REPLY_HINT =
	`<b>Want to reply?</b> Wire this → <b>iMessage by Photon</b> → <b>Reply to Message</b> — conversation and message ID auto-fill. <a href="${IMESSAGE_NODE_URL}" target="_blank">Install the iMessage node</a>.`;

export const TRIGGER_WEBHOOK_HINT =
	'<b>n8n Cloud:</b> toggle Active and you are done. <b>Local n8n:</b> your instance needs a public HTTPS URL so Spectrum can reach this webhook.';

export const ACTION_QUICK_START =
	`<b>Quick start:</b> Set up channels in the <a href="${DASHBOARD_URL}" target="_blank">Spectrum dashboard</a> first. Use <b>Spectrum Trigger</b> to react to messages; use this node to add or look up users.`;

export const ACTION_CREATE_USER_HINT =
	'<b>From a message?</b> Wire <b>Spectrum Trigger</b> → this node. Phone Number auto-fills from <code>$json.sender</code> (the person who texted you).';

export const ACTION_LIST_USERS_HINT =
	'Use this to check who is on your project, or branch your workflow based on the list.';

export const ACTION_PLATFORMS_HINT =
	'Read-only check — turn channels on or off in the <a href="' +
	DASHBOARD_URL +
	'" target="_blank">Spectrum dashboard</a>, not here.';

export const ACTION_WEBHOOKS_HINT =
	'The Trigger node registers its webhook automatically when you activate the workflow. Use this only if something looks wrong.';

export const CREDENTIAL_QUICK_START =
	`<b>Quick start:</b> Open <a href="${DASHBOARD_URL}" target="_blank">app.photon.codes</a> → your project → <b>Settings</b> → copy <b>Project ID</b> and <b>API Key</b> below → Save → Test.`;
