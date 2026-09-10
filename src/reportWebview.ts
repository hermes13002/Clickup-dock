import * as vscode from 'vscode';
import { clickupService } from './clickupService';

export class ReportWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'clickupDock.reportDraftView';
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri, private readonly _context: vscode.ExtensionContext) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview();

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'saveDraft': {
                    await this._context.globalState.update('clickupDock.draftReport', data.text);
                    vscode.window.showInformationMessage('Report draft saved locally.');
                    break;
                }
                case 'sendReport': {
                    await this.sendReport(data.taskId, data.text);
                    break;
                }
                case 'loadDraft': {
                    const draft = this._context.globalState.get<string>('clickupDock.draftReport', '');
                    webviewView.webview.postMessage({ type: 'loadDraft', text: draft });
                    break;
                }
                case 'loadProjects': {
                    await this.loadProjects();
                    break;
                }
                case 'configureTarget': {
                    vscode.commands.executeCommand('clickupDock.configureReportList');
                    break;
                }
            }
        });
    }

    public async notifyListConfigured() {
        await this.loadProjects();
    }

    private async loadProjects() {
        if (!this._view) return;
        const listId = this._context.globalState.get<string>('clickupDock.reportListId');
        if (!listId) {
            this._view.webview.postMessage({ type: 'projectsLoaded', projects: [] });
            return;
        }

        try {
            const tasks = await clickupService.getTasksInList(listId);
            const projects = tasks.map(t => ({ id: t.id, name: t.name }));
            this._view.webview.postMessage({ type: 'projectsLoaded', projects });
        } catch (err) {
            console.error("Failed to load projects", err);
            this._view.webview.postMessage({ type: 'projectsLoaded', projects: [] });
        }
    }

    private async sendReport(taskId: string, text: string) {
        if (!text.trim()) {
            vscode.window.showErrorMessage('Report cannot be empty.');
            return;
        }

        if (!taskId) {
            vscode.window.showErrorMessage('Please select a target Project (Task) first.');
            return;
        }

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Sending Report...",
                cancellable: false
            }, async () => {
                await clickupService.postComment(taskId, text);
            });
            vscode.window.showInformationMessage('Report sent successfully!');
            await this._context.globalState.update('clickupDock.draftReport', '');
            this._view?.webview.postMessage({ type: 'loadDraft', text: '' });
        } catch (err: any) {
            vscode.window.showErrorMessage('Failed to send report: ' + err.message);
        }
    }

    private _getHtmlForWebview() {
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Draft Report</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        padding: 10px;
                        display: flex;
                        flex-direction: column;
                        height: 100vh;
                        box-sizing: border-box;
                    }
                    .header-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 10px;
                    }
                    select {
                        flex: 1;
                        min-width: 0;
                        background: var(--vscode-dropdown-background);
                        color: var(--vscode-dropdown-foreground);
                        border: 1px solid var(--vscode-dropdown-border);
                        padding: 4px;
                        margin-right: 5px;
                    }
                    textarea {
                        flex: 1;
                        width: 100%;
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                        padding: 8px;
                        font-family: inherit;
                        resize: none;
                        margin-bottom: 10px;
                        box-sizing: border-box;
                    }
                    button {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 8px 12px;
                        cursor: pointer;
                        margin-bottom: 5px;
                    }
                    button:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                    .secondary {
                        background: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                    }
                    .secondary:hover {
                        background: var(--vscode-button-secondaryHoverBackground);
                    }
                    .icon-btn {
                        padding: 4px 8px;
                        font-size: 16px;
                    }
                </style>
            </head>
            <body>
                <div class="header-row">
                    <select id="projectSelect">
                        <option value="">Loading Projects...</option>
                    </select>
                    <button id="configBtn" class="secondary icon-btn" title="Configure Target List">⚙️</button>
                </div>
                
                <textarea id="reportText" placeholder="Jot down notes or draft your weekly report here..."></textarea>
                <button id="saveBtn" class="secondary">Save Draft</button>
                <button id="sendBtn">Send Report</button>

                <script>
                    const vscode = acquireVsCodeApi();
                    const textarea = document.getElementById('reportText');
                    const saveBtn = document.getElementById('saveBtn');
                    const sendBtn = document.getElementById('sendBtn');
                    const configBtn = document.getElementById('configBtn');
                    const projectSelect = document.getElementById('projectSelect');

                    // Request initial data
                    vscode.postMessage({ type: 'loadDraft' });
                    vscode.postMessage({ type: 'loadProjects' });

                    window.addEventListener('message', event => {
                        const message = event.data;
                        if (message.type === 'loadDraft') {
                            textarea.value = message.text || '';
                        } else if (message.type === 'projectsLoaded') {
                            projectSelect.innerHTML = '';
                            if (message.projects.length === 0) {
                                const opt = document.createElement('option');
                                opt.value = '';
                                opt.textContent = 'No projects found. Please configure list.';
                                projectSelect.appendChild(opt);
                            } else {
                                message.projects.forEach(p => {
                                    const opt = document.createElement('option');
                                    opt.value = p.id;
                                    opt.textContent = p.name;
                                    projectSelect.appendChild(opt);
                                });
                            }
                        }
                    });

                    saveBtn.addEventListener('click', () => {
                        vscode.postMessage({ type: 'saveDraft', text: textarea.value });
                    });

                    sendBtn.addEventListener('click', () => {
                        vscode.postMessage({ 
                            type: 'sendReport', 
                            taskId: projectSelect.value, 
                            text: textarea.value 
                        });
                    });

                    configBtn.addEventListener('click', () => {
                        vscode.postMessage({ type: 'configureTarget' });
                    });
                </script>
            </body>
            </html>`;
    }
}
