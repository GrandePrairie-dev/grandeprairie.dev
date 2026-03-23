-- Profiles (staggered join dates for realism)
INSERT INTO profiles (name, username, title, role, skills, badges, links, is_featured, is_admin, created_at) VALUES
('CJ Elliott', 'cjelliott', 'Founder, GrandePrairie.dev', 'founder', '["TypeScript","React","Cloudflare","AI"]', '["founder"]', '{"github":"cjelliott","linkedin":"cjelliott"}', 1, 1, '2026-01-15 09:00:00'),
('Sarah Chen', 'sarahc', 'Full-Stack Developer', 'developer', '["Python","Django","PostgreSQL","Docker"]', '[]', '{"github":"sarahchen"}', 1, 0, '2026-01-22 14:30:00'),
('Mike Blackfoot', 'mikeb', 'Journeyman Electrician & IoT Hobbyist', 'trades', '["Electrical","PLC","Arduino","Home Automation"]', '[]', '{}', 0, 0, '2026-02-03 11:15:00'),
('Aisha Patel', 'aishap', 'CS Student, NW Polytechnic', 'student', '["Java","Python","Machine Learning"]', '[]', '{}', 0, 0, '2026-02-10 16:45:00'),
('Derek Olsen', 'dereko', 'Pipeline Operations Manager', 'operator', '["SCADA","Data Analysis","Safety Systems"]', '["mentor"]', '{}', 1, 0, '2026-02-14 08:00:00'),
('Lisa Makokis', 'lisam', 'Senior Developer & Community Mentor', 'mentor', '["JavaScript","React","Node.js","Career Coaching"]', '["mentor"]', '{"linkedin":"lisamakokis","website":"lisamakokis.dev"}', 1, 0, '2026-01-28 10:00:00'),
('James Whitford', 'jamesw', 'Startup Founder, PrairieAg Tech', 'founder', '["Agtech","Computer Vision","Business Development"]', '[]', '{"website":"prairieagtech.ca"}', 0, 0, '2026-02-20 13:00:00'),
('Priya Sharma', 'priyas', 'Data Scientist, Energy Sector', 'developer', '["Python","R","Machine Learning","Tableau"]', '[]', '{"github":"priyasharma"}', 0, 0, '2026-03-01 09:30:00'),
('Tyler Makokis', 'tylerm', 'Web Developer & Designer', 'developer', '["React","Figma","Tailwind","UI/UX"]', '[]', '{"github":"tylermakokis"}', 0, 0, '2026-03-05 15:00:00'),
('Emma Bouchard', 'emmab', 'Mechatronics Student, NW Polytechnic', 'student', '["C++","Robotics","3D Printing","CAD"]', '[]', '{}', 0, 0, '2026-03-12 11:00:00');

