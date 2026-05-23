# n8n-nodes-spectrum

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

n8n community node for [Photon Spectrum Cloud](https://photon.codes/spectrum). **Listen to incoming messages** and **send replies on iMessage** from n8n workflows. Channel setup happens in the [Spectrum dashboard](https://app.photon.codes).

## What you get

| Node | What it does |
|------|----------------|
| **Spectrum Trigger** | Starts a workflow when someone sends a **text** message (iMessage or Slack inbound) |
| **Spectrum** | Send, reply, and react on iMessage — advanced content types live under **Options** |

## Getting started

1. Set up your project at [app.photon.codes](https://app.photon.codes) and copy **Project ID** + **API Key**
2. Install this package and add **Photon Spectrum Cloud API** credentials in n8n
3. Add **Spectrum Trigger** → **Spectrum** → **Reply** — activate the workflow

Import [workflows/trigger-on-messages.json](workflows/trigger-on-messages.json) for a starter template.

## Spectrum by Photon (action)

**Platform:** iMessage (Slack send coming when the SDK adds a provider)

**Actions:**
- **Send** — text by default; set Content Type in **Options** for attachments, voice, rich links, polls, etc.
- **Reply** — threaded reply after the trigger
- **React** — iMessage tapbacks

**Options** collection holds effects, file paths, poll fields, custom JSON, and other advanced settings.

## Spectrum Trigger

Inbound **text only** — photos, files, polls, and reactions are ignored until Spectrum ships downloadable webhook payloads.

Output: `$json.text`, `$json.sender`, `$json.messageId`, `$json.platform`, `$json.spaceId`

Filters: platform, sender, DM vs group

## Development

```bash
npm install
npm run build
npm run dev          # local: auto-starts ngrok/cloudflared + sets WEBHOOK_URL
npm run dev:local    # local without tunnel (outbound action node only)
```

**n8n Cloud:** install the published package — n8n already provides a public webhook URL; no tunnel needed.

**Local trigger testing:** `npm run dev` detects local mode and starts ngrok (or cloudflared) automatically. Toggle the workflow **Active** or click **Test this trigger**, then iMessage your dedicated line.

Install a tunnel tool if needed: `brew install ngrok` (recommended) or `brew install cloudflared`.

## License

[MIT](LICENSE)
