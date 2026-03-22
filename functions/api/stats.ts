interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const [profiles, ideas, events, projects] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) as count FROM profiles").first<{ count: number }>(),
    env.DB.prepare("SELECT COUNT(*) as count FROM ideas").first<{ count: number }>(),
    env.DB.prepare("SELECT COUNT(*) as count FROM events WHERE start_time >= datetime('now')").first<{ count: number }>(),
    env.DB.prepare("SELECT COUNT(*) as count FROM projects").first<{ count: number }>(),
  ]);

  return Response.json({
    profiles: profiles?.count ?? 0,
    ideas: ideas?.count ?? 0,
    events: events?.count ?? 0,
    projects: projects?.count ?? 0,
  });
};