-- Ideas (all with descriptions)
INSERT INTO ideas (title, description, category, author_id, votes, status, is_featured, tags) VALUES
('Field Data Collection AI', 'Replace paper forms with AI-powered mobile data capture for oil & gas inspections. Use OCR and ML to auto-fill safety checklists from photos of handwritten forms, reducing data entry time by 80% and eliminating transcription errors.', 'ai_use_case', NULL, 14, 'open', 1, '["Oil & Gas","Mobile","OCR"]'),
('GP Cowork Finder', 'Interactive map of coworking-friendly spots in Grande Prairie — cafes with good wifi, the public library, quiet spaces with power outlets. Crowd-sourced ratings for noise level, wifi speed, and seating availability.', 'problem', NULL, 9, 'open', 1, '["Map","Community","Coworking"]'),
('Predictive Maintenance for Rigs', 'Use sensor data and ML models to predict equipment failures on drilling rigs before they happen. Start with vibration analysis on pumps and compressors — the most common failure points. Could save operators millions in unplanned downtime.', 'ai_use_case', NULL, 7, 'open', 0, '["ML","IoT","Industrial"]'),
('Student Mentorship Matching', 'Platform to match NW Polytechnic students with local tech mentors based on skills and career interests. Monthly check-ins, project pairing, and portfolio reviews. Start with Computing Science and IT students.', 'student_idea', NULL, 6, 'open', 0, '["Mentorship","Students","Matching"]'),
('Automated Safety Compliance', 'Computer vision for PPE detection on construction and oil field sites. Camera system that alerts supervisors when workers enter restricted zones without hard hats, safety glasses, or FR clothing. Real-time dashboard with compliance rates.', 'field_pain_point', NULL, 5, 'open', 0, '["Safety","CV","Construction"]'),
('Local Delivery Optimization', 'ML-driven route optimization for Northern Alberta delivery challenges — winter road conditions, long distances between stops, seasonal weight restrictions. Built for the peace region''s geography, not downtown Toronto.', 'startup', NULL, 4, 'open', 0, '["Logistics","ML","Optimization"]'),
('Community Job Board', 'Tech-focused job board for Grande Prairie and Peace Region. Filter by remote-friendly, trades-tech hybrid, software, data, and more. Include salary transparency and link to local housing costs so people can actually evaluate opportunities.', 'business_need', NULL, 3, 'open', 0, '["Jobs","Community","HR"]'),
('Open Data Portal for GP', 'Aggregate public datasets about Grande Prairie — census demographics, weather history, building permits, economic indicators — into a developer-friendly REST API. Make it easy for civic tech projects and student assignments to use real local data.', 'problem', NULL, 2, 'open', 0, '["Open Data","API","Civic Tech"]'),
('Forestry Cut Block Monitoring', 'Use satellite imagery and drone data to monitor reforestation progress on Canfor and Weyerhaeuser cut blocks across the Peace Region. Track seedling survival rates, compare planned vs actual regrowth, and generate compliance reports automatically.', 'ai_use_case', NULL, 5, 'open', 1, '["Forestry","Satellite","Drones"]'),
('Smart Grain Bin Sensors', 'Low-cost IoT sensor network for grain bins — temperature, moisture, CO2 monitoring. Alert farmers via SMS before spoilage starts. Designed to work offline in rural areas with intermittent cell coverage using LoRaWAN mesh networking.', 'startup', NULL, 4, 'open', 0, '["AgTech","IoT","Sensors"]');

