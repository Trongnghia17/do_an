import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuth = create()(
  persist(
    (set) => ({
      token: null,
      user: null,
      initialized: false,
      setToken: (t) => set({ token: t }),
      setUser: (u) => set({ user: u }),
      logout: () => set({ token: null, user: null }),
      setInitialized: (v) => set({ initialized: v }),
    }),
    {
      name: 'owl-auth',
      onRehydrateStorage: () => (state) => {
        // khi state load xong từ localStorage
        state?.setInitialized(true);
      },
    }
  )
);

export default useAuth;
