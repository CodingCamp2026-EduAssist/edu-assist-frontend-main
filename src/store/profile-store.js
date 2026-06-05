import { getUserProfile, updateUserProfile } from "@/services/api";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useProfileStore = create(
    persist(
        (set) => ({
            userProfiles: {},
            getUserProfile: async () => {
                const data = await getUserProfile();
                set({ userProfiles: data.profile });
                return data.profile;
            },
            updateUserProfile: async (userProfiles) => {
                const data = await updateUserProfile(userProfiles);
                set({ userProfiles: data.profile });
            },
        }),
        {
            name: "profile",
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
