# Privacy Policy — Prompt Gallery

**Last updated: May 2026**

Prompt Gallery is a Chrome browser extension that saves and organizes 
AI prompts locally on your device.

## Data Collection
Prompt Gallery does **not** collect, transmit, or store any personal 
data on external servers. All data (prompts, categories, settings) 
is stored exclusively on your local device using Chrome's built-in 
`chrome.storage.local` API.

## Data We Store (Locally Only)
- Prompts you choose to save
- Category and tag names you create
- Your theme preference (dark/light/system)

## Data We Do NOT Collect
- No personal information
- No browsing history
- No content from AI conversations
- No analytics or tracking
- No cookies

## Permissions
The extension requests only the minimum permissions required:
- **storage** — to save your prompts locally on your device
- **activeTab** — to insert prompts into the active AI input field
- **clipboardWrite** — to copy prompts to your clipboard on request

The save UI on AI websites is injected by declarative content scripts declared in 
the extension manifest (`content_scripts`). The extension does **not** use the 
Chrome `scripting` API and does not request the `scripting` permission.

## Third-Party Services
This extension does not use any third-party services, analytics 
platforms, or external APIs.

## Contact
For questions, open an issue at:
https://github.com/mahfuzswe/prompt-gallery