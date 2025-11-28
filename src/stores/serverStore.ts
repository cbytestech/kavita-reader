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
  clearServers: () => void;
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
        
        set((state) => {
          const newServers = [...state.servers, server];
          // Set as active if it's the first server
          const newActiveId = state.servers.length === 0 ? server.id : state.activeServerId;
          
          // Create client if this becomes active
          let newClient = state.activeClient;
          if (newActiveId === server.id) {
            newClient = new KavitaClient(server.url);
          }
          
          return {
            servers: newServers,
            activeServerId: newActiveId,
            activeClient: newClient,
          };
        });
      },

      removeServer: (id) => {
        set((state) => {
          const newServers = state.servers.filter((s) => s.id !== id);
          const wasActive = state.activeServerId === id;
          
          return {
            servers: newServers,
            activeServerId: wasActive ? null : state.activeServerId,
            activeClient: wasActive ? null : state.activeClient,
          };
        });
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
        
        // If we have a client, return it
        if (state.activeClient) {
          return state.activeClient;
        }
        
        // If we have an active server ID but no client, create one
        if (state.activeServerId) {
          const server = state.servers.find((s) => s.id === state.activeServerId);
          if (server) {
            const client = new KavitaClient(server.url);
            set({ activeClient: client });
            return client;
          }
        }
        
        // If we have servers but no active one, use the first server
        if (state.servers.length > 0) {
          const firstServer = state.servers[0];
          const client = new KavitaClient(firstServer.url);
          set({ 
            activeServerId: firstServer.id,
            activeClient: client 
          });
          return client;
        }
        
        return null;
      },

      clearServers: () => {
        set({ 
          servers: [], 
          activeServerId: null, 
          activeClient: null 
        });
      },
    }),
    {
      name: 'kavita-server-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the servers list and active ID, not the client instance
      partialize: (state) => ({
        servers: state.servers,
        activeServerId: state.activeServerId,
      }),
    }
  )
);