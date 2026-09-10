# ClickUp Dock

Manage ClickUp tasks and dispatch reports directly from your sidebar.

ClickUp Dock is a VS Code extension designed to bring your ClickUp workspace directly into your coding environment. This tool was built to stop the endless context switching between your IDE and browser just to update a task status or log a weekly report. 

With ClickUp Dock, your tasks live where you work.

## Features

### Live Task Board
See all your current ClickUp tasks right in the VS Code Activity Bar. The board gives you a clean overview of your workload without cluttering your workspace.

![Task Board Placeholder](https://raw.githubusercontent.com/hermes13002/Clickup-dock/main/resources/placeholder1.png)

### Update Task Statuses on the Fly
Click on any task to instantly change its status. The extension pulls the exact custom statuses configured for your ClickUp list, so you always have the right options available.

### Background Auto-Refresh
The extension seamlessly refreshes your tasks in the background. A non-intrusive timer sits in your status bar so you always know when the next update is coming.

### Built-in Report Drafting
Draft your weekly reports or daily standups in the built-in webview. When you are done, simply select your target project and the extension will post your report directly to that project's activity feed as a comment.

![Draft Report Placeholder](https://raw.githubusercontent.com/hermes13002/Clickup-dock/main/resources/placeholder2.png)

## Installation and Setup

1. Search for **ClickUp Dock** in the VS Code Marketplace and click Install.
2. Open the command palette and run `ClickUp Dock: Set ClickUp Token`. 
3. Enter your personal ClickUp API token. This token stays securely on your machine.
4. Open the Draft Report panel in the sidebar, click the configure button, and select the specific Space and List where your projects are tracked.
5. You are all set!

## Privacy and Security

Everything runs locally on your machine. Your personal ClickUp token is stored securely in VS Code's native encrypted secret storage. There is no intermediate backend server or tracking handling your data.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
