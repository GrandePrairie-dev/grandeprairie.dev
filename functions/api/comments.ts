interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const ideaId = url.searchParams.get("idea_id");
  const projectId = url.searchParams.get("project_id");

  if (!ideaId && !projectId) {
    return Response.json(
      { error: "Required: idea_id or project_id query parameter" },
      { status: 400 },
    );
  }

  let query =
    "SELECT c.*, p.name as author_name FROM comments c LEFT JOIN profiles p ON c.author_id = p.id";
  const bindings: unknown[] = [];

  if (ideaId) {
    query += " WHERE c.idea_id = ?";
    bindings.push(ideaId);
  } else {
    query += " WHERE c.project_id = ?";
    bindings.push(projectId);
  }

  query += " ORDER BY c.created_at ASC";

  const { results } = await env.DB.prepare(query).bind(...bindings).all();
  return Response.json(results);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json<Record<string, unknown>>();
  const { content, idea_id, project_id } = body;

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return Response.json({ error: "content is required" }, { status: 400 });
  }

  if (content.length > 2000) {
    return Response.json({ error: "content must be under 2000 characters" }, { status: 400 });
  }

  if (!idea_id && !project_id) {
    return Response.json({ error: "idea_id or project_id is required" }, { status: 400 });
  }

  // author_id is null until auth is implemented — comments are anonymous for now
  const result = await env.DB.prepare(
    `INSERT INTO comments (content, author_id, idea_id, project_id)
     VALUES (?, NULL, ?, ?)`,
  )
    .bind(content, idea_id ?? null, project_id ?? null)
    .run();

  return Response.json({ id: result.meta.last_row_id }, { status: 201 });
};
