import { type NextRequest } from 'next/server';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = (request: NextRequest) => {
  const existingId = request.cookies.get('userId')?.value;
  const userId = existingId ?? crypto.randomUUID();

  const headers: HeadersInit = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  };
  if (!existingId) {
    headers['Set-Cookie'] = `userId=${userId}; Path=/; HttpOnly; SameSite=Lax`;
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      store.registerUser(userId, controller);
    },
    cancel() {
      store.removeUser(userId);
    },
  });

  return new Response(stream, { headers });
}
