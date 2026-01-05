import { create } from "zustand";
import type { Issue, IssueStatus, LinkedBPMNElement } from "../types";
import { api } from "../utils/api";

interface IssueStore {
  issues: Issue[];
  loading: boolean;
  fetchIssues: (projectId?: string, sprintId?: string) => Promise<void>;
  addIssue: (
    issue: Omit<Issue, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateIssue: (id: string, updates: Partial<Issue>) => Promise<void>;
  deleteIssue: (id: string) => Promise<void>;
  getIssueById: (id: string) => Issue | undefined;
  getIssuesByProject: (projectId: string) => Issue[];
  getIssuesBySprint: (sprintId: string) => Issue[];
  getBacklogIssues: (projectId: string) => Issue[];
  updateIssueStatus: (id: string, status: IssueStatus) => Promise<void>;
  assignIssueToSprint: (
    issueId: string,
    sprintId: string | undefined
  ) => Promise<void>;

  linkIssueToBPMN: (
    issueId: string,
    diagramId: string,
    elementId: string
  ) => Promise<void>;
  unlinkIssueFromBPMN: (
    issueId: string,
    diagramId: string,
    elementId: string
  ) => Promise<void>;
  getIssuesByBPMNElement: (elementId: string) => Issue[];
  getIssuesByBPMNDiagram: (diagramId: string) => Issue[];
  getBPMNElementsByIssue: (issueId: string) => LinkedBPMNElement[];
}

const mapIssue = (issue: any): Issue => ({
  ...issue,
  id: issue._id,
  projectId: issue.projectId?._id || issue.projectId,
  sprintId: issue.sprintId?._id || issue.sprintId,
  assigneeId: issue.assigneeId?._id || issue.assigneeId,
  reporterId: issue.reporterId?._id || issue.reporterId,
  createdAt: new Date(issue.createdAt),
  updatedAt: new Date(issue.updatedAt),
});

export const useIssueStore = create<IssueStore>((set, get) => ({
  issues: [],
  loading: false,

  fetchIssues: async (projectId, sprintId) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams();
      if (projectId) params.append("projectId", projectId);
      if (sprintId !== undefined)
        params.append("sprintId", sprintId === "" ? "null" : sprintId);

      const issues = await api.get(`/issues?${params.toString()}`);
      set({
        issues: issues.map(mapIssue),
        loading: false,
      });
    } catch (error) {
      console.error("Failed to fetch issues:", error);
      set({ loading: false });
    }
  },

  addIssue: async (issueData) => {
    try {
      const newIssue = await api.post("/issues", issueData);
      set((state) => ({
        issues: [...state.issues, mapIssue(newIssue)],
      }));
    } catch (error) {
      console.error("Failed to add issue:", error);
      throw error;
    }
  },

  //add: represent changes on Userstories between sprint
  updateIssue: async (id, updates) => {
    // 1. Get old issue for comparison
    const oldIssue = get().issues.find((issue) => issue.id === id);
    try {
      //const updatedIssue = await api.put(`/issues/${id}`, updates);
      const updatedIssue = await api.put(`/issues/${id}`, updates);
      const newIssue = mapIssue(updatedIssue);

      // --- NEW LOGIC TO DETECT AND LOG ISSUE FIELD CHANGES ---
      if (oldIssue) {
        // In a full application, you would use a dedicated IssueChangeLogStore or API.
        // We log significant changes to the console to demonstrate the required detection logic.

        const changes: { field: string; oldValue: any; newValue: any }[] = [];

        if (oldIssue.title !== newIssue.title) {
          changes.push({
            field: "Title",
            oldValue: oldIssue.title,
            newValue: newIssue.title,
          });
        }
        if (oldIssue.description !== newIssue.description) {
          changes.push({
            field: "Description",
            oldValue: oldIssue.description,
            newValue: newIssue.description,
          });
        }
        if (oldIssue.priority !== newIssue.priority) {
          changes.push({
            field: "Priority",
            oldValue: oldIssue.priority,
            newValue: newIssue.priority,
          });
        }
        if (oldIssue.status !== newIssue.status) {
          changes.push({
            field: "Status",
            oldValue: oldIssue.status,
            newValue: newIssue.status,
          });
        }

        // The core requirement: tracking sprint changes (cross-sprint movement)
        if (oldIssue.sprintId !== newIssue.sprintId) {
          const oldSprint = oldIssue.sprintId || "Backlog";
          const newSprint = newIssue.sprintId || "Backlog";
          changes.push({
            field: "Sprint",
            oldValue: oldSprint,
            newValue: newSprint,
          });
        }

        if (changes.length > 0) {
          console.log(
            `--- Issue Change Log for ${newIssue.id} (${newIssue.title}) ---`
          );
          changes.forEach((change) => {
            console.log(
              `[${change.field} Changed] From: ${change.oldValue} | To: ${change.newValue}`
            );
            // In a real app, you would call an addIssueChangeLog(change) API here
            // to save this log for later display in the modal.
          });
          console.log("--------------------------------------------------");
        }
      }
      // --- END NEW LOGIC ---

      set((state) => ({
        issues: state.issues.map((issue) =>
          issue.id === id ? mapIssue(updatedIssue) : issue
        ),
      }));
    } catch (error) {
      console.error("Failed to update issue:", error);
      throw error;
    }
  },

  deleteIssue: async (id) => {
    try {
      await api.delete(`/issues/${id}`);
      set((state) => ({
        issues: state.issues.filter((issue) => issue.id !== id),
      }));
    } catch (error) {
      console.error("Failed to delete issue:", error);
      throw error;
    }
  },

  getIssueById: (id) => {
    return get().issues.find((issue) => issue.id === id);
  },

  getIssuesByProject: (projectId) => {
    return get().issues.filter((issue) => issue.projectId === projectId);
  },

  getIssuesBySprint: (sprintId) => {
    return get().issues.filter((issue) => issue.sprintId === sprintId);
  },

  getBacklogIssues: (projectId) => {
    return get().issues.filter(
      (issue) => issue.projectId === projectId && !issue.sprintId
    );
  },

  updateIssueStatus: async (id, status) => {
    try {
      const updatedIssue = await api.patch(`/issues/${id}/status`, { status });
      set((state) => ({
        issues: state.issues.map((issue) =>
          issue.id === id ? mapIssue(updatedIssue) : issue
        ),
      }));
    } catch (error) {
      console.error("Failed to update issue status:", error);
      throw error;
    }
  },

  assignIssueToSprint: async (issueId, sprintId) => {
    try {
      const updatedIssue = await api.patch(`/issues/${issueId}/sprint`, {
        sprintId,
      });
      set((state) => ({
        issues: state.issues.map((issue) =>
          issue.id === issueId ? mapIssue(updatedIssue) : issue
        ),
      }));
    } catch (error) {
      console.error("Failed to assign issue to sprint:", error);
      throw error;
    }
  },

  linkIssueToBPMN: async (issueId, diagramId, elementId) => {
    try {
      const updatedIssue = await api.post(`/issues/${issueId}/bpmn/link`, {
        diagramId,
        elementId,
      });
      set((state) => ({
        issues: state.issues.map((issue) =>
          issue.id === issueId ? mapIssue(updatedIssue) : issue
        ),
      }));
    } catch (error) {
      console.error("Failed to link issue to BPMN:", error);
      throw error;
    }
  },

  unlinkIssueFromBPMN: async (issueId, diagramId, elementId) => {
    try {
      const updatedIssue = await api.delete(
        `/issues/${issueId}/bpmn/link?diagramId=${diagramId}&elementId=${elementId}`
      );
      set((state) => ({
        issues: state.issues.map((issue) =>
          issue.id === issueId ? mapIssue(updatedIssue) : issue
        ),
      }));
    } catch (error) {
      console.error("Failed to unlink issue from BPMN:", error);
      throw error;
    }
  },

  getIssuesByBPMNElement: (elementId) => {
    return get().issues.filter((issue) =>
      issue.linkedBPMNElements?.some(
        (element) => element.elementId === elementId
      )
    );
  },

  getIssuesByBPMNDiagram: (diagramId) => {
    return get().issues.filter((issue) =>
      issue.linkedBPMNElements?.some(
        (element) => element.diagramId === diagramId
      )
    );
  },

  getBPMNElementsByIssue: (issueId) => {
    const issue = get().issues.find((issue) => issue.id === issueId);
    return issue?.linkedBPMNElements || [];
  },
}));
