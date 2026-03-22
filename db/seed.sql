-- Profiles
INSERT INTO profiles (name, username, title, role, skills, badges, links, is_featured, is_admin) VALUES
('CJ Elliott', 'cjelliott', 'Founder, GrandePrairie.dev', 'founder', '["TypeScript","React","Cloudflare","AI"]', '["founder"]', '{"github":"cjelliott","linkedin":"cjelliott"}', 1, 1),
('Sarah Chen', 'sarahc', 'Full-Stack Developer', 'developer', '["Python","Django","PostgreSQL","Docker"]', '[]', '{"github":"sarahchen"}', 1, 0),
('Mike Blackfoot', 'mikeb', 'Journeyman Electrician & IoT Hobbyist', 'trades', '["Electrical","PLC","Arduino","Home Automation"]', '[]', '{}', 0, 0),
('Aisha Patel', 'aishap', 'CS Student, NW Polytechnic', 'student', '["Java","Python","Machine Learning"]', '[]', '{}', 0, 0),
('Derek Olsen', 'dereko', 'Pipeline Operations Manager', 'operator', '["SCADA","Data Analysis","Safety Systems"]', '[]', '{}', 1, 0),
('Lisa Makokis', 'lisam', 'Senior Developer & Community Mentor', 'mentor', '["JavaScript","React","Node.js","Career Coaching"]', '["mentor"]', '{"linkedin":"lisamakokis","website":"lisamakokis.dev"}', 1, 0),
('James Whitford', 'jamesw', 'Startup Founder, AgriSense', 'founder', '["Agtech","Computer Vision","Business Development"]', '[]', '{"website":"agrisense.ca"}', 0, 0),
('Priya Sharma', 'priyas', 'Data Scientist, Energy Sector', 'developer', '["Python","R","Machine Learning","Tableau"]', '[]', '{"github":"priyasharma"}', 0, 0),
('Tyler Running Rabbit', 'tylerr', 'Web Developer & Designer', 'developer', '["React","Figma","Tailwind","UI/UX"]', '[]', '{"github":"tylerrunningrabbit"}', 0, 0),
('Emma Bouchard', 'emmab', 'Mechatronics Student, GPRC', 'student', '["C++","Robotics","3D Printing","CAD"]', '[]', '{}', 0, 0);

-- Ideas
INSERT INTO ideas (title, description, category, author_id, votes, status, is_featured, tags) VALUES
('Field Data Collection AI', 'Replace paper forms with AI-powered mobile data capture for oil & gas inspections. Use OCR and ML to auto-fill safety checklists from photos.', 'ai_use_case', 1, 14, 'open', 1, '["Oil & Gas","Mobile","OCR"]'),
('GP Cowork Finder', 'Interactive map of coworking-friendly spots in Grande Prairie — cafes, library, spaces with good wifi and power.', 'problem', 9, 9, 'open', 1, '["Map","Community","Coworking"]'),
('Predictive Maintenance for Rigs', 'Use sensor data and ML models to predict equipment failures on drilling rigs before they happen.', 'ai_use_case', 5, 7, 'open', 0, '["ML","IoT","Industrial"]'),
('Student Mentorship Matching', 'Platform to match NWP/GPRC students with local tech mentors based on skills and career interests.', 'student_idea', 4, 6, 'open', 0, '["Mentorship","Students","Matching"]'),
('Automated Safety Compliance', 'Computer vision for PPE detection on construction and oil field sites. Alert when workers enter zones without proper equipment.', 'field_pain_point', 5, 5, 'open', 0, '["Safety","CV","Construction"]'),
('Local Delivery Optimization', 'ML-driven route optimization for Northern Alberta delivery challenges — weather, distances, seasonal roads.', 'startup', 8, 4, 'open', 0, '["Logistics","ML","Optimization"]'),
('Community Job Board', 'Tech-focused job board for Grande Prairie and Peace Region. Filter by remote-friendly, trades, tech, etc.', 'business_need', 6, 3, 'open', 0, '["Jobs","Community","HR"]'),
('Open Data Portal for GP', 'Aggregate public datasets about Grande Prairie — census, weather, economic indicators — into a developer-friendly API.', 'problem', 2, 2, 'open', 0, '["Open Data","API","Civic Tech"]');

