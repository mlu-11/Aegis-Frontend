import { create } from 'zustand';
import type { Project } from '../types';
import { api } from '../utils/api';

interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  fetchProjects: () => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  getProjectById: (id: string) => Project | undefined;
  deleteProjectWithCascade: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,

  fetchProjects: async () => {
    set({ loading: true });
    try {
      const projects = await api.get('/projects');
      set({
        projects: projects.map((p: any) => ({
          ...p,
          id: p._id,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        })),
        loading: false
      });
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      set({ loading: false });
    }
  },

  addProject: async (projectData) => {
    try {
      const newProject = await api.post('/projects', projectData);
      set((state) => ({
        projects: [
          ...state.projects,
          {
            ...newProject,
            id: newProject._id,
            createdAt: new Date(newProject.createdAt),
            updatedAt: new Date(newProject.updatedAt),
          },
        ],
      }));
    } catch (error) {
      console.error('Failed to add project:', error);
      throw error;
    }
  },

  updateProject: async (id, updates) => {
    try {
      const updatedProject = await api.put(`/projects/${id}`, updates);
      set((state) => ({
        projects: state.projects.map((project) =>
          project.id === id
            ? {
                ...updatedProject,
                id: updatedProject._id,
                createdAt: new Date(updatedProject.createdAt),
                updatedAt: new Date(updatedProject.updatedAt),
              }
            : project
        ),
        currentProject:
          state.currentProject?.id === id
            ? {
                ...updatedProject,
                id: updatedProject._id,
                createdAt: new Date(updatedProject.createdAt),
                updatedAt: new Date(updatedProject.updatedAt),
              }
            : state.currentProject,
      }));
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  },

  deleteProject: async (id) => {
    try {
      await api.delete(`/projects/${id}`);
      set((state) => ({
        projects: state.projects.filter((project) => project.id !== id),
        currentProject:
          state.currentProject?.id === id ? null : state.currentProject,
      }));
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  },

  setCurrentProject: (project) =>
    set({ currentProject: project }),

  getProjectById: (id) => {
    return get().projects.find((project) => project.id === id);
  },

  deleteProjectWithCascade: async (id) => {
    await get().deleteProject(id);
  },
}));