import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

export const POST = async () => {
  const state = store.getSerializedState();

  if (!state.choicesConfirmed) {
    return Response.json({ error: 'choices not confirmed' }, { status: 400 });
  }

  const validChoices = state.choices.filter((c) => c.trim() !== '');
  if (validChoices.length === 0) {
    return Response.json({ error: 'at least one non-empty choice required' }, { status: 400 });
  }

  store.randomizeAndBroadcast(validChoices);
  return Response.json({ ok: true });
};
