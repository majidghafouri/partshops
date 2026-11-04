import type { RealtimeEvent } from "./types";

interface Client {
  id: string;
  userId: string;
  send: (event: RealtimeEvent) => void;
}

const globalForRealtime = globalThis as unknown as {
  __partshopRealtimeClients?: Map<string, Map<string, Client>>;
};

const clients =
  globalForRealtime.__partshopRealtimeClients ??
  (globalForRealtime.__partshopRealtimeClients = new Map<string, Map<string, Client>>());

export function addRealtimeClient(
  userId: string,
  send: (event: RealtimeEvent) => void
): () => void {
  const clientId = crypto.randomUUID();
  let userClients = clients.get(userId);
  if (!userClients) {
    userClients = new Map();
    clients.set(userId, userClients);
  }
  userClients.set(clientId, { id: clientId, userId, send });

  return () => {
    const current = clients.get(userId);
    if (!current) return;
    current.delete(clientId);
    if (current.size === 0) clients.delete(userId);
  };
}

export function publishToUser(userId: string, event: RealtimeEvent): void {
  const userClients = clients.get(userId);
  if (!userClients) return;
  const payload = { ...event, at: event.at ?? Date.now() };
  for (const client of userClients.values()) {
    try {
      client.send(payload);
    } catch {
      // client disconnected; it will be removed by its abort handler
    }
  }
}

export function publishToUsers(userIds: string[], event: RealtimeEvent): void {
  for (const userId of new Set(userIds)) {
    publishToUser(userId, event);
  }
}

export function connectedUserCount(): number {
  return clients.size;
}
