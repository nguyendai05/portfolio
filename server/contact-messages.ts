import type { Connection } from 'mysql2/promise';

const ALLOWED_TOPICS = ['collaboration', 'mentorship', 'freelance', 'other'];
const ALLOWED_STATUSES = ['new', 'replied', 'archived'];

export type ContactTopic = (typeof ALLOWED_TOPICS)[number];
export type ContactStatus = (typeof ALLOWED_STATUSES)[number];

export interface ContactRow {
  id: number;
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
  status: ContactStatus;
  ip_address: Buffer | null;
  user_agent: string | null;
  created_at: string;
}

export interface ContactMessageDTO {
  id: number;
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
  status: ContactStatus;
  userAgent: string | null;
  createdAt: string;
}

export function isAllowedTopic(t: string): t is ContactTopic {
  return ALLOWED_TOPICS.includes(t);
}

export function isAllowedStatus(s: string): s is ContactStatus {
  return ALLOWED_STATUSES.includes(s);
}

export function mapContactRow(row: ContactRow): ContactMessageDTO {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    topic: row.topic,
    message: row.message,
    status: row.status,
    userAgent: row.user_agent,
    createdAt: row.created_at,
  };
}

export async function insertContactMessage(
  conn: Connection,
  input: {
    name: string;
    email: string;
    topic: string;
    message: string;
    userAgent?: string | null;
  },
): Promise<number> {
  const topic: ContactTopic = isAllowedTopic(input.topic) ? input.topic : 'other';
  const [result] = await conn.execute(
    `INSERT INTO contact_messages (name, email, topic, message, status, user_agent)
      VALUES (?, ?, ?, ?, 'new', ?)`,
    [
      input.name.slice(0, 100),
      input.email.slice(0, 255),
      topic,
      input.message,
      input.userAgent ? input.userAgent.slice(0, 255) : null,
    ],
  );
  return (result as { insertId: number }).insertId;
}

export { ALLOWED_STATUSES, ALLOWED_TOPICS };
