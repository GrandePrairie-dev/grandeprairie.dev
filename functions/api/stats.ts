interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const [profiles, ideas, events, projects, open_requests, mentors, organizations] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) as count FROM profiles").first<{ count: number }>(),
    env.DB.prepare("SELECT COUNT(*) as count FROM ideas").first<{ count: number }>(),
    env.DB.prepare("SELECT COUNT(*) as count FROM events WHERE start_time >= datetime('now')").first<{ count: number }>(),
    env.DB.prepare("SELECT COUNT(*) as count FROM projects").first<{ count: number }>(),
    env.DB.prepare("SELECT COUNT(*) as count FROM business_requests WHERE status IN ('new', 'reviewed')").first<{ count: number }>(),
    env.DB.prepare("SELECT COUNT(*) as count FROM profiles WHERE mentor_available = 1").first<{ count: number }>(),
    env.DB.prepare("SELECT COUNT(*) as count FROM organizations").first<{ count: number }>(),
  ]);

  return Response.json({
    profiles: profiles?.count ?? 0,
    ideas: ideas?.count ?? 0,
    events: events?.count ?? 0,
    projects: projects?.count ?? 0,
    open_requests: open_requests?.count ?? 0,
    mentors: mentors?.count ?? 0,
    organizations: organizations?.count ?? 0,
  });
};
