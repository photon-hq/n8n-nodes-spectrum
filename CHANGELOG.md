# Changelog

## Unreleased

- Per-phone routing: trigger exposes `$json.phone` (space line); action node maps to `im.space(user, { phone })`
- Outbound actions: Send, Reply, React, Show Typing, Group (create chat + send album)
- Send UX: text/file/poll/contact formats; link preview toggle (enableLinkPreview); voice note as file option
- iMessage-only scope: remove Slack from trigger filters, docs, and non-iMessage webhook delivery
- Reject Apple ID email for outbound; require E.164 phone numbers with clear errors

## 1.0.0

- Photon Spectrum Cloud trigger with webhook registration and HMAC verification
- Photon Spectrum Cloud API credential (Project ID + API Key)
