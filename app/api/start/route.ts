import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

export const POST = async (request: Request) => {
  const body = await request.json() as { choices?: unknown };
  const choices = body.choices;

  if (!Array.isArray(choices) || choices.length === 0) {
    return Response.json({ error: 'choices required' }, { status: 400 });
  }

  const validChoices = (choices as unknown[])
    .filter((c): c is string => typeof c === 'string' && c.trim() !== '');

  if (validChoices.length === 0) {
    return Response.json({ error: 'at least one non-empty choice required' }, { status: 400 });
  }

  store.randomizeAndBroadcast(validChoices);
  return Response.json({ ok: true });
}
