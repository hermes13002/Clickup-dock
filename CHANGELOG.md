# Changelog

All notable changes to the ClickUp Dock extension will be documented in this file.

## [0.0.6]
- Fixed a bug where missing dependencies caused the extension to fail silently on startup.
- Implemented a safety fallback for API token storage to support third-party and web-based IDEs that lack native encrypted SecretStorage (like Antigravity IDE and Gitpod).

## [0.0.5]
- Added `onStartupFinished` activation event to ensure the background auto-refresh timer wakes up correctly.

## [0.0.4]
- Added step-by-step instructions to the Welcome View on how to retrieve the ClickUp token.

## [0.0.3]
- Fixed extension activation issue by adding explicit activation events.
- Replaced the initial token pop-up prompt with a native, user-friendly Welcome View inside the Tasks panel.

## [0.0.2]
- Added official extension icon and branding.
- Improved README documentation with setup guide and feature overview.
- Added GitHub repository links and standard metadata for the marketplace.
- Added MIT License.

## [0.0.1]
- Initial release.
- Added live task status updates from the sidebar.
- Added draft reporting via Webview.
- Added background auto-refresh with status bar timer.
