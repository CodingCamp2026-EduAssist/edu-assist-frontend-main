import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useAuthStore = create(
    persist(
        (set, get) => ({
            accessToken: "",
            user: {},
            setAccessToken: (token) => set(() => ({ accessToken: token })),
            setUser: (user) => set(() => ({ user })),
            isAuthenticated: () => {
                return !!get().accessToken;
            },
            clearAuthState: () => set({ accessToken: "", user: {} }),
        }),
        {
            name: "auth",
            storage: createJSONStorage(() => localStorage),
        },
    ),
);

