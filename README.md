# n8n-nodes-spectrum

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

n8n community node for [Photon Spectrum Cloud](https://photon.codes/spectrum). **Listen to inbound text** and **send on iMessage** from n8n workflows. Channel setup happens in the [Spectrum dashboard](https://app.photon.codes).

## What you get

| Node | What it does |
|------|----------------|
| **Spectrum Trigger** | Starts a workflow when an inbound **text message** is received (default name: **On Spectrum Message**) |
| **Spectrum** | **Send a message**, **Send an attachment**, **Reply in thread**, **React**, **Voice note**, **Poll**, **Contact card** |
| **Spectrum Typing Indicator** | Start or stop the typing indicator in a thread |

## Getting started

1. Set up your project at [app.photon.codes](https://app.photon.codes) and copy **Project ID** + **API Key**
2. Install this package and add **Photon Spectrum Cloud API** credentials in n8n
3. Add **Spectrum Trigger** -> **Spectrum** -> **Reply in thread**, then activate the workflow

Import [workflows/trigger-on-messages.json](workflows/trigger-on-messages.json) for a starter template.

## Install in n8n

**n8n Cloud or self-hosted (recommended):**

1. Open **Settings → Community Nodes**
2. Select **Install a community node**
3. Enter `n8n-nodes-spectrum` and confirm
4. Restart n8n if prompted, then search the node panel for **Spectrum**, **On Spectrum Message**, or **Spectrum Typing Indicator**

**Self-hosted (manual):**

```bash
npm install n8n-nodes-spectrum
```

Set `N8N_COMMUNITY_PACKAGES` or use the Community Nodes UI so n8n loads the package on startup.

## Spectrum by Photon (action - iMessage outbound)

| Action | What it does |
|--------|----------------|
| **Send a message** | Plain text with optional link preview |
| **Send an attachment** | Photo, PDF, or other file - from the previous step or a saved file |
| **Reply in thread** | Threaded reply to an inbound message |
| **React to a message** | iMessage tapback |
| **Send voice note** | Audio clip as a voice note (file path or binary) |
| **Send rich link** | URL as an iMessage rich link card |
| **Edit message** | Replace text on a message you sent |
| **Create poll** | Poll with title and sortable options |
| **Share contact card** | Structured fields or vCard |
| **Set chat background** | Set, upload, or clear the thread background |
| **Show Expert Options** | Message effects and optional reply attachments |

**Spectrum Typing Indicator** node: start or stop typing in a thread.

**Link preview:** For text sends, enable **Link Preview** in Options - this turns on iMessage `enableLinkPreview` for URLs in the message (same path as [spectrum-ts rich links](https://photon.codes/docs/spectrum-ts/content#rich-links)).

## Spectrum Trigger (inbound - text only)

Spectrum webhooks deliver **inbound text only** today. Photos, files, polls, and reactions are not usable in n8n until Spectrum adds downloadable webhook payloads.

**Output:** `$json.text`, `$json.sender`, `$json.phone` (space line - same as `space.phone` in spectrum-ts), `$json.messageId`, `$json.platform`, `$json.spaceId`

**Line routing:** Leave **Line → Auto** (default) for trigger → reply flows. Pick **Dedicated Line** for cold sends on a specific number.

**Outbound:** Spectrum action nodes require **E.164 phone numbers** (`+15551234567`). Apple ID email is not supported for send/reply yet - contact [daniel@photon.codes](mailto:daniel@photon.codes) if you need that.

**Filters:** line phoneNumber, sender, space ID, DM vs group

## Development

```bash
npm install
npm run build
npm run dev          # local: auto-starts ngrok + sets WEBHOOK_URL
npm run dev:local    # local without tunnel (outbound action node only)
```

**Local trigger testing:** `npm run dev` starts ngrok automatically. Toggle the workflow **Active** or click **Test this trigger**, then text your dedicated line.

Install ngrok if needed: `brew install ngrok` then `ngrok config add-authtoken <token>`.

### `Unrecognized node type: CUSTOM.photonSpectrumTrigger`

Older local dev sessions registered nodes as `CUSTOM.photonSpectrumTrigger`. Current dev and npm installs use `n8n-nodes-spectrum.photonSpectrumTrigger`.

1. Run `npm run build` then `npm run dev` (or `npm run link:dev` if n8n is already running).
2. In the workflow, replace node types:
   - `CUSTOM.photonSpectrumTrigger` → `n8n-nodes-spectrum.photonSpectrumTrigger`
   - `CUSTOM.photonSpectrum` → `n8n-nodes-spectrum.photonSpectrum`
3. Or delete and re-add the **On Spectrum Message** / **Spectrum** nodes from the picker.

On n8n Cloud or self-hosted production, install **n8n-nodes-spectrum** from Community Nodes (Settings → Community Nodes).

## License

[MIT](LICENSE)
