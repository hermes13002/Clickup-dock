# ClickUp Dock

ClickUp Dock is a VS Code extension that brings your ClickUp tasks directly into your coding environment, so you can update your status and write your weekly reports without having to open a browser or switch contexts.

## Why this was built

I created this tool because constantly switching between the IDE and ClickUp just to update a task status or log a weekly report was interrupting my workflow. With ClickUp Dock, you can see your current tasks in the sidebar, change their status as you work, and draft your weekly reports directly from your editor. When you are ready, you can submit the report directly to the activity feed of your designated project task.

## Key Features

- **Live Task Board:** See your ClickUp tasks in the sidebar while you work.
- **Update Task Statuses:** Click a task to change its status using the options configured for your specific list.
- **Auto-Refresh:** The extension refreshes your tasks in the background, and there is a timer in the status bar so you always know when the next update is coming.
- **Write and Send Reports:** Draft your weekly report in the built-in webview. When you are done, select your target project and it will be posted directly as a comment in ClickUp.

## Getting Started

1. Open the command palette and run "ClickUp Dock: Set ClickUp Token". Enter your personal API token.
2. The sidebar will populate with your tasks. 
3. Open the "Draft Report" panel in the sidebar, click the configure button, and select the specific Space and List where your projects are tracked.
4. You are ready to go. You can now draft your reports and post them directly to your project tasks.

## Privacy

Everything runs locally on your machine. Your personal ClickUp token is stored securely in VS Code's native secret storage, and there is no intermediate backend server handling your data.
