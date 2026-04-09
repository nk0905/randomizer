import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

export const POST = async (request: Request) => {
  const { choices } = await request.json() as { choices: string[] };
  const validChoices = choices.filter((c) => c.trim() !== '');

  if (validChoices.length === 0) {
    return Response.json({ error: 'at least one non-empty choice required' }, { status: 400 });
  }

  store.randomizeAndBroadcast(validChoices);
  return Response.json({ ok: true });
}
