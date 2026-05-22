# Changelog

## Unreleased

- Simplify Photon Spectrum Cloud API credential to Project ID and API Key only; remove browser sign-in, auto-provisioning, and in-credential platform setup
- Focus action node on workflow automation (users, read-only platform status, webhook list); remove dashboard-only operations (Slack setup, Voice, WhatsApp templates, billing, lines, tokens)
- Add in-node onboarding notices, clearer descriptions for non-technical users, and updated getting-started README and example workflows
- Quick start notices and smart expression defaults (e.g. `$json.sender`) when nodes are wired after the trigger

## 1.0.0

- Photon Spectrum Cloud action node covering project, billing, platforms, iMessage, lines, users, webhooks, Slack, WhatsApp Business, and Voice
- Photon Spectrum Cloud trigger with automatic webhook registration, HMAC verification, and message event filters
- Photon Spectrum Cloud API credential with browser device sign-in and manual Project ID/Secret fallback
