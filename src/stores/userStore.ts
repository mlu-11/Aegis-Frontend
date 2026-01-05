import { create } from "zustand";
import type { User } from "../types";
import { api } from "../utils/api";

interface UserStore {
  users: User[];
  currentUser: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  fetchUsers: () => Promise<void>;
  addUser: (user: Omit<User, "id">) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  getUserById: (id: string) => User | undefined;
  setCurrentUser: (user: User | null) => void;
  setUsers: (users: User[]) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  // Added logic to check and load user on app launch
  checkAuthStatus: () => Promise<void>;
}

const mapUser = (user: any): User => ({
  ...user,
  id: user._id,
});

export const useUserStore = create<UserStore>((set, get) => ({
  users: [],
  currentUser: null,
  loading: false,
  isAuthenticated: !!localStorage.getItem("token"),

  fetchUsers: async () => {
    set({ loading: true });
    try {
      const users = await api.get("/users");
      set({
        users: users.map(mapUser),
        loading: false,
      });
    } catch (error) {
      console.error("Failed to fetch users:", error);
      set({ loading: false });
    }
  },

  addUser: async (userData) => {
    try {
      const newUser = await api.post("/users", userData);
      set((state) => ({
        users: [...state.users, mapUser(newUser)],
      }));
    } catch (error) {
      console.error("Failed to add user:", error);
      throw error;
    }
  },

  updateUser: async (id, updates) => {
    try {
      const updatedUser = await api.put(`/users/${id}`, updates);
      set((state) => ({
        users: state.users.map((user) =>
          user.id === id ? mapUser(updatedUser) : user
        ),
        currentUser:
          state.currentUser?.id === id
            ? mapUser(updatedUser)
            : state.currentUser,
      }));
    } catch (error) {
      console.error("Failed to update user:", error);
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      await api.delete(`/users/${id}`);
      set((state) => ({
        users: state.users.filter((user) => user.id !== id),
        currentUser: state.currentUser?.id === id ? null : state.currentUser,
      }));
    } catch (error) {
      console.error("Failed to delete user:", error);
      throw error;
    }
  },

  getUserById: (id) => {
    return get().users.find((user) => user.id === id);
  },

  setCurrentUser: (user) => set({ currentUser: user }),

  setUsers: (users) => set({ users }),

  // login: async (email, password) => {
  //   set({ loading: true });
  //   try {
  //     const response = await api.post("/users/login", { email, password });
  //     const { token, user } = response;
  //     api.setToken(token);
  //     set({
  //       currentUser: mapUser(user),
  //       isAuthenticated: true,
  //       loading: false,
  //     });
  //   } catch (error) {
  //     console.error("Login failed:", error);
  //     set({ loading: false });
  //     throw error;
  //   }
  // },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const response = await api.post("/users/login", { email, password });
      const { token } = response;

      api.setToken(token); // save token immediately

      await get().checkAuthStatus(); // fetch /users/me using the saved token

      set({ loading: false });
    } catch (error) {
      console.error("Login failed:", error);
      set({ loading: false });
      throw error;
    }
  },

  signup: async (name, email, password) => {
    set({ loading: true });
    try {
      const response = await api.post("/users/signup", {
        name,
        email,
        password,
      });
      const { token, user } = response;
      api.setToken(token);
      set({
        currentUser: mapUser(user),
        isAuthenticated: true,
        loading: false,
      });
    } catch (error) {
      console.error("Signup failed:", error);
      set({ loading: false });
      throw error;
    }
  },

  logout: () => {
    api.clearToken();
    set({
      currentUser: null,
      isAuthenticated: false,
    });
  },

  // NEW: Check token and load user data on app initialization
  checkAuthStatus: async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      set({ isAuthenticated: false, currentUser: null, loading: false });
      return;
    }

    // Set loading true while attempting to verify token and fetch user
    set({ loading: true });
    try {
      // Assume API has an endpoint to fetch the current user's profile
      // using the stored token for authorization.
      const user = await api.get("/users/me");

      set({
        currentUser: mapUser(user),
        isAuthenticated: true,
        loading: false,
      });
    } catch (error) {
      console.warn("Token verification failed, logging out:", error);
      api.clearToken();
      set({
        currentUser: null,
        isAuthenticated: false,
        loading: false,
      });
    }
  },
}));
