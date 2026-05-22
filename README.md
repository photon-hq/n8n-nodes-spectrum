# n8n-nodes-spectrum

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

n8n community node for [Photon Spectrum Cloud](https://photon.codes/spectrum). **Listen to incoming messages** and **manage users** from n8n workflows. Channel setup (iMessage, Slack, WhatsApp, etc.) happens in the [Spectrum dashboard](https://app.photon.codes).

## What you get

| Node | What it does |
|------|----------------|
| **Spectrum Trigger** | Starts a workflow when someone messages you — no polling, webhook registered automatically when you activate |
| **Spectrum** | Add or look up users, check which channels are enabled, troubleshoot webhooks |

**To send replies**, install the separate [n8n-nodes-imessage](https://github.com/photon-hq/n8n-nodes-imessage) package and connect it after the trigger.

## Getting started (non-technical)

### 1. Set up Spectrum (one time, in the browser)

1. Sign in at [app.photon.codes](https://app.photon.codes)
2. Create or open a project
3. Turn on the channels you need (iMessage, Slack, WhatsApp, etc.)
4. Go to **Settings** and copy your **Project ID** and **API Key**

### 2. Connect n8n

1. Install this package (see [Installation](#installation))
2. In n8n, go to **Credentials** → **New** → **Photon Spectrum Cloud API**
3. Paste **Project ID** and **API Key** → **Save** → **Test**

### 3. React to messages

1. Create a new workflow
2. Add **Spectrum by Photon Trigger** (starts as **On Spectrum Message**)
3. Select your credential
4. Leave defaults — **Messages**, **Text**, ignore outbound — unless you need filters
5. Connect the next node:
   - **Reply on iMessage:** add **iMessage by Photon** → **Reply to Message** (fields auto-fill from the trigger)
   - **Your own logic:** use `$json.text`, `$json.sender`, `$json.messageId` in the next node
6. **Activate** the workflow — n8n registers the webhook with Spectrum automatically

Import [workflows/trigger-on-messages.json](workflows/trigger-on-messages.json) or [workflows/add-user-from-message.json](workflows/add-user-from-message.json) for starter templates.

### 4. Add users from a workflow (optional)

Use the **Spectrum by Photon** action node → **User** → **Create User** when you want to add people automatically (e.g. from a signup form or CRM), instead of adding them manually in the dashboard.

## Compatibility

- n8n 1.x
- Node.js ≥ 20.15

## Installation

Follow the [n8n community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

```bash
npm install n8n-nodes-spectrum
```

## Development

```bash
npm install
npm run build
npm run dev
npm run scan
```

## Nodes

### Spectrum by Photon Trigger

Runs when Spectrum sends a message event to n8n.

| Parameter | Description |
|-----------|-------------|
| **Events** | Usually **Messages** |
| **Content Types** | Optional filter (text only, photos, etc.) |
| **Filters → Ignore Outbound** | Skip messages your automations sent (on by default) |
| **Filters → Platform** | Optional — iMessage, Slack, WhatsApp, etc. |
| **Filters → Sender Address** | Optional — only this person’s messages |

**Output fields:** `text`, `sender`, `platform`, `direction`, `contentType`, `messageId`, `spaceId`, plus full payload in `raw`.

### Spectrum by Photon

| Resource | Operations | When to use |
|----------|------------|-------------|
| **User** | Create, List, Get, Delete | Automate adding people to your project |
| **Platform** | Get Platforms | Check which channels are enabled in a workflow |
| **Webhook** | List Webhooks | Troubleshoot — the Trigger registers webhooks for you |

Everything else (connecting Slack, WhatsApp templates, phone lines, billing) is done in the [Spectrum dashboard](https://app.photon.codes).

## Related packages

- [n8n-nodes-imessage](https://github.com/photon-hq/n8n-nodes-imessage) — **send and receive iMessages** (use with this trigger)
- [spectrum-ts](https://github.com/photon-hq/spectrum-ts) — TypeScript SDK for custom apps

## Resources

- [Photon Spectrum](https://photon.codes/spectrum)
- [Spectrum Docs](https://docs.photon.codes/spectrum-ts/getting-started)
- [Spectrum Webhooks](https://docs.photon.codes/webhooks/overview)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)

## Version history

See [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE)
