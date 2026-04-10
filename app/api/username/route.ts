import { type NextRequest } from 'next/server';
import { store } from '@/lib/store';

export const POST = async (request: NextRequest) => {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) {
    return Response.json({ error: 'not connected' }, { status: 400 });
  }

  const { username } = await request.json() as { username: string };
  store.setUsername(userId, username);
  return Response.json({ ok: true });
};
