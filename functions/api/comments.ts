interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const ideaId = url.searchParams.get("idea_id");
  const projectId = url.searchParams.get("project_id");

  let query =
    "SELECT c.*, p.name as author_name FROM comments c LEFT JOIN profiles p ON c.author_id = p.id";
  const bindings: unknown[] = [];

  if (ideaId) {
    query += " WHERE c.idea_id = ?";
    bindings.push(ideaId);
  } else if (projectId) {
    query += " WHERE c.project_id = ?";
    bindings.push(projectId);
  }

  query += " ORDER BY c.created_at ASC";

  const stmt = env.DB.prepare(query);
  const { results } =
    bindings.length > 0 ? await stmt.bind(...bindings).all() : await stmt.all();
  return Response.json(results);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json<Record<string, unknown>>();
  const { content, author_id, idea_id, project_id } = body;

  const result = await env.DB.prepare(
    `INSERT INTO comments (content, author_id, idea_id, project_id)
     VALUES (?, ?, ?, ?)`,
  )
    .bind(content, author_id ?? null, idea_id ?? null, project_id ?? null)
    .run();

  return Response.json({ id: result.meta.last_row_id }, { status: 201 });
};
