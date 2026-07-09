import type { Env } from "./lib/env";
import { applyDynamicHtmlSeo } from "./lib/html-seo";

export const onRequest: PagesFunction<Env> = async (context) => {
  const response = await context.next();
  return applyDynamicHtmlSeo(context.request, context.env, response);
};
