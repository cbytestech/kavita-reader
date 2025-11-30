import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KavitaClient } from '../api/kavitaClient';
import { KavitaServer } from '../types/kavita';

interface ServerState {
  servers: KavitaServer[];
  activeServerId: string | null;
  activeClient: KavitaClient | null;
  addServer: (server: Omit<KavitaServer, 'id'>) => void;
  removeServer: (id: string) => void;
  setActiveServer: (id: string) => void;
  getActiveClient: () => KavitaClient | null;
}

export const useServerStore = create<ServerState>()(
  persist(
    (set, get) => ({
      servers: [],
      activeServerId: null,
      activeClient: null,

      addServer: (serverData) => {
        const server: KavitaServer = {
          ...serverData,
          id: Date.now().toString(),
        };
        set((state) => ({
          servers: [...state.servers, server],
          activeServerId: state.servers.length === 0 ? server.id : state.activeServerId,
        }));
      },

      removeServer: (id) => {
        set((state) => ({
          servers: state.servers.filter((s) => s.id !== id),
          activeServerId: state.activeServerId === id ? null : state.activeServerId,
        }));
      },

      setActiveServer: (id) => {
        const server = get().servers.find((s) => s.id === id);
        if (server) {
          const client = new KavitaClient(server.url);
          set({ activeServerId: id, activeClient: client });
        }
      },

      getActiveClient: () => {
        const state = get();
        if (state.activeClient) {
          return state.activeClient;
        }
        if (state.activeServerId) {
          const server = state.servers.find((s) => s.id === state.activeServerId);
          if (server) {
            const client = new KavitaClient(server.url);
            set({ activeClient: client });
            return client;
          }
        }
        return null;
      },
    }),
    {
      name: 'kavita-server-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        servers: state.servers,
        activeServerId: state.activeServerId,
      }),
    }
  )
);