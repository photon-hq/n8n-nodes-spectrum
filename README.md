# n8n-nodes-spectrum

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

n8n community node for [Photon Spectrum Cloud](https://photon.codes/spectrum). Manage platforms, users, webhooks, and multi-channel configuration from n8n workflows. Real-time events arrive via Spectrum webhooks — no polling.

## What you get

- **Action node — Spectrum by Photon**: full Spectrum Cloud REST API (platforms, users, webhooks, Slack, WhatsApp Business, Voice, billing, lines, tokens)
- **Trigger node — Spectrum by Photon Trigger**: real-time webhook delivery with HMAC-SHA256 verification; webhook registration and removal on workflow activate/deactivate

## Compatibility

- n8n 1.x
- Node.js ≥ 20.15

## Prerequisites

A [Photon](https://photon.codes) account.

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

## Credentials

Create a **Photon Spectrum Cloud API** credential in n8n.

### Browser sign-in (recommended)

1. Click **Save** — a sign-in link and approval code appear
2. Open the link in your browser and approve
3. Click **Retry** at the top of the credential panel (not Save)

On first connect, an isolated **n8n Spectrum** project is created on your Photon account.

### Manual fallback

Enable **Use Project ID & Secret** and paste credentials from [app.photon.codes](https://app.photon.codes) → Settings.

## Example workflows

Import these from the [workflows/](workflows/) folder:

| Workflow | Description |
|----------|-------------|
| [enable-imessage-platform.json](workflows/enable-imessage-platform.json) | Enable the iMessage platform on your project |
| [trigger-on-messages.json](workflows/trigger-on-messages.json) | Trigger on inbound Spectrum message webhooks |
| [register-webhook.json](workflows/register-webhook.json) | Register a custom webhook URL via the action node |

Replace `REPLACE_WITH_CREDENTIAL_ID` with your credential before running.

## Nodes

### Spectrum by Photon

Manage your Spectrum Cloud project. Resource pickers load live data from your project where possible.

Resources: **Project**, **Billing**, **Platform**, **iMessage**, **Line**, **User**, **Webhook**, **Slack**, **WhatsApp Business**, **Voice**.

See the [Spectrum Cloud OpenAPI](https://spectrum.photon.codes/openapi/json) for the full API surface.

### Spectrum by Photon Trigger

Registers your n8n webhook URL with Spectrum when the workflow is activated. Spectrum pushes events to n8n — there is no polling trigger.

| Parameter | Description |
|-----------|-------------|
| **Events** | `messages` or all events |
| **Content Types** | Filter message payloads by content type |
| **Signing Secret** | Optional override; stored automatically on registration |
| **Platform** | iMessage, Slack, WhatsApp Business, Voice, or any |
| **Ignore Outbound Messages** | Skip messages sent by your project |

#### Trigger output (messages event)

| Field | Description |
|-------|-------------|
| `event` | Webhook event type (`messages`) |
| `messageId` | Spectrum message ID |
| `platform` | Normalized platform key |
| `direction` | `inbound` or `outbound` |
| `spaceId` | Conversation space ID |
| `spaceType` | `dm` or `group` when inferrable |
| `sender` | Sender address |
| `contentType` | Message content type |
| `text` | Text body when `contentType` is `text` |
| `attachment` | Attachment metadata when applicable |
| `raw` | Full Spectrum webhook payload |

## Related packages

- [n8n-nodes-imessage](https://github.com/photon-hq/n8n-nodes-imessage) — send and receive iMessages via the Spectrum runtime SDK
- [spectrum-ts](https://github.com/photon-hq/spectrum-ts) — TypeScript SDK for building Spectrum agents

## Resources

- [Photon Spectrum](https://photon.codes/spectrum)
- [Spectrum Docs](https://docs.photon.codes/spectrum-ts/getting-started)
- [Spectrum Webhooks](https://docs.photon.codes/webhooks/overview)
- [Spectrum Cloud OpenAPI](https://spectrum.photon.codes/openapi/json)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)

## Version history

See [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE)
