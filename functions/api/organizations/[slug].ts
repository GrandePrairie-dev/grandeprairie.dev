import type { Env } from "../../lib/env";

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const org = await env.DB.prepare("SELECT * FROM organizations WHERE slug = ?")
    .bind(params.slug).first();
  if (!org) return new Response("Not found", { status: 404 });

  // Get members
  const { results: members } = await env.DB.prepare(
    `SELECT p.id, p.name, p.username, p.title, p.role, p.avatar_url, p.skills, om.title as org_title
     FROM organization_members om
     JOIN profiles p ON om.profile_id = p.id
     WHERE om.organization_id = ?`
  ).bind((org as any).id).all();

  // Get projects
  const { results: projects } = await env.DB.prepare(
    `SELECT p.id, p.title, p.description, p.status, p.tags
     FROM organization_projects op
     JOIN projects p ON op.project_id = p.id
     WHERE op.organization_id = ?`
  ).bind((org as any).id).all();

  return Response.json({ ...org, members, projects });
};
