import { store } from '@/lib/store';

export const POST = async (request: Request) => {
  const { choices } = await request.json() as { choices: string[] };

  store.updateChoices(choices);
  return Response.json({ ok: true });
};
