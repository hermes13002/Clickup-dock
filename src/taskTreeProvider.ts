import * as vscode from 'vscode';
import { clickupService } from './clickupService';

export class TaskTreeProvider implements vscode.TreeDataProvider<TaskTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TaskTreeItem | undefined | null | void> = new vscode.EventEmitter<TaskTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TaskTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor() {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TaskTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: TaskTreeItem): Promise<TaskTreeItem[]> {
        if (!clickupService.hasToken()) {
            return [new TaskTreeItem("Please set your ClickUp Token (Click here or run command)", vscode.TreeItemCollapsibleState.None, 'auth')];
        }

        if (element) {
            if (element.type === 'list' && element.tasks) {
                return element.tasks.map((t: any) => {
                    const item = new TaskTreeItem(t.name, vscode.TreeItemCollapsibleState.None, 'task');
                    item.taskId = t.id;
                    item.listId = element.listId; // inherit from parent list
                    item.description = t.status.status;
                    item.contextValue = 'clickupTask'; 
                    return item;
                });
            }
            return [];
        } else {
            try {
                const teams = await clickupService.getTeams();
                if (teams.length === 0) return [new TaskTreeItem("No teams found", vscode.TreeItemCollapsibleState.None)];
                
                const team = teams[0];
                const tasks = await clickupService.getMyTasks(team.id);

                const listMap = new Map<string, any[]>();
                const listNames = new Map<string, string>();

                for (const t of tasks) {
                    const listId = t.list.id;
                    if (!listMap.has(listId)) {
                        listMap.set(listId, []);
                        listNames.set(listId, t.list.name || t.project?.name || "Unknown List");
                    }
                    listMap.get(listId)!.push(t);
                }

                const listItems: TaskTreeItem[] = [];
                for (const [listId, listTasks] of listMap.entries()) {
                    const item = new TaskTreeItem(listNames.get(listId)!, vscode.TreeItemCollapsibleState.Collapsed, 'list');
                    item.tasks = listTasks;
                    item.listId = listId;
                    listItems.push(item);
                }

                if (listItems.length === 0) {
                    return [new TaskTreeItem("No active tasks found", vscode.TreeItemCollapsibleState.None)];
                }
                return listItems;

            } catch (err: any) {
                vscode.window.showErrorMessage("Error fetching ClickUp tasks: " + err.message);
                return [new TaskTreeItem("Error loading tasks", vscode.TreeItemCollapsibleState.None)];
            }
        }
    }
}

export class TaskTreeItem extends vscode.TreeItem {
    public taskId?: string;
    public listId?: string;
    public tasks?: any[];

    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly type?: 'list' | 'task' | 'auth'
    ) {
        super(label, collapsibleState);
        this.tooltip = this.label;
        if (this.type === 'task') {
            this.iconPath = new vscode.ThemeIcon('checklist');
        } else if (this.type === 'list') {
            this.iconPath = new vscode.ThemeIcon('list-tree');
        } else if (this.type === 'auth') {
            this.command = {
                command: 'clickupDock.setToken',
                title: 'Set Token'
            };
        }
    }
}