-- Events
INSERT INTO events (title, description, category, start_time, location, organizer_id) VALUES
('Tech & Coffee', 'Casual morning meetup. Bring your laptop, grab a coffee, hack on projects together.', 'meetup', datetime('now', '+6 days', 'start of day', '+9 hours'), 'Beans & Bytes Cafe, GP', 1),
('Intro to Machine Learning', 'Workshop covering ML fundamentals with Python. Bring a laptop with Python installed.', 'workshop', datetime('now', '+13 days', 'start of day', '+18 hours'), 'NW Polytechnic Room 204', 6),
('GP Hackathon: Build for Local', '24-hour hackathon focused on solving Grande Prairie problems. Teams of 2-4.', 'hackathon', datetime('now', '+27 days', 'start of day', '+9 hours'), 'Innovation Hub, GP', 1),
('Lightning Talks Night', '5-minute talks on anything tech. Sign up on the day. Pizza provided.', 'talk', datetime('now', '+20 days', 'start of day', '+19 hours'), 'GP Public Library Meeting Room', 9),
('Founders Lunch', 'Monthly lunch for startup founders and aspiring entrepreneurs in the Peace Region.', 'social', datetime('now', '+34 days', 'start of day', '+12 hours'), 'Prairie Bistro, GP', 7);

-- Intel
INSERT INTO intel (title, body, category, source_url, author_id, is_pinned, is_featured, tags) VALUES
('NW Polytechnic hiring 2 dev instructors', 'Northwestern Polytechnic is looking for instructors in web development and data science. Full-time positions starting Fall 2026.', 'hiring', NULL, 6, 0, 1, '["NWP","Teaching","Hiring"]'),
('Greenview AI Data Centre Update', 'The proposed $70B AI data centre project in Greenview has entered Phase 2 environmental review. Could bring 500+ tech jobs to the region.', 'industry', NULL, 1, 1, 1, '["AI","Data Centre","Greenview"]'),
('GrandePrairie.dev is live!', 'Welcome to the community platform. Start by creating a profile and sharing your first idea.', 'project_activity', NULL, 1, 1, 0, '["Launch","Community"]'),
('Free AWS Credits for Startups', 'AWS Activate is offering $10K in credits for early-stage startups. Great for Peace Region founders building cloud-native products.', 'opportunity', NULL, 2, 0, 0, '["AWS","Startups","Funding"]');

-- Business Requests
INSERT INTO business_requests (business_name, contact_name, contact_email, problem, category, status) VALUES
('Prairie Mechanical Ltd', 'Ron Tessier', 'ron@prairiemech.ca', 'We still use paper work orders. Need a mobile app that our techs can use in the field — even offline. Must work with gloves.', 'automation', 'new'),
('Northern Grounds Coffee', 'Jess Park', 'jess@northerngrounds.ca', 'Our website is from 2018 and doesn''t show our menu or hours properly on mobile. Need a modern refresh.', 'website', 'new'),
('GP Grain Elevators Co-op', 'Dan Makokis', 'dan@gpgrain.ca', 'We want to use drone imagery and AI to estimate grain bin levels instead of climbing ladders to check.', 'ai', 'new');

-- Student Resources
INSERT INTO student_resources (title, description, resource_type, difficulty, link, tags) VALUES
('Build Your First React App', 'Step-by-step tutorial to build a todo app with React and deploy to Cloudflare Pages.', 'beginner_project', 'beginner', NULL, '["React","Cloudflare","Tutorial"]'),
('Python for Data Science Path', 'Curated learning path from Python basics through pandas, numpy, and matplotlib.', 'learning_path', 'intermediate', NULL, '["Python","Data Science","Learning"]'),
('NWP Summer Dev Internship', 'Northwestern Polytechnic''s summer internship program for 2nd year CS students.', 'internship', NULL, NULL, '["NWP","Internship","2026"]');
