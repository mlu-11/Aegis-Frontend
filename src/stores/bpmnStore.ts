import { create } from "zustand";
import type {
  BPMNDiagram,
  BPMNElement,
  BPMNElementStatus,
  Issue,
} from "../types";
//import { calculateElementStatus } from "../utils/bpmnUtils";
import { api } from "../utils/api";

interface BPMNStore {
  diagrams: BPMNDiagram[];
  elements: BPMNElement[];
  elementStatuses: BPMNElementStatus[];
  loading: boolean;

  fetchDiagrams: (projectId?: string) => Promise<void>;
  addDiagram: (
    diagram: Omit<BPMNDiagram, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateDiagram: (id: string, updates: Partial<BPMNDiagram>) => Promise<void>;

  updateDiagramLastCommittedXml: (id: string, xml: string) => Promise<void>; //
  deleteDiagram: (id: string) => Promise<void>;
  getDiagramsByProject: (projectId: string) => BPMNDiagram[];

  fetchElements: (diagramId?: string) => Promise<void>;
  addElement: (element: Omit<BPMNElement, "id">) => Promise<void>;
  updateElement: (id: string, updates: Partial<BPMNElement>) => Promise<void>;
  deleteElement: (id: string) => Promise<void>;
  getElementsByDiagram: (diagramId: string) => BPMNElement[];

  linkIssueToElement: (elementId: string, issueId: string) => Promise<void>;
  unlinkIssueFromElement: (elementId: string, issueId: string) => Promise<void>;
  updateElementStatus: (
    elementId: string,
    status: Omit<BPMNElementStatus, "elementId">
  ) => Promise<void>;
  getElementStatus: (elementId: string) => BPMNElementStatus | undefined;
  fetchElementStatus: (elementId: string) => Promise<void>;

  getElementsWithLinkedIssues: (diagramId: string) => BPMNElement[];
  updateElementStatusesFromIssues: (issues: Issue[]) => Promise<void>;
}

const mapDiagram = (diagram: any): BPMNDiagram => ({
  ...diagram,
  id: diagram._id,
  projectId: diagram.projectId?._id || diagram.projectId,
  createdAt: new Date(diagram.createdAt),
  updatedAt: new Date(diagram.updatedAt),
  sprintSnapshots: Array.isArray(diagram.sprintSnapshots) //new added
    ? diagram.sprintSnapshots.map((snap: any) => ({
        sprintId: snap.sprintId?._id || snap.sprintId,
        sprintName: snap.sprintName,
        sprintNumber: snap.sprintNumber,
        takenAt: snap.takenAt,
        xml: snap.xml,
      }))
    : [],
});

const mapElement = (element: any): BPMNElement => ({
  ...element,
  id: element._id,
  diagramId: element.diagramId?._id || element.diagramId,
  linkedIssueIds: Array.isArray(element.linkedIssueIds)
    ? element.linkedIssueIds.map((id: any) => id._id || id)
    : [],
});

const mapElementStatus = (status: any): BPMNElementStatus => ({
  ...status,
  lastUpdated: new Date(status.lastUpdated),
});

export const useBPMNStore = create<BPMNStore>((set, get) => ({
  diagrams: [],
  elements: [],
  elementStatuses: [],
  loading: false,

  fetchDiagrams: async (projectId) => {
    set({ loading: true });
    try {
      const params = projectId ? `?projectId=${projectId}` : "";
      const diagrams = await api.get(`/bpmn/diagrams${params}`);
      set({
        diagrams: diagrams.map(mapDiagram),
        loading: false,
      });
    } catch (error) {
      console.error("Failed to fetch diagrams:", error);
      set({ loading: false });
    }
  },

  addDiagram: async (diagramData) => {
    try {
      const newDiagram = await api.post("/bpmn/diagrams", diagramData);
      set((state) => ({
        diagrams: [...state.diagrams, mapDiagram(newDiagram)],
      }));
    } catch (error) {
      console.error("Failed to add diagram:", error);
      throw error;
    }
  },

  updateDiagram: async (id, updates) => {
    try {
      const updatedDiagram = await api.put(`/bpmn/diagrams/${id}`, updates);
      set((state) => ({
        diagrams: state.diagrams.map((diagram) =>
          diagram.id === id ? mapDiagram(updatedDiagram) : diagram
        ),
      }));
    } catch (error) {
      console.error("Failed to update diagram:", error);
      throw error;
    }
  },

  deleteDiagram: async (id) => {
    try {
      await api.delete(`/bpmn/diagrams/${id}`);
      set((state) => ({
        diagrams: state.diagrams.filter((diagram) => diagram.id !== id),
        elements: state.elements.filter((element) => element.diagramId !== id),
      }));
    } catch (error) {
      console.error("Failed to delete diagram:", error);
      throw error;
    }
  },

  //  new  added
  updateDiagramLastCommittedXml: async (id, xml) => {
    try {
      // Using PATCH on the resource endpoint for updating a single field
      const updatedDiagram = await api.patch(`/bpmn/diagrams/${id}`, {
        lastCommittedXml: xml,
      });
      set((state) => ({
        diagrams: state.diagrams.map((diagram) =>
          diagram.id === id ? mapDiagram(updatedDiagram) : diagram
        ),
      }));
    } catch (error) {
      console.error("Failed to update committed XML:", error);
      // Re-throw the error to ensure the calling function in SprintList handles the API failure
      throw error;
    }
  },

  getDiagramsByProject: (projectId) => {
    return get().diagrams.filter((diagram) => diagram.projectId === projectId);
  },

  fetchElements: async (diagramId) => {
    set({ loading: true });
    try {
      const params = diagramId ? `?diagramId=${diagramId}` : "";
      const elements = await api.get(`/bpmn/elements${params}`);
      set({
        elements: elements.map(mapElement),
        loading: false,
      });
    } catch (error) {
      console.error("Failed to fetch elements:", error);
      set({ loading: false });
    }
  },

  addElement: async (elementData) => {
    try {
      const newElement = await api.post("/bpmn/elements", elementData);
      set((state) => ({
        elements: [...state.elements, mapElement(newElement)],
      }));
    } catch (error) {
      console.error("Failed to add element:", error);
      throw error;
    }
  },

  updateElement: async (id, updates) => {
    try {
      const updatedElement = await api.put(`/bpmn/elements/${id}`, updates);
      set((state) => ({
        elements: state.elements.map((element) =>
          element.id === id ? mapElement(updatedElement) : element
        ),
      }));
    } catch (error) {
      console.error("Failed to update element:", error);
      throw error;
    }
  },

  deleteElement: async (id) => {
    try {
      await api.delete(`/bpmn/elements/${id}`);
      set((state) => ({
        elements: state.elements.filter((element) => element.id !== id),
      }));
    } catch (error) {
      console.error("Failed to delete element:", error);
      throw error;
    }
  },

  getElementsByDiagram: (diagramId) => {
    return get().elements.filter((element) => element.diagramId === diagramId);
  },

  linkIssueToElement: async (elementId, issueId) => {
    try {
      const element = get().elements.find((el) => el.elementId === elementId);
      if (!element) return;

      const updatedElement = await api.post(
        `/bpmn/elements/${element.id}/issues/${issueId}`,
        {}
      );
      set((state) => ({
        elements: state.elements.map((el) =>
          el.id === element.id ? mapElement(updatedElement) : el
        ),
      }));
    } catch (error) {
      console.error("Failed to link issue to element:", error);
      throw error;
    }
  },

  unlinkIssueFromElement: async (elementId, issueId) => {
    try {
      const element = get().elements.find((el) => el.elementId === elementId);
      if (!element) return;

      const updatedElement = await api.delete(
        `/bpmn/elements/${element.id}/issues/${issueId}`
      );
      set((state) => ({
        elements: state.elements.map((el) =>
          el.id === element.id ? mapElement(updatedElement) : el
        ),
      }));
    } catch (error) {
      console.error("Failed to unlink issue from element:", error);
      throw error;
    }
  },

  updateElementStatus: async (elementId, status) => {
    try {
      const updatedStatus = await api.put(
        `/bpmn/statuses/${elementId}`,
        status
      );
      set((state) => {
        const existingIndex = state.elementStatuses.findIndex(
          (s) => s.elementId === elementId
        );

        if (existingIndex >= 0) {
          const updatedStatuses = [...state.elementStatuses];
          updatedStatuses[existingIndex] = mapElementStatus(updatedStatus);
          return { elementStatuses: updatedStatuses };
        } else {
          return {
            elementStatuses: [
              ...state.elementStatuses,
              mapElementStatus(updatedStatus),
            ],
          };
        }
      });
    } catch (error) {
      console.error("Failed to update element status:", error);
      throw error;
    }
  },

  getElementStatus: (elementId) => {
    return get().elementStatuses.find(
      (status) => status.elementId === elementId
    );
  },

  fetchElementStatus: async (elementId) => {
    try {
      const status = await api.get(`/bpmn/statuses/${elementId}`);
      if (status) {
        set((state) => {
          const existingIndex = state.elementStatuses.findIndex(
            (s) => s.elementId === elementId
          );

          if (existingIndex >= 0) {
            const updatedStatuses = [...state.elementStatuses];
            updatedStatuses[existingIndex] = mapElementStatus(status);
            return { elementStatuses: updatedStatuses };
          } else {
            return {
              elementStatuses: [
                ...state.elementStatuses,
                mapElementStatus(status),
              ],
            };
          }
        });
      }
    } catch (error) {
      console.error("Failed to fetch element status:", error);
    }
  },

  getElementsWithLinkedIssues: (diagramId) => {
    return get().elements.filter(
      (element) =>
        element.diagramId === diagramId && element.linkedIssueIds.length > 0
    );
  },

  updateElementStatusesFromIssues: async (issues) => {
    try {
      const issueIds = issues.map((issue) => issue.id);
      const updatedStatuses = await api.post(
        "/bpmn/statuses/update-from-issues",
        { issueIds }
      );

      set((state) => {
        const newStatuses = [...state.elementStatuses];

        updatedStatuses.forEach((updatedStatus: any) => {
          const existingIndex = newStatuses.findIndex(
            (s) => s.elementId === updatedStatus.elementId
          );

          if (existingIndex >= 0) {
            newStatuses[existingIndex] = mapElementStatus(updatedStatus);
          } else {
            newStatuses.push(mapElementStatus(updatedStatus));
          }
        });

        return { elementStatuses: newStatuses };
      });
    } catch (error) {
      console.error("Failed to update element statuses from issues:", error);
      throw error;
    }
  },
}));
