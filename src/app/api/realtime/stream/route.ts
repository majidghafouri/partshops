import { getSessionUser } from "@/lib/auth";
import { addRealtimeClient } from "@/lib/realtime";
import type { RealtimeEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let unsubscribe = () => {};
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const enqueue = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // stream already closed
        }
      };

      const send = (event: RealtimeEvent) => {
        enqueue(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
      };

      enqueue("retry: 3000\n\n");
      send({ type: "connected", title: "اتصال زنده برقرار شد" });

      unsubscribe = addRealtimeClient(user.id, send);

      heartbeat = setInterval(() => {
        enqueue(`: ping ${Date.now()}\n\n`);
      }, 20000);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        if (heartbeat) clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      request.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      closed = true;
      if (heartbeat) clearInterval(heartbeat);
      unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
