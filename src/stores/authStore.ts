import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  photoURL?: string;
  isGuest: boolean;
  provider: 'guest' | 'google';
}

interface AuthState {
  user: UserProfile | null;
  hasChosenMode: boolean;
  isAuthModalOpen: boolean;
  
  // Actions
  continueAsGuest: (name?: string) => void;
  loginWithGoogle: (customName?: string) => Promise<void>;
  logout: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      hasChosenMode: false,
      isAuthModalOpen: false,

      continueAsGuest: (name?: string) => {
        const guestName = name?.trim() || `Tamu #${Math.floor(1000 + Math.random() * 9000)}`;
        set({
          user: {
            id: 'guest_' + Math.random().toString(36).substring(2, 9),
            name: guestName,
            isGuest: true,
            provider: 'guest',
          },
          hasChosenMode: true,
          isAuthModalOpen: false,
        });
      },

      loginWithGoogle: async (customName?: string) => {
        // Mock / simulation of Google Auth flow for instantaneous and offline-ready functionality
        const googleNames = ['Fauzan Rafly', 'Aditya Pratama', 'Budi Santoso', 'Siti Rahma', 'Rian Hidayat'];
        const randomName = customName || googleNames[Math.floor(Math.random() * googleNames.length)];
        const email = randomName.toLowerCase().replace(/\s+/g, '.') + '@gmail.com';
        
        // Use DiceBear friendly pastel avatar
        const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(randomName)}&backgroundColor=b8a9e8,ffb5a7,a8e6cf`;

        set({
          user: {
            id: 'google_' + Math.random().toString(36).substring(2, 11),
            name: randomName,
            email,
            photoURL: avatarUrl,
            isGuest: false,
            provider: 'google',
          },
          hasChosenMode: true,
          isAuthModalOpen: false,
        });
      },

      logout: () => {
        set({
          user: null,
          hasChosenMode: false,
          isAuthModalOpen: true,
        });
      },

      openAuthModal: () => set({ isAuthModalOpen: true }),
      closeAuthModal: () => {
        // If user hasn't chosen a mode yet, default to guest
        if (!get().hasChosenMode) {
          get().continueAsGuest();
        } else {
          set({ isAuthModalOpen: false });
        }
      },
    }),
    {
      name: 'mathbrain-auth-storage',
      partialize: (state) => ({
        user: state.user,
        hasChosenMode: state.hasChosenMode,
      }),
    }
  )
);
