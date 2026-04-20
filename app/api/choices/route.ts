import { type NextRequest } from 'next/server';
import { store } from '@/lib/store';

export const POST = async (request: NextRequest) => {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const { choices } = await request.json() as { choices: string[] };
  const ok = store.confirmChoices(userId, choices);
  if (!ok) return Response.json({ error: 'forbidden' }, { status: 403 });

  return Response.json({ ok: true });
};
