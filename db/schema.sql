-- ===================================================================
-- 0. Database
-- ===================================================================
-- Tạo database portfolio_db (khớp với .env.example)
CREATE DATABASE IF NOT EXISTS portfolio_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE portfolio_db;

-- ===================================================================
-- 1. Portfolio Content
-- ===================================================================

-- 1.1 Projects (bao gồm cả projects & tools; phân loại bằng project_type)
CREATE TABLE IF NOT EXISTS projects (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  summary VARCHAR(255) NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,           -- Ví dụ: "Movie UI / Frontend", "Creative Mini Project"
  project_type ENUM('project','tool') NOT NULL DEFAULT 'project',
  image_url VARCHAR(512) NOT NULL,
  link VARCHAR(512) NULL,
  featured TINYINT(1) NOT NULL DEFAULT 0,   -- map với field featured?: boolean
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_project_type (project_type),
  INDEX idx_category (category),
  INDEX idx_featured (featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.2 Technologies (danh sách tech duy nhất)
CREATE TABLE IF NOT EXISTS technologies (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,        -- "React", "Next.js", "Tailwind CSS", ...
  category VARCHAR(50) NULL                 -- tuỳ bạn: "frontend", "backend", "design", ...
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.3 Liên kết projects <-> technologies (N–N)
CREATE TABLE IF NOT EXISTS project_technologies (
  project_id INT UNSIGNED NOT NULL,
  technology_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (project_id, technology_id),
  CONSTRAINT fk_project_technologies_project
    FOREIGN KEY (project_id) REFERENCES projects(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_project_technologies_technology
    FOREIGN KEY (technology_id) REFERENCES technologies(id)
    ON DELETE RESTRICT,
  INDEX idx_project_tech_tech (technology_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.4 Phases (giai đoạn: "Concept", "Design", "Development", ...)
CREATE TABLE IF NOT EXISTS phases (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.5 Liên kết projects <-> phases (N–N, có thứ tự)
CREATE TABLE IF NOT EXISTS project_phases (
  project_id INT UNSIGNED NOT NULL,
  phase_id INT UNSIGNED NOT NULL,
  phase_order TINYINT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (project_id, phase_id),
  CONSTRAINT fk_project_phases_project
    FOREIGN KEY (project_id) REFERENCES projects(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_project_phases_phase
    FOREIGN KEY (phase_id) REFERENCES phases(id)
    ON DELETE RESTRICT,
  INDEX idx_project_phases_order (project_id, phase_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.6 Skills / Tech stack marquee (CLIENTS trong mockData)
CREATE TABLE IF NOT EXISTS skills (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,        -- "HTML5", "CSS3", "REACT", ...
  skill_type ENUM('language','frontend','backend','database','tool','design','other')
    NOT NULL DEFAULT 'other',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.7 Milestones / Awards (AWARDS trong mockData)
CREATE TABLE IF NOT EXISTS awards (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  year YEAR NOT NULL,                       -- 2023, 2024, ...
  organization VARCHAR(255) NOT NULL,       -- org
  project_title VARCHAR(255) NOT NULL,      -- text hiển thị (ví dụ: "Enrollment")
  award_title VARCHAR(255) NOT NULL,        -- text hiển thị (ví dụ: "Started IT Degree")
  project_id INT UNSIGNED NULL,             -- optional: liên kết thẳng tới projects.id
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_awards_project
    FOREIGN KEY (project_id) REFERENCES projects(id)
    ON DELETE SET NULL,
  INDEX idx_awards_year (year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.8 Experiments / Lab items (EXPERIMENTS trong mockData)
CREATE TABLE IF NOT EXISTS experiments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,         -- "01", "02", "03"
  name VARCHAR(255) NOT NULL,               -- "Hover Effects"
  description TEXT NOT NULL,                -- "CSS & Framer Motion transition studies"
  project_id INT UNSIGNED NULL,             -- optional: nếu 1 experiment gắn với project cụ thể
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_experiments_project
    FOREIGN KEY (project_id) REFERENCES projects(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- 2. Collaboration Board (Ideas)
--    Tương thích với types: Idea trong api/ideas & services/ideasService
-- ===================================================================

CREATE TABLE IF NOT EXISTS ideas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  tags JSON NOT NULL,                       -- string[] -> JSON array ['IoT','React',...] - No default for JSON in older MySQL
  difficulty ENUM('Easy', 'Medium', 'Hard', 'Expert') NOT NULL DEFAULT 'Medium',
  upvotes INT UNSIGNED NOT NULL DEFAULT 0,
  looking_for_team TINYINT(1) NOT NULL DEFAULT 0,
  author VARCHAR(100) NOT NULL DEFAULT 'Anonymous',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ideas_difficulty (difficulty),
  INDEX idx_ideas_upvotes (upvotes),
  INDEX idx_ideas_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Tuỳ chọn nâng cao): nếu sau này bạn muốn normalize tags
-- thì có thể thêm:
--
-- CREATE TABLE idea_tags (
--   id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
--   name VARCHAR(100) NOT NULL UNIQUE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
-- CREATE TABLE idea_tag_pivot (
--   idea_id INT UNSIGNED NOT NULL,
--   tag_id INT UNSIGNED NOT NULL,
--   PRIMARY KEY (idea_id, tag_id),
--   FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE CASCADE,
--   FOREIGN KEY (tag_id) REFERENCES idea_tags(id) ON DELETE RESTRICT
-- );

-- 2.1 Idea Comments (bình luận cho ideas)
CREATE TABLE IF NOT EXISTS idea_comments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  idea_id INT UNSIGNED NOT NULL,
  author VARCHAR(100) NOT NULL DEFAULT 'Anonymous',
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_idea
    FOREIGN KEY (idea_id) REFERENCES ideas(id)
    ON DELETE CASCADE,
  INDEX idx_comments_idea (idea_id),
  INDEX idx_comments_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- 3. Contact Form & Rate Limiting
-- ===================================================================

-- 3.1 Contact messages (Contact.tsx + emailService.ts)
CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  topic ENUM('collaboration','mentorship','freelance','other') NOT NULL,
  message TEXT NOT NULL,
  status ENUM('new','replied','archived') NOT NULL DEFAULT 'new',
  ip_address VARBINARY(16) NULL,            -- để lưu IPv4/IPv6 (packed)
  user_agent VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contact_email (email),
  INDEX idx_contact_topic (topic),
  INDEX idx_contact_status (status),
  INDEX idx_contact_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.2 Rate‑limit gửi email theo email address
--     Tương đương EmailHistoryEntry { count } + MAX_TOTAL_SUBMISSIONS trong emailService.ts
CREATE TABLE IF NOT EXISTS email_rate_limits (
  email VARCHAR(255) NOT NULL PRIMARY KEY,
  submission_count INT UNSIGNED NOT NULL DEFAULT 0,
  last_submitted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- 4. Seed Data (Sample Data)
-- ===================================================================

-- 4.1 Seed phases (các giai đoạn phát triển project)
INSERT INTO phases (name) VALUES 
  ('Concept'),
  ('Research'),
  ('Wireframing'),
  ('Design'),
  ('UI Design'),
  ('Animation Design'),
  ('Planning'),
  ('Information Architecture'),
  ('Core Development'),
  ('Development'),
  ('Implementation'),
  ('Testing'),
  ('Animation Polish'),
  ('Deployment'),
  ('Release'),
  ('Team Collaboration'),
  ('Delivery')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 4.2 Seed technologies (danh sách công nghệ)
INSERT INTO technologies (name, category) VALUES 
  ('HTML5', 'frontend'),
  ('CSS3', 'frontend'),
  ('JavaScript', 'language'),
  ('TypeScript', 'language'),
  ('React', 'frontend'),
  ('Next.js', 'frontend'),
  ('Vue', 'frontend'),
  ('Tailwind CSS', 'frontend'),
  ('Framer Motion', 'frontend'),
  ('Node.js', 'backend'),
  ('Express.js', 'backend'),
  ('Python', 'language'),
  ('PostgreSQL', 'database'),
  ('MongoDB', 'database'),
  ('MySQL', 'database'),
  ('Git', 'tool'),
  ('GitHub', 'tool'),
  ('VS Code', 'tool'),
  ('Figma', 'design'),
  ('Vercel', 'tool'),
  ('Responsive Design', 'frontend'),
  ('Video Integration', 'frontend'),
  ('Animation', 'frontend'),
  ('Audio Integration', 'frontend'),
  ('Grid Layout', 'frontend'),
  ('UI/UX', 'design'),
  ('Accessibility', 'design'),
  ('Team Collaboration', 'other'),
  ('Flexbox', 'frontend'),
  ('E-commerce UI', 'design'),
  ('Tesseract OCR', 'tool'),
  ('OpenCV', 'tool'),
  ('Pillow', 'tool'),
  ('PyQt5', 'tool')
ON DUPLICATE KEY UPDATE category = VALUES(category);

-- 4.3 Seed skills (marquee tech stack - CLIENTS trong mockData)
INSERT INTO skills (name, skill_type) VALUES 
  ('HTML5', 'language'),
  ('CSS3', 'language'),
  ('JAVASCRIPT', 'language'),
  ('REACT', 'frontend'),
  ('NEXT.JS', 'frontend'),
  ('TYPESCRIPT', 'language'),
  ('NODE.JS', 'backend'),
  ('EXPRESS.JS', 'backend'),
  ('POSTGRESQL', 'database'),
  ('MONGODB', 'database'),
  ('GIT', 'tool'),
  ('GITHUB', 'tool'),
  ('VS CODE', 'tool'),
  ('FIGMA', 'design'),
  ('TAILWIND CSS', 'frontend'),
  ('FRAMER MOTION', 'frontend'),
  ('VERCEL', 'tool')
ON DUPLICATE KEY UPDATE skill_type = VALUES(skill_type);

-- 4.4 Seed awards / milestones (AWARDS trong mockData)
INSERT INTO awards (year, organization, project_title, award_title) VALUES 
  (2023, 'Nong Lam University', 'Enrollment', 'Started IT Degree'),
  (2024, 'Web Dev', 'First Site', 'Hello World'),
  (2024, 'HCI Course', 'Assignments', 'UI Fundamentals'),
  (2025, 'Self-Taught', 'React & Next.js', 'Modern Stack Transition');

-- 4.5 Seed experiments (lab items - EXPERIMENTS trong mockData)
INSERT INTO experiments (code, name, description) VALUES 
  ('01', 'Hover Effects', 'CSS & Framer Motion transition studies'),
  ('02', 'Forms', 'Validation, UX copy, and edge cases'),
  ('03', 'Layouts', 'Grid vs Flexbox and responsive patterns')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- 4.6 Seed projects (PROJECTS từ mockData)
INSERT INTO projects (slug, title, summary, description, category, project_type, image_url, link, featured) VALUES 
  (
    'personal-portfolio-dizan',
    'Personal Portfolio – DIZAN',
    'My first personal website branded as DIZAN',
    'My first personal website branded as DIZAN, featuring an introduction, skills, project highlights, and a playful lab page for experiments. Built as a foundation for practicing semantic HTML, responsive layouts, and personal branding on the web.',
    'Personal Website',
    'project',
    'https://res.cloudinary.com/dak4x4d7u/image/upload/f_auto,q_auto,w_800/v1763799129/Screenshot_2025-11-22_113653_ex7oun.png',
    'https://xuni-dizan.github.io/Trang_ca_nhan/',
    1
  ),
  (
    'christmas-gift-for-crush',
    'Christmas Gift for Crush',
    'An interactive Christmas-themed mini-site',
    'An interactive Christmas-themed mini-site created as a digital gift, with music, snow effects, and messages revealed step by step. I focused on micro-interactions, CSS animations, and emotional storytelling to deliver a memorable surprise experience.',
    'Creative Mini Project',
    'project',
    'https://res.cloudinary.com/dak4x4d7u/image/upload/f_auto,q_auto,w_800/v1763799127/Screenshot_2025-11-22_145743_xzhvlr.png',
    'https://xuni-dizan.github.io/web_noel/',
    0
  ),
  (
    'flick-tale-movie-website',
    'Flick Tale Movie Website',
    'A responsive movie-browsing interface',
    'A responsive movie-browsing interface inspired by modern streaming platforms. Features hero banners, categorized sections, hover cards, and clean typography. Built to practice complex grid/flex layouts, card design, and basic search/filter UX patterns.',
    'Movie UI / Frontend',
    'project',
    'https://res.cloudinary.com/dak4x4d7u/image/upload/f_auto,q_auto,w_800/v1763799127/Screenshot_2025-11-22_150710_ceku1x.png',
    'https://xuni-dizan.github.io/WebPhim/',
    1
  ),
  (
    'hci-group-10-course-portal',
    'HCI Group 10 Course Portal',
    'Final group project for HCI course',
    'Final group project website for the Human–Computer Interaction course. Acts as a mini portal for the class: presenting members, project briefs, design iterations, and final deliverables. The UI applies layout, color, accessibility, and usability principles learned throughout the HCI curriculum.',
    'University Group Project',
    'project',
    'https://res.cloudinary.com/dak4x4d7u/image/upload/f_auto,q_auto,w_800/v1763799128/Screenshot_2025-11-22_150936_hxjruf.png',
    'https://duyhuunguyen.github.io/GroupWeb/GroupWeb/public/home.html',
    0
  ),
  (
    'handmade-craft-shop-group-10',
    'Handmade Craft Shop – Group 10',
    'A collaborative e-commerce website for handmade crafts',
    'A collaborative e-commerce website for a handmade craft shop, with hero banners, category sections, detailed product cards, and a simple cart UI (static). We focused on clean product catalog layout, consistent pricing displays, and responsive behavior on both mobile and desktop.',
    'Team E-commerce Project',
    'project',
    'https://res.cloudinary.com/dak4x4d7u/image/upload/f_auto,q_auto,w_800/v1763799127/Screenshot_2025-11-22_151116_af4prv.png',
    'https://dhphuc211.github.io/WebShop-Handmake-Group10/',
    1
  ),
  (
    'dizan-experience-studio',
    'Dizan – Experience Studio (Next.js Portfolio)',
    'The latest version of my personal portfolio',
    'The latest version of my personal portfolio, Dizan – Experience Studio, built with Next.js, TypeScript, Tailwind CSS, and Framer Motion. It showcases my services, recent projects, and contact information with a clean, responsive layout. Deployed on Vercel as the central hub for my full-stack work.',
    'Next.js Portfolio Website',
    'project',
    'https://res.cloudinary.com/dak4x4d7u/image/upload/f_auto,q_auto,w_800/v1763802953/Screenshot_2025-11-22_161516_l9sn2e.png',
    'https://my-portfolio-gamma-two-84.vercel.app/',
    1
  )
ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), image_url = VALUES(image_url);

-- 4.7 Seed tools (TOOLS từ mockData)
INSERT INTO projects (slug, title, summary, description, category, project_type, image_url, link, featured) VALUES 
  (
    'image-to-text-extractor',
    'Image to Text Extractor',
    'OCR tool for extracting text from images',
    'Công cụ trích xuất văn bản từ hình ảnh sử dụng OCR (Optical Character Recognition). Hỗ trợ nhiều ngôn ngữ, xử lý batch nhiều ảnh cùng lúc, và xuất kết quả ra file text hoặc clipboard.',
    'OCR Tool',
    'tool',
    'https://res.cloudinary.com/dak4x4d7u/image/upload/f_auto,q_auto,w_800/v1733400000/ocr-tool-placeholder.png',
    '',
    1
  )
ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description);

-- 4.8 Seed project_technologies (liên kết projects với technologies)
-- Cần chạy sau khi đã có projects và technologies

-- Personal Portfolio – DIZAN
INSERT INTO project_technologies (project_id, technology_id)
SELECT p.id, t.id FROM projects p, technologies t
WHERE p.slug = 'personal-portfolio-dizan' AND t.name IN ('HTML5', 'CSS3', 'JavaScript', 'Responsive Design', 'Video Integration')
ON DUPLICATE KEY UPDATE project_id = project_id;

-- Christmas Gift for Crush
INSERT INTO project_technologies (project_id, technology_id)
SELECT p.id, t.id FROM projects p, technologies t
WHERE p.slug = 'christmas-gift-for-crush' AND t.name IN ('HTML5', 'CSS3', 'JavaScript', 'Animation', 'Audio Integration')
ON DUPLICATE KEY UPDATE project_id = project_id;

-- Flick Tale Movie Website
INSERT INTO project_technologies (project_id, technology_id)
SELECT p.id, t.id FROM projects p, technologies t
WHERE p.slug = 'flick-tale-movie-website' AND t.name IN ('HTML5', 'CSS3', 'JavaScript', 'Responsive Design', 'Grid Layout', 'UI/UX')
ON DUPLICATE KEY UPDATE project_id = project_id;

-- HCI Group 10 Course Portal
INSERT INTO project_technologies (project_id, technology_id)
SELECT p.id, t.id FROM projects p, technologies t
WHERE p.slug = 'hci-group-10-course-portal' AND t.name IN ('HTML5', 'CSS3', 'JavaScript', 'UI/UX', 'Accessibility', 'Team Collaboration')
ON DUPLICATE KEY UPDATE project_id = project_id;

-- Handmade Craft Shop – Group 10
INSERT INTO project_technologies (project_id, technology_id)
SELECT p.id, t.id FROM projects p, technologies t
WHERE p.slug = 'handmade-craft-shop-group-10' AND t.name IN ('HTML5', 'CSS3', 'JavaScript', 'Responsive Design', 'Flexbox', 'E-commerce UI')
ON DUPLICATE KEY UPDATE project_id = project_id;

-- Dizan – Experience Studio (Next.js Portfolio)
INSERT INTO project_technologies (project_id, technology_id)
SELECT p.id, t.id FROM projects p, technologies t
WHERE p.slug = 'dizan-experience-studio' AND t.name IN ('Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Vercel')
ON DUPLICATE KEY UPDATE project_id = project_id;

-- Image to Text Extractor (Tool)
INSERT INTO project_technologies (project_id, technology_id)
SELECT p.id, t.id FROM projects p, technologies t
WHERE p.slug = 'image-to-text-extractor' AND t.name IN ('Python', 'Tesseract OCR', 'OpenCV', 'Pillow', 'PyQt5')
ON DUPLICATE KEY UPDATE project_id = project_id;

-- 4.9 Seed project_phases (liên kết projects với phases)
-- Personal Portfolio – DIZAN: Concept, Design, Development, Deployment
INSERT INTO project_phases (project_id, phase_id, phase_order)
SELECT p.id, ph.id, 
  CASE ph.name 
    WHEN 'Concept' THEN 1 
    WHEN 'Design' THEN 2 
    WHEN 'Development' THEN 3 
    WHEN 'Deployment' THEN 4 
  END
FROM projects p, phases ph
WHERE p.slug = 'personal-portfolio-dizan' AND ph.name IN ('Concept', 'Design', 'Development', 'Deployment')
ON DUPLICATE KEY UPDATE phase_order = VALUES(phase_order);

-- Christmas Gift for Crush: Concept, Animation Design, Implementation
INSERT INTO project_phases (project_id, phase_id, phase_order)
SELECT p.id, ph.id, 
  CASE ph.name 
    WHEN 'Concept' THEN 1 
    WHEN 'Animation Design' THEN 2 
    WHEN 'Implementation' THEN 3 
  END
FROM projects p, phases ph
WHERE p.slug = 'christmas-gift-for-crush' AND ph.name IN ('Concept', 'Animation Design', 'Implementation')
ON DUPLICATE KEY UPDATE phase_order = VALUES(phase_order);

-- Flick Tale Movie Website: Research, Wireframing, Implementation, Testing
INSERT INTO project_phases (project_id, phase_id, phase_order)
SELECT p.id, ph.id, 
  CASE ph.name 
    WHEN 'Research' THEN 1 
    WHEN 'Wireframing' THEN 2 
    WHEN 'Implementation' THEN 3 
    WHEN 'Testing' THEN 4 
  END
FROM projects p, phases ph
WHERE p.slug = 'flick-tale-movie-website' AND ph.name IN ('Research', 'Wireframing', 'Implementation', 'Testing')
ON DUPLICATE KEY UPDATE phase_order = VALUES(phase_order);

-- HCI Group 10 Course Portal: Planning, Team Collaboration, Design, Delivery
INSERT INTO project_phases (project_id, phase_id, phase_order)
SELECT p.id, ph.id, 
  CASE ph.name 
    WHEN 'Planning' THEN 1 
    WHEN 'Team Collaboration' THEN 2 
    WHEN 'Design' THEN 3 
    WHEN 'Delivery' THEN 4 
  END
FROM projects p, phases ph
WHERE p.slug = 'hci-group-10-course-portal' AND ph.name IN ('Planning', 'Team Collaboration', 'Design', 'Delivery')
ON DUPLICATE KEY UPDATE phase_order = VALUES(phase_order);

-- Handmade Craft Shop – Group 10: Planning, Team Collaboration, Implementation, Deployment
INSERT INTO project_phases (project_id, phase_id, phase_order)
SELECT p.id, ph.id, 
  CASE ph.name 
    WHEN 'Planning' THEN 1 
    WHEN 'Team Collaboration' THEN 2 
    WHEN 'Implementation' THEN 3 
    WHEN 'Deployment' THEN 4 
  END
FROM projects p, phases ph
WHERE p.slug = 'handmade-craft-shop-group-10' AND ph.name IN ('Planning', 'Team Collaboration', 'Implementation', 'Deployment')
ON DUPLICATE KEY UPDATE phase_order = VALUES(phase_order);

-- Dizan – Experience Studio: Information Architecture, UI Design, Implementation, Animation Polish, Deployment
INSERT INTO project_phases (project_id, phase_id, phase_order)
SELECT p.id, ph.id, 
  CASE ph.name 
    WHEN 'Information Architecture' THEN 1 
    WHEN 'UI Design' THEN 2 
    WHEN 'Implementation' THEN 3 
    WHEN 'Animation Polish' THEN 4 
    WHEN 'Deployment' THEN 5 
  END
FROM projects p, phases ph
WHERE p.slug = 'dizan-experience-studio' AND ph.name IN ('Information Architecture', 'UI Design', 'Implementation', 'Animation Polish', 'Deployment')
ON DUPLICATE KEY UPDATE phase_order = VALUES(phase_order);

-- Image to Text Extractor (Tool): Research, Core Development, UI Design, Testing, Release
INSERT INTO project_phases (project_id, phase_id, phase_order)
SELECT p.id, ph.id, 
  CASE ph.name 
    WHEN 'Research' THEN 1 
    WHEN 'Core Development' THEN 2 
    WHEN 'UI Design' THEN 3 
    WHEN 'Testing' THEN 4 
    WHEN 'Release' THEN 5 
  END
FROM projects p, phases ph
WHERE p.slug = 'image-to-text-extractor' AND ph.name IN ('Research', 'Core Development', 'UI Design', 'Testing', 'Release')
ON DUPLICATE KEY UPDATE phase_order = VALUES(phase_order);

-- 4.10 Seed ideas (sample ideas cho Collaboration Board)
INSERT INTO ideas (title, description, tags, difficulty, upvotes, looking_for_team, author) VALUES
  (
    'AI-Powered Plant Waterer',
    'IoT system using Raspberry Pi and Gemini API to analyze soil moisture and plant health, then water automatically.',
    '["IoT", "Python", "React", "AI"]',
    'Hard',
    42,
    1,
    'GreenThumb'
  ),
  (
    'Brutalist Todo App',
    'A task manager that insults you when you miss deadlines. High contrast, no animations, pure anxiety.',
    '["React", "LocalStorage", "CSS"]',
    'Easy',
    128,
    0,
    'Xuni-Dizan'
  ),
  (
    'Decentralized Social Graph',
    'Visualizing wallet connections on Ethereum using Three.js force-directed graphs.',
    '["Web3", "Three.js", "Solidity"]',
    'Expert',
    8,
    1,
    'CryptoNomad'
  ),
  (
    'Retro Terminal Portfolio',
    'A portfolio template that looks exactly like an Ubuntu terminal. Fully keyboard navigable.',
    '["Vue", "Typescript"]',
    'Medium',
    24,
    0,
    'LinuxFan'
  )
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- ===================================================================
-- End of Schema
-- ===================================================================
