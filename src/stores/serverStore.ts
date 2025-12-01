// src/stores/serverStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KavitaClient } from '../api/kavitaClient';
import { KavitaServer } from '../types/kavita';

// ✅ FIX: Cache clients to prevent creating new instances on every call
const clientCache = new Map<string, KavitaClient>();

interface ServerState {
  servers: KavitaServer[];
  primaryServerId: string | null;
  
  // Server management
  addServer: (server: Omit<KavitaServer, 'id'>) => void;
  removeServer: (id: string) => void;
  updateServer: (id: string, updates: Partial<KavitaServer>) => void;
  setPrimaryServer: (id: string) => void;
  
  // Client getters
  getPrimaryClient: () => KavitaClient | null;
  getActiveClient: () => KavitaClient | null;
  getClientForServer: (serverId: string) => KavitaClient | null;
  getAllClients: () => { serverId: string; client: KavitaClient; server: KavitaServer }[];
  
  // Multi-server queries
  searchSeriesAcrossServers: (seriesName: string) => Promise<any[]>;
  getServersWithSeries: (seriesName: string) => Promise<string[]>;
}

export const useServerStore = create<ServerState>()(
  persist(
    (set, get) => ({
      servers: [],
      primaryServerId: null,

      addServer: (serverData) => {
        const server: KavitaServer = {
          ...serverData,
          id: Date.now().toString(),
        };
        
        set((state) => {
          const isPrimaryServer = state.servers.length === 0;
          return {
            servers: [...state.servers, server],
            primaryServerId: isPrimaryServer ? server.id : state.primaryServerId,
          };
        });
      },

      removeServer: (id) => {
        // Clear client from cache
        clientCache.delete(id);
        
        set((state) => {
          const newServers = state.servers.filter((s) => s.id !== id);
          const newPrimaryId = state.primaryServerId === id 
            ? (newServers.length > 0 ? newServers[0].id : null)
            : state.primaryServerId;
            
          return {
            servers: newServers,
            primaryServerId: newPrimaryId,
          };
        });
      },

      updateServer: (id, updates) => {
        // Clear client from cache so it gets recreated with new settings
        clientCache.delete(id);
        
        set((state) => ({
          servers: state.servers.map((s) => 
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },

      setPrimaryServer: (id) => {
        set({ primaryServerId: id });
      },

      getPrimaryClient: () => {
        const state = get();
        const serverId = state.primaryServerId || (state.servers.length > 0 ? state.servers[0].id : null);
        
        if (!serverId) return null;
        
        // ✅ FIX: Return cached client if exists
        if (clientCache.has(serverId)) {
          return clientCache.get(serverId)!;
        }
        
        const server = state.servers.find((s) => s.id === serverId);
        if (server) {
          const client = new KavitaClient(server.url);
          clientCache.set(serverId, client);
          return client;
        }
        
        return null;
      },

      getActiveClient: () => {
        return get().getPrimaryClient();
      },

      getClientForServer: (serverId: string) => {
        // ✅ FIX: Return cached client if exists
        if (clientCache.has(serverId)) {
          return clientCache.get(serverId)!;
        }
        
        const server = get().servers.find((s) => s.id === serverId);
        if (server) {
          const client = new KavitaClient(server.url);
          clientCache.set(serverId, client);
          return client;
        }
        return null;
      },

      getAllClients: () => {
        const servers = get().servers;
        return servers.map(server => {
          // ✅ FIX: Use cached clients
          let client = clientCache.get(server.id);
          if (!client) {
            client = new KavitaClient(server.url);
            clientCache.set(server.id, client);
          }
          
          return {
            serverId: server.id,
            server: server,
            client: client
          };
        });
      },

      searchSeriesAcrossServers: async (seriesName: string) => {
        const allClients = get().getAllClients();
        const results = [];

        for (const { serverId, client, server } of allClients) {
          try {
            const libraries = await client.getLibraries();
            
            for (const library of libraries) {
              const series = await client.getSeries(library.id, 0, 100);
              const matches = series.filter((s: any) => 
                s.name?.toLowerCase().includes(seriesName.toLowerCase())
              );
              
              for (const match of matches) {
                results.push({
                  ...match,
                  serverId,
                  serverName: server.name,
                  serverUrl: server.url,
                  libraryId: library.id,
                  libraryName: library.name,
                });
              }
            }
          } catch (error) {
            console.log(`❌ Failed to search server ${server.name}:`, error);
          }
        }

        return results;
      },

      getServersWithSeries: async (seriesName: string) => {
        const results = await get().searchSeriesAcrossServers(seriesName);
        const serverIds = [...new Set(results.map(r => r.serverId))];
        return serverIds;
      },
    }),
    {
      name: 'kavita-server-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        servers: state.servers,
        primaryServerId: state.primaryServerId,
      }),
    }
  )
);