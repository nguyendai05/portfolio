# Database Schema Documentation

## Tổng quan

Schema này bao gồm 3 nhóm bảng chính:

1. **Portfolio Content**: `projects`, `technologies`, `phases`, `skills`, `awards`, `experiments`
2. **Collaboration Board**: `ideas`
3. **Contact & Rate-limit**: `contact_messages`, `email_rate_limits`

## Mối quan hệ (ERD)

```
┌─────────────┐     N:N      ┌─────────────────────┐     N:N      ┌──────────────┐
│   projects  │◄────────────►│ project_technologies │◄────────────►│ technologies │
└─────────────┘              └─────────────────────┘              └──────────────┘
       │
       │ N:N
       ▼
┌─────────────────┐     N:N      ┌────────────┐
│ project_phases  │◄────────────►│   phases   │
└─────────────────┘              └────────────┘
       │
       │ 1:N (optional)
       ▼
┌────────────┐
│   awards   │
└────────────┘
       │
       │ 1:N (optional)
       ▼
┌─────────────┐
│ experiments │
└─────────────┘
```

## Cách sử dụng

### 1. Tạo Database

```bash
# Login MySQL
mysql -u root -p

# Chạy schema
source /path/to/schema.sql
# hoặc
mysql -u root -p < db/schema.sql
```

### 2. Cấu hình Environment Variables

Thêm vào file `.env.local`:

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=portfolio_db
```

## Sample Queries

### Projects & Tools

```sql
-- Lấy tất cả projects (không phải tools)
SELECT 
  p.id,
  p.slug,
  p.title,
  p.category,
  p.image_url AS image,
  p.description,
  p.link,
  p.featured
FROM projects p
WHERE p.project_type = 'project'
ORDER BY p.featured DESC, p.created_at DESC;

-- Lấy tất cả tools
SELECT 
  p.id,
  p.slug,
  p.title,
  p.category,
  p.image_url AS image,
  p.description,
  p.link,
  p.featured
FROM projects p
WHERE p.project_type = 'tool'
ORDER BY p.created_at DESC;

-- Lấy technologies cho 1 project
SELECT t.name
FROM technologies t
JOIN project_technologies pt ON pt.technology_id = t.id
WHERE pt.project_id = ?;

-- Lấy phases cho 1 project (theo thứ tự)
SELECT ph.name
FROM phases ph
JOIN project_phases pp ON pp.phase_id = ph.id
WHERE pp.project_id = ?
ORDER BY pp.phase_order;

-- Lấy project đầy đủ với technologies và phases (aggregated)
SELECT 
  p.id,
  p.slug,
  p.title,
  p.category,
  p.image_url AS image,
  p.description,
  p.link,
  p.featured,
  p.project_type,
  GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ', ') AS technologies,
  GROUP_CONCAT(DISTINCT ph.name ORDER BY pp.phase_order SEPARATOR ', ') AS phases
FROM projects p
LEFT JOIN project_technologies pt ON pt.project_id = p.id
LEFT JOIN technologies t ON t.id = pt.technology_id
LEFT JOIN project_phases pp ON pp.project_id = p.id
LEFT JOIN phases ph ON ph.id = pp.phase_id
WHERE p.project_type = 'project'
GROUP BY p.id
ORDER BY p.featured DESC, p.created_at DESC;
```

### Skills (Marquee Tech Stack)

```sql
-- Lấy tất cả skills cho marquee
SELECT name FROM skills ORDER BY name;
```

### Awards / Milestones

```sql
-- Lấy tất cả awards
SELECT 
  year,
  organization AS org,
  project_title AS project,
  award_title AS award
FROM awards
ORDER BY year DESC;
```

### Experiments

```sql
-- Lấy tất cả experiments
SELECT 
  code AS id,
  name,
  description AS `desc`
FROM experiments
ORDER BY code;
```

### Ideas (Collaboration Board)

```sql
-- Lấy tất cả ideas
SELECT 
  id,
  title,
  description,
  tags,
  difficulty,
  upvotes,
  looking_for_team AS lookingForTeam,
  author,
  created_at AS createdAt
FROM ideas
ORDER BY created_at DESC;

-- Tạo idea mới
INSERT INTO ideas (title, description, tags, difficulty, author, looking_for_team)
VALUES (?, ?, ?, ?, ?, ?);

-- Upvote idea
UPDATE ideas SET upvotes = upvotes + 1 WHERE id = ?;

-- Xóa idea
DELETE FROM ideas WHERE id = ?;
```

### Contact Messages

```sql
-- Lưu contact message
INSERT INTO contact_messages (name, email, topic, message, ip_address, user_agent)
VALUES (?, ?, ?, ?, INET6_ATON(?), ?);

-- Lấy tất cả messages (admin view)
SELECT 
  id,
  name,
  email,
  topic,
  message,
  status,
  INET6_NTOA(ip_address) AS ip_address,
  user_agent,
  created_at
FROM contact_messages
ORDER BY created_at DESC;

-- Cập nhật status
UPDATE contact_messages SET status = 'replied' WHERE id = ?;
```

### Rate Limiting

```sql
-- Kiểm tra submission count
SELECT submission_count
FROM email_rate_limits
WHERE email = ?;

-- Tăng submission count (upsert)
INSERT INTO email_rate_limits (email, submission_count, last_submitted_at)
VALUES (?, 1, NOW())
ON DUPLICATE KEY UPDATE
  submission_count = submission_count + 1,
  last_submitted_at = NOW();
```

## Mapping với TypeScript Interfaces

### Project Interface

```typescript
// types.ts
export interface Project {
  id: number;
  title: string;
  category: string;
  image: string;           // → projects.image_url
  description: string;
  technologies: string[];  // → JOIN project_technologies + technologies
  link?: string;
  featured?: boolean;
  phases?: string[];       // → JOIN project_phases + phases
}
```

### Idea Interface

```typescript
// services/ideasService.ts
export interface Idea {
  id: number;
  title: string;
  description: string;
  tags: string[];           // → ideas.tags (JSON)
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  upvotes: number;
  lookingForTeam: boolean;  // → ideas.looking_for_team
  author: string;
  createdAt?: string;       // → ideas.created_at
}
```

### ContactFormData Interface

```typescript
// services/emailService.ts
export interface ContactFormData {
  name: string;
  email: string;
  topic: 'collaboration' | 'mentorship' | 'freelance' | 'other';
  message: string;
}
```

## Bước tiếp theo

1. **Tạo API endpoints**:
   - `GET /api/projects` - Lấy danh sách projects
   - `GET /api/projects/:slug` - Lấy chi tiết 1 project
   - `GET /api/skills` - Lấy danh sách skills cho marquee
   - `GET /api/awards` - Lấy danh sách awards/milestones
   - `GET /api/experiments` - Lấy danh sách experiments

2. **Cập nhật emailService.ts** để sử dụng rate limit từ DB thay vì localStorage

3. **Tạo admin panel** (optional) để quản lý contact messages
