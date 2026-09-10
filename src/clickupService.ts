import axios from 'axios';

export class ClickUpService {
    private token: string | undefined;
    private userId: string | undefined;

    setToken(token: string) {
        this.token = token;
    }

    hasToken(): boolean {
        return !!this.token;
    }

    private get headers() {
        if (!this.token) throw new Error("No ClickUp token set");
        return {
            Authorization: this.token,
            'Content-Type': 'application/json'
        };
    }

    async getCurrentUser(): Promise<any> {
        const response = await axios.get('https://api.clickup.com/api/v2/user', { headers: this.headers });
        this.userId = response.data.user.id;
        return response.data.user;
    }

    async getTeams(): Promise<any[]> {
        const response = await axios.get('https://api.clickup.com/api/v2/team', { headers: this.headers });
        return response.data.teams;
    }

    async getMyTasks(teamId: string): Promise<any[]> {
        if (!this.userId) {
            await this.getCurrentUser();
        }
        const response = await axios.get(`https://api.clickup.com/api/v2/team/${teamId}/task?assignees%5B%5D=${this.userId}&subtasks=true&include_closed=false`, {
            headers: this.headers
        });
        return response.data.tasks;
    }

    async changeTaskStatus(taskId: string, status: string): Promise<void> {
        await axios.put(`https://api.clickup.com/api/v2/task/${taskId}`, { status }, { headers: this.headers });
    }

    async getList(listId: string): Promise<any> {
        const response = await axios.get(`https://api.clickup.com/api/v2/list/${listId}`, { headers: this.headers });
        return response.data;
    }

    async getTasksInList(listId: string): Promise<any[]> {
        const response = await axios.get(`https://api.clickup.com/api/v2/list/${listId}/task`, { headers: this.headers });
        return response.data.tasks;
    }

    async postComment(taskId: string, commentText: string): Promise<any> {
        const response = await axios.post(`https://api.clickup.com/api/v2/task/${taskId}/comment`, {
            comment_text: commentText,
            notify_all: true
        }, { headers: this.headers });
        return response.data;
    }

    async getSpaces(teamId: string): Promise<any[]> {
        const response = await axios.get(`https://api.clickup.com/api/v2/team/${teamId}/space`, { headers: this.headers });
        return response.data.spaces;
    }

    async getFolders(spaceId: string): Promise<any[]> {
        const response = await axios.get(`https://api.clickup.com/api/v2/space/${spaceId}/folder`, { headers: this.headers });
        return response.data.folders;
    }

    async getListsInSpace(spaceId: string): Promise<any[]> {
        const response = await axios.get(`https://api.clickup.com/api/v2/space/${spaceId}/list`, { headers: this.headers });
        return response.data.lists;
    }

    async getListsInFolder(folderId: string): Promise<any[]> {
        const response = await axios.get(`https://api.clickup.com/api/v2/folder/${folderId}/list`, { headers: this.headers });
        return response.data.lists;
    }

    async createReportTask(listId: string, name: string, description: string): Promise<any> {
        const response = await axios.post(`https://api.clickup.com/api/v2/list/${listId}/task`, {
            name,
            description
        }, { headers: this.headers });
        return response.data;
    }
}

export const clickupService = new ClickUpService();
