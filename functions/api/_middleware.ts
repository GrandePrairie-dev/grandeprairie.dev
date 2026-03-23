import { getSession } from "../lib/auth";
import type { Env } from "../lib/env";

export const onRequest: PagesFunction<Env> = async (context) => {
  const user = await getSession(context.request, context.env);
  context.data.user = user;
  return context.next();
};
