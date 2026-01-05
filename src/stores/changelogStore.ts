import { create } from "zustand";
import { api } from "../utils/api";

export interface ChangeLog {
  _id: string;
  elementId: string;
  elementName: string;
  elementType: string;
  changeType: "added" | "deleted" | "update" | "link" | "unlink";
  relatedIssueId?: string;
  createdAt: string;
  diagramId: string;
}

interface ChangelogState {
  changeLogs: ChangeLog[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchChangeLogs: (diagramId: string) => Promise<void>;
  addChangeLog: (
    changeLog: Omit<ChangeLog, "_id" | "createdAt">
  ) => Promise<void>;
  addChangeLogs: (
    changeLogs: Array<Omit<ChangeLog, "_id" | "createdAt">>
  ) => Promise<void>;
  clearChangeLogs: () => void;
  clearChangeLogsByDiagram: (diagramId: string) => Promise<void>; // <-- ADDED
  getChangeLogsByDiagram: (diagramId: string) => ChangeLog[];
}

export const useChangelogStore = create<ChangelogState>((set, get) => ({
  changeLogs: [],
  loading: false,
  error: null,

  fetchChangeLogs: async (diagramId: string) => {
    set({ loading: true, error: null });
    try {
      const logs = await api.get(`/bpmn/diagrams/${diagramId}/changes`);
      set({
        changeLogs: logs.map((log: any) => ({ ...log, diagramId })),
        loading: false,
      });
    } catch (error) {
      console.error("Failed to fetch change logs:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch change logs",
        loading: false,
      });
    }
  },

  addChangeLog: async (changeLog: Omit<ChangeLog, "_id" | "createdAt">) => {
    try {
      await api.post(`/bpmn/diagrams/${changeLog.diagramId}/changes`, {
        changes: [changeLog],
      });

      // Add to local state immediately for better UX
      const newLog: ChangeLog = {
        ...changeLog,
        _id: `temp_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        changeLogs: [newLog, ...state.changeLogs],
      }));

      // Refresh from server to get the actual data
      setTimeout(() => {
        get().fetchChangeLogs(changeLog.diagramId);
      }, 100);
    } catch (error) {
      console.error("Failed to add change log:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to add change log",
      });
    }
  },

  addChangeLogs: async (
    changeLogs: Array<Omit<ChangeLog, "_id" | "createdAt">>
  ) => {
    if (changeLogs.length === 0) return;

    const diagramId = changeLogs[0].diagramId;
    try {
      await api.post(`/bpmn/diagrams/${diagramId}/changes`, {
        changes: changeLogs,
      });

      // Add to local state immediately for better UX
      const newLogs: ChangeLog[] = changeLogs.map((log, index) => ({
        ...log,
        _id: `temp_${Date.now()}_${index}`,
        createdAt: new Date().toISOString(),
      }));

      set((state) => ({
        changeLogs: [...newLogs, ...state.changeLogs],
      }));

      // Refresh from server to get the actual data
      setTimeout(() => {
        get().fetchChangeLogs(diagramId);
      }, 100);
    } catch (error) {
      console.error("Failed to add change logs:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to add change logs",
      });
    }
  },

  clearChangeLogs: () => {
    set({ changeLogs: [], error: null });
  },

  //added
  clearChangeLogsByDiagram: async (diagramId: string) => {
    try {
      await api.delete(`/bpmn/diagrams/${diagramId}/changes`);
      set((state) => ({
        // Filter out logs for the cleared diagram from local state
        changeLogs: state.changeLogs.filter(
          (log) => log.diagramId !== diagramId
        ),
      }));
    } catch (error) {
      console.error(
        `Failed to clear change logs for diagram ${diagramId}:`,
        error
      );
      throw error;
    }
  },
  //
  getChangeLogsByDiagram: (diagramId: string) => {
    return get().changeLogs.filter((log) => log.diagramId === diagramId);
  },
}));