-- Projects (2 seed projects so the counter isn't zero)
INSERT INTO projects (title, description, category, status, repo_url, author_id, tags, is_featured, created_at) VALUES
('GrandePrairie.dev', 'This platform — the community hub you''re looking at right now. Built with React, Cloudflare Pages, and D1. Open source and accepting contributors.', 'web', 'active', 'https://github.com/GrandePrairie-dev/grandeprairie.dev', NULL, '["React","Cloudflare","TypeScript","Open Source"]', 1, '2026-01-15 09:00:00'),
('GP Weather Dashboard', 'Real-time weather dashboard pulling Environment Canada data for Grande Prairie and surrounding areas. Includes wind chill, road conditions, and pipeline operations weather alerts.', 'data', 'active', NULL, NULL, '["Python","API","Weather","Dashboard"]', 0, '2026-02-28 14:00:00');

-- Events (using verifiable or clearly generic venues)
INSERT INTO events (title, description, category, start_time, location, organizer_id) VALUES
('Tech & Coffee', 'Casual morning meetup for anyone who builds things — code, circuits, or business plans. All levels welcome. Show up with a project or just curiosity.', 'meetup', datetime('now', '+6 days', 'start of day', '+9 hours'), 'Grande Prairie Public Library', NULL),
('Intro to Machine Learning', 'Workshop covering ML fundamentals with Python. Bring a laptop with Python installed. We''ll work through a real dataset together.', 'workshop', datetime('now', '+13 days', 'start of day', '+18 hours'), 'NW Polytechnic', NULL),
('GP Hackathon: Build for Local', '24-hour hackathon focused on solving Grande Prairie problems. Teams of 2-4. Prizes for best local impact.', 'hackathon', datetime('now', '+27 days', 'start of day', '+9 hours'), 'Venue TBD — Grande Prairie', NULL),
('Lightning Talks Night', '5-minute talks on anything tech. Sign up on the day. Pizza provided. Past topics: home automation, SCADA security, React hooks.', 'talk', datetime('now', '+20 days', 'start of day', '+19 hours'), 'Grande Prairie Public Library', NULL),
('Founders Lunch', 'Monthly lunch for startup founders and aspiring entrepreneurs in the Peace Region. Informal — just show up and talk shop.', 'social', datetime('now', '+34 days', 'start of day', '+12 hours'), 'Downtown Grande Prairie (TBD)', NULL);

-- Intel (staggered dates, all with body content)
INSERT INTO intel (title, body, category, source_url, author_id, is_pinned, is_featured, tags, created_at) VALUES
('GrandePrairie.dev is live!', 'Welcome to the community platform. Start by creating a profile and sharing your first idea. We''re building this together — feedback welcome.', 'project_activity', NULL, NULL, 1, 0, '["Launch","Community"]', '2026-03-15 09:00:00'),
('Greenview Data Centre Project Update', 'The proposed large-scale data centre project near Greenview has entered environmental review. If approved, it could bring significant tech employment to the region over the next decade.', 'industry', NULL, NULL, 1, 1, '["AI","Data Centre","Greenview"]', '2026-03-10 14:00:00'),
('NW Polytechnic Computing Science Programs', 'Northwestern Polytechnic offers a 4-year Computing Science degree with specializations in AI, cloud computing, networking, and big data. Also runs Venture AI events connecting students with local businesses exploring AI applications.', 'opportunity', NULL, NULL, 0, 1, '["NWP","Education","Computing"]', '2026-02-25 10:00:00'),
('AWS Activate — Free Credits for Startups', 'AWS Activate offers up to $100K in credits for early-stage startups, plus technical support and training. Peace Region founders building cloud-native products should check eligibility.', 'opportunity', NULL, NULL, 0, 0, '["AWS","Startups","Funding","Cloud"]', '2026-02-18 16:00:00');

-- Business Requests (staggered dates)
INSERT INTO business_requests (business_name, contact_name, contact_email, problem, category, status, created_at) VALUES
('Prairie Mechanical Ltd', 'Ron Tessier', 'ron@prairiemech.ca', 'We still use paper work orders. Need a mobile app that our techs can use in the field — even offline. Must work with gloves on touchscreens.', 'automation', 'new', '2026-03-08 11:00:00'),
('Northern Grounds Coffee', 'Jess Park', 'jess@northerngrounds.ca', 'Our website is from 2018 and doesn''t show our menu or hours properly on mobile. Need a modern refresh that we can update ourselves.', 'website', 'new', '2026-03-14 09:30:00'),
('GP Grain Co-op', 'Dan Wright', 'dan@gpgraincoop.ca', 'We want to use drone imagery and AI to estimate grain bin levels instead of climbing ladders to check. Safety and efficiency improvement.', 'ai', 'new', '2026-03-18 14:00:00');

-- Student Resources
INSERT INTO student_resources (title, description, resource_type, difficulty, link, tags) VALUES
('Build Your First React App', 'Step-by-step tutorial to build a todo app with React and deploy to Cloudflare Pages. No prior React experience needed.', 'beginner_project', 'beginner', NULL, '["React","Cloudflare","Tutorial"]'),
('Python for Data Science Path', 'Curated learning path from Python basics through pandas, numpy, and matplotlib. Designed for NWP Computing Science students.', 'learning_path', 'intermediate', NULL, '["Python","Data Science","Learning"]'),
('NWP Work-Integrated Learning', 'Northwestern Polytechnic''s work-integrated learning program connects students with local employers for co-op and practicum placements.', 'internship', NULL, NULL, '["NWP","Co-op","Work Experience"]');
