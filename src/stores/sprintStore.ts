import { create } from "zustand";
import type { Sprint } from "../types";
import { api } from "../utils/api";

interface SprintStore {
  sprints: Sprint[];
  loading: boolean;
  fetchSprints: (projectId?: string) => Promise<void>;
  addSprint: (
    sprint: Omit<Sprint, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateSprint: (id: string, updates: Partial<Sprint>) => Promise<void>;
  deleteSprint: (id: string) => Promise<void>;
  getSprintById: (id: string) => Sprint | undefined;
  getSprintsByProject: (projectId: string) => Sprint[];
  getActiveSprint: (projectId: string) => Sprint | undefined;
  addIssueToSprint: (sprintId: string, issueId: string) => Promise<void>;
  removeIssueFromSprint: (sprintId: string, issueId: string) => Promise<void>;
  canStartSprint: (projectId: string) => boolean;
}

const mapSprint = (sprint: any): Sprint => ({
  ...sprint,
  id: sprint._id,
  projectId: sprint.projectId?._id || sprint.projectId,
  issueIds: Array.isArray(sprint.issueIds)
    ? sprint.issueIds.map((id: any) => id._id || id)
    : [],
  startDate: new Date(sprint.startDate),
  endDate: new Date(sprint.endDate),
  createdAt: new Date(sprint.createdAt),
  updatedAt: new Date(sprint.updatedAt),
});

export const useSprintStore = create<SprintStore>((set, get) => ({
  sprints: [],
  loading: false,

  fetchSprints: async (projectId) => {
    set({ loading: true });
    try {
      const params = projectId ? `?projectId=${projectId}` : "";
      const sprints = await api.get(`/sprints${params}`);
      set({
        sprints: sprints.map(mapSprint),
        loading: false,
      });
    } catch (error) {
      console.error("Failed to fetch sprints:", error);
      set({ loading: false });
    }
  },

  addSprint: async (sprintData) => {
    try {
      const newSprint = await api.post("/sprints", sprintData);
      set((state) => ({
        sprints: [...state.sprints, mapSprint(newSprint)],
      }));
    } catch (error) {
      console.error("Failed to add sprint:", error);
      throw error;
    }
  },

  // updateSprint: async (id, updates) => {
  //   try {
  //     const updatedSprint = await api.put(`/sprints/${id}`, updates);
  //     set((state) => ({
  //       sprints: state.sprints.map((sprint) =>
  //         sprint.id === id ? mapSprint(updatedSprint) : sprint
  //       ),
  //     }));
  //   } catch (error) {
  //     console.error('Failed to update sprint:', error);
  //     throw error;
  //   }
  // },

  //
  updateSprint: async (id, updates) => {
    try {
      const current = get().sprints.find((s) => s.id === id);

      const currentlyCompleted = current?.status === "COMPLETED";
      const completingNow =
        updates.status === "COMPLETED" && !currentlyCompleted;

      let updatedSprint: any;

      if (completingNow) {
        // ✅ only call /complete when changing from non-COMPLETED → COMPLETED
        updatedSprint = await api.post(`/sprints/${id}/complete`, {});
      } else {
        // For all other edits (rename, date change, already COMPLETED, etc.)
        updatedSprint = await api.put(`/sprints/${id}`, updates);
      }

      set((state) => ({
        sprints: state.sprints.map((sprint) =>
          sprint.id === id ? mapSprint(updatedSprint) : sprint
        ),
      }));
    } catch (error: any) {
      console.error("Failed to update sprint:", error);
      // Optional: surface backend message to UI if you want
      throw error;
    }
  },

  //

  deleteSprint: async (id) => {
    try {
      await api.delete(`/sprints/${id}`);
      set((state) => ({
        sprints: state.sprints.filter((sprint) => sprint.id !== id),
      }));
    } catch (error) {
      console.error("Failed to delete sprint:", error);
      throw error;
    }
  },

  getSprintById: (id) => {
    return get().sprints.find((sprint) => sprint.id === id);
  },

  getSprintsByProject: (projectId) => {
    return get().sprints.filter((sprint) => sprint.projectId === projectId);
  },

  getActiveSprint: (projectId) => {
    return get().sprints.find(
      (sprint) => sprint.projectId === projectId && sprint.status === "ACTIVE"
    );
  },

  addIssueToSprint: async (sprintId, issueId) => {
    try {
      const updatedSprint = await api.post(
        `/sprints/${sprintId}/issues/${issueId}`,
        {}
      );
      set((state) => ({
        sprints: state.sprints.map((sprint) =>
          sprint.id === sprintId ? mapSprint(updatedSprint) : sprint
        ),
      }));
    } catch (error) {
      console.error("Failed to add issue to sprint:", error);
      throw error;
    }
  },

  removeIssueFromSprint: async (sprintId, issueId) => {
    try {
      const updatedSprint = await api.delete(
        `/sprints/${sprintId}/issues/${issueId}`
      );
      set((state) => ({
        sprints: state.sprints.map((sprint) =>
          sprint.id === sprintId ? mapSprint(updatedSprint) : sprint
        ),
      }));
    } catch (error) {
      console.error("Failed to remove issue from sprint:", error);
      throw error;
    }
  },

  canStartSprint: (projectId) => {
    const activeSprint = get().getActiveSprint(projectId);
    return !activeSprint;
  },
}));
