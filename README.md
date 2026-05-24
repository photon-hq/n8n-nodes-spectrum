# n8n-nodes-spectrum

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

n8n community node for [Photon Spectrum Cloud](https://photon.codes/spectrum). **Listen to inbound text** and **send on iMessage** from n8n workflows. Channel setup happens in the [Spectrum dashboard](https://app.photon.codes).

## What you get

| Node | What it does |
|------|----------------|
| **Spectrum Trigger** | Starts a workflow on inbound **iMessage text** (default name: **On iMessage Event**) |
| **Spectrum** | **Send a message**, **Send an attachment**, **Reply in thread**, **React to a message**, and more via **Show Expert Options** |

## Getting started

1. Set up your project at [app.photon.codes](https://app.photon.codes) and copy **Project ID** + **API Key**
2. Install this package and add **Photon Spectrum Cloud API** credentials in n8n
3. Add **Spectrum Trigger** → **Spectrum** → **Reply in thread** — activate the workflow

Import [workflows/trigger-on-messages.json](workflows/trigger-on-messages.json) for a starter template.

## Spectrum by Photon (action — iMessage outbound)

| Action | What it does |
|--------|----------------|
| **Send a message** | Plain text with optional link preview |
| **Send an attachment** | Photo, PDF, or other file — from the previous step or a saved file |
| **Reply in thread** | Threaded reply — wire after **On iMessage Event** |
| **React to a message** | iMessage tapback |
| **Show Expert Options** | Voice notes, polls, contact cards, typing indicator, effects |

**Link preview:** For text sends, enable **Link Preview** in Options — this turns on iMessage `enableLinkPreview` for URLs in the message (same path as [spectrum-ts rich links](https://photon.codes/docs/spectrum-ts/content#rich-links)).

## Spectrum Trigger (inbound — text only)

Spectrum webhooks deliver **inbound text only** today. Photos, files, polls, and reactions are not usable in n8n until Spectrum adds downloadable webhook payloads.

**Output:** `$json.text`, `$json.sender`, `$json.phone` (space line — same as `space.phone` in spectrum-ts), `$json.messageId`, `$json.platform`, `$json.spaceId`

**Line routing:** Leave **Line → Auto** (default) for trigger → reply flows. Pick **Dedicated Line** for cold sends on a specific number.

**Outbound:** Spectrum action nodes require **E.164 phone numbers** (`+15551234567`). Apple ID email is not supported for send/reply yet — contact [daniel@photon.codes](mailto:daniel@photon.codes) if you need that.

**Filters:** line phoneNumber, sender, space ID, DM vs group

## Development

```bash
npm install
npm run build
npm run dev          # local: auto-starts ngrok/cloudflared + sets WEBHOOK_URL
npm run dev:local    # local without tunnel (outbound action node only)
```

**Local trigger testing:** `npm run dev` starts ngrok automatically. Toggle the workflow **Active** or click **Test this trigger**, then text your dedicated line.

Install a tunnel tool if needed: `brew install ngrok` (recommended) or `brew install cloudflared`.

## License

[MIT](LICENSE)
