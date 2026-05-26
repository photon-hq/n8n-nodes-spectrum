# n8n-nodes-spectrum

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

n8n community node for [Photon Spectrum Cloud](https://photon.codes/spectrum). Listen to inbound text messages and send on iMessage from n8n workflows. Configure lines and channels in the [Spectrum dashboard](https://app.photon.codes).

## Nodes

| Node | What it does |
|------|----------------|
| **On Spectrum Message** | Starts a workflow when an inbound text message is received |
| **Spectrum** | Send messages, attachments, replies, reactions, typing indicators, voice notes, rich links, polls, and more |

## Install

**n8n Cloud or self-hosted:**

1. Open **Settings → Community Nodes**
2. Choose **Install a community node**
3. Enter `n8n-nodes-spectrum` and confirm
4. Restart n8n if prompted, then search for **Spectrum** or **On Spectrum Message**

**Self-hosted (manual):**

```bash
npm install n8n-nodes-spectrum
```

Ensure n8n loads community packages on startup (Community Nodes UI or `N8N_COMMUNITY_PACKAGES`).

## Quick start

1. Create a project at [app.photon.codes](https://app.photon.codes) and copy **Project ID** and **API Key**
2. Add **Photon Spectrum Cloud API** credentials in n8n
3. Build **On Spectrum Message → Spectrum → Reply in thread** and activate the workflow

Import [workflows/trigger-on-messages.json](workflows/trigger-on-messages.json) for a starter template.

## Spectrum actions

| Action | What it does |
|--------|----------------|
| **Send a message** | Plain text; enable Link Preview in node options for URL previews |
| **Send an attachment** | Photo, PDF, or other file from the previous step or a saved file |
| **Reply in thread** | Threaded reply to an inbound message |
| **React to a message** | iMessage tapback |
| **Typing indicator** | Show or hide the typing indicator in a thread (Indicator: Start or Stop) |
| **Send voice note** | Audio clip as a voice note (file path or binary) |
| **Send rich link** | Send a URL as an iMessage rich link card |
| **Edit message** | Replace text on a message you sent |
| **Create poll** | Poll with title and sortable options |
| **Share contact card** | Structured fields or vCard |
| **Set chat background** | Set, upload, or clear the thread background |

Enable **Show Expert Options** on the node for message effects and optional reply attachments.

## On Spectrum Message (trigger)

Spectrum webhooks deliver inbound text messages. Attachments and other rich inbound types are coming soon.

When a message arrives, the trigger outputs:

- `$json.text` - message body
- `$json.sender` - who sent it
- `$json.phone` - line that received the message (E.164)
- `$json.messageId`, `$json.platform`, `$json.spaceId`

**Line routing:** Leave **Line → Auto** for trigger-to-reply flows. Choose **Dedicated Line** to filter or send from a specific number.

**Filters:** Line phone number, sender, space ID, DM vs group

**Outbound numbers:** Use E.164 format (`+15551234567`). Apple ID email routing for outbound is coming soon - contact [daniel@photon.codes](mailto:daniel@photon.codes) if you need it early.

## Development

For local work on this package:

```bash
npm install
npm run build
npm run dev        # ngrok tunnel for webhook testing
npm run dev:local  # no tunnel (outbound actions only)
```

Local trigger testing requires [ngrok](https://ngrok.com). With `npm run dev`, activate the workflow or use **Test this trigger**, then text your line.

## License

[MIT](LICENSE)
