import * as vscode from 'vscode';
import { clickupService } from './clickupService';
import { TaskTreeProvider, TaskTreeItem } from './taskTreeProvider';
import { ReportWebviewProvider } from './reportWebview';

let refreshIntervalId: NodeJS.Timeout | undefined;
let countdownIntervalId: NodeJS.Timeout | undefined;
let statusBarItem: vscode.StatusBarItem;
let nextRefreshTime = 0;

export async function activate(context: vscode.ExtensionContext) {
    console.log('ClickUp Dock extension activated!');

    // Initialize Service with Token if exists
    const token = await context.secrets.get('clickupDock.clickupToken');
    vscode.commands.executeCommand('setContext', 'clickupDock.hasToken', !!token);
    
    if (token) {
        clickupService.setToken(token);
    }

    // Register Tasks Tree Provider
    const taskTreeProvider = new TaskTreeProvider();
    vscode.window.registerTreeDataProvider('clickupDock.tasksView', taskTreeProvider);

    // Register Report Webview Provider
    const reportWebviewProvider = new ReportWebviewProvider(context.extensionUri, context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(ReportWebviewProvider.viewType, reportWebviewProvider)
    );

    // Register Commands
    context.subscriptions.push(vscode.commands.registerCommand('clickupDock.setToken', async () => {
        const input = await vscode.window.showInputBox({
            prompt: 'Enter your ClickUp Personal API Token',
            password: true,
            ignoreFocusOut: true
        });

        if (input) {
            await context.secrets.store('clickupDock.clickupToken', input);
            clickupService.setToken(input);
            vscode.commands.executeCommand('setContext', 'clickupDock.hasToken', true);
            vscode.window.showInformationMessage('ClickUp Token saved successfully!');
            taskTreeProvider.refresh();
            startAutoRefresh(taskTreeProvider);
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('clickupDock.refreshTasks', () => {
        taskTreeProvider.refresh();
        resetRefreshTimer();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('clickupDock.changeTaskStatus', async (node: TaskTreeItem) => {
        if (!node || !node.taskId || !node.listId) return;
        try {
            const listDetails = await clickupService.getList(node.listId);
            const statuses: any[] = listDetails.statuses || [];
            
            if (statuses.length === 0) {
                vscode.window.showWarningMessage('No statuses found for this list.');
                return;
            }

            const statusItems = statuses.map(s => ({ label: s.status, statusObj: s }));
            const selectedStatus = await vscode.window.showQuickPick(statusItems, { placeHolder: 'Select new status' });
            
            if (selectedStatus) {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `Changing status to ${selectedStatus.label}...`,
                }, async () => {
                    await clickupService.changeTaskStatus(node.taskId!, selectedStatus.label);
                });
                vscode.window.showInformationMessage('Task status updated!');
                taskTreeProvider.refresh();
            }
        } catch (err: any) {
            vscode.window.showErrorMessage('Error changing status: ' + err.message);
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('clickupDock.configureReportList', async () => {
        if (!clickupService.hasToken()) {
            vscode.window.showErrorMessage('Please set your ClickUp token first.');
            return;
        }

        try {
            const teams = await clickupService.getTeams();
            if (teams.length === 0) return;
            const team = teams[0];

            // Select Space
            const spaces = await clickupService.getSpaces(team.id);
            const spaceItems = spaces.map(s => ({ label: s.name, id: s.id }));
            const selectedSpace = await vscode.window.showQuickPick(spaceItems, { placeHolder: 'Select the Space for Weekly Reports (e.g., Weekly Reports)' });
            if (!selectedSpace) return;

            // Fetch folders
            const folders = await clickupService.getFolders(selectedSpace.id);
            const listsInSpace = await clickupService.getListsInSpace(selectedSpace.id);
            
            let listItems: { label: string, id: string, description?: string }[] = listsInSpace.map(l => ({ label: l.name, id: l.id, description: 'List in Space' }));
            
            for (const folder of folders) {
                const folderLists = await clickupService.getListsInFolder(folder.id);
                listItems.push(...folderLists.map(l => ({ label: l.name, id: l.id, description: `Folder: ${folder.name}` })));
            }

            if (listItems.length === 0) {
                vscode.window.showInformationMessage('No lists found in this space.');
                return;
            }

            const selectedList = await vscode.window.showQuickPick(listItems, { placeHolder: 'Select the List for your reports (e.g., Production, Pilot test)' });
            if (!selectedList) return;

            await context.globalState.update('clickupDock.reportListId', selectedList.id);
            vscode.window.showInformationMessage(`Report destination set to: ${selectedList.label}`);
            
            // Notify webview to reload projects
            reportWebviewProvider.notifyListConfigured();

        } catch (err: any) {
            vscode.window.showErrorMessage('Error configuring reports: ' + err.message);
        }
    }));

    if (token) {
        startAutoRefresh(taskTreeProvider);
    }

    // Settings listener
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('clickupDock.refreshInterval')) {
            startAutoRefresh(taskTreeProvider);
        }
    }));
}

function startAutoRefresh(provider: TaskTreeProvider) {
    if (refreshIntervalId) clearInterval(refreshIntervalId);
    if (countdownIntervalId) clearInterval(countdownIntervalId);
    if (statusBarItem) statusBarItem.dispose();

    const config = vscode.workspace.getConfiguration('clickupDock');
    let minutes = config.get<number>('refreshInterval') || 2;
    if (minutes < 1) minutes = 1;

    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'clickupDock.refreshTasks';
    statusBarItem.tooltip = 'Click to refresh ClickUp Dock tasks now';
    statusBarItem.show();

    const intervalMs = minutes * 60 * 1000;
    
    const tick = () => {
        nextRefreshTime = Date.now() + intervalMs;
        provider.refresh();
    };

    tick();
    refreshIntervalId = setInterval(tick, intervalMs);

    countdownIntervalId = setInterval(() => {
        const diff = Math.max(0, Math.floor((nextRefreshTime - Date.now()) / 1000));
        const m = Math.floor(diff / 60);
        const s = diff % 60;
        statusBarItem.text = `$(sync) ClickUp Dock: ${m}m ${s}s`;
    }, 1000);
}

function resetRefreshTimer() {
    const config = vscode.workspace.getConfiguration('clickupDock');
    let minutes = config.get<number>('refreshInterval') || 2;
    if (minutes < 1) minutes = 1;
    nextRefreshTime = Date.now() + (minutes * 60 * 1000);
}

export function deactivate() {
    if (refreshIntervalId) clearInterval(refreshIntervalId);
    if (countdownIntervalId) clearInterval(countdownIntervalId);
}
