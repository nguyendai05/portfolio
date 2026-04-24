// Ideas API Service for Collaboration Board

export interface Idea {
  id: number;
  title: string;
  description: string;
  tags: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  upvotes: number;
  lookingForTeam: boolean;
  author: string;
  createdAt?: string;
}

export interface CreateIdeaInput {
  title: string;
  description: string;
  tags: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  author?: string;
  lookingForTeam?: boolean;
}

const API_BASE = '/api/ideas';

export class ApiError extends Error {
  code?: string;
  hint?: string;
  status?: number;
  constructor(message: string, opts: { code?: string; hint?: string; status?: number } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = opts.code;
    this.hint = opts.hint;
    this.status = opts.status;
  }
}

export async function fetchIdeas(): Promise<Idea[]> {
  let res: Response;
  try {
    res = await fetch(API_BASE);
  } catch (e: any) {
    throw new ApiError('Không kết nối được tới API.', {
      code: 'NETWORK_ERROR',
      hint: 'Kiểm tra kết nối mạng hoặc thử lại sau.',
    });
  }
  let json: any;
  try {
    json = await res.json();
  } catch {
    throw new ApiError('Phản hồi API không hợp lệ.', { code: 'BAD_JSON', status: res.status });
  }
  if (!json.success) {
    throw new ApiError(json.error || 'Failed to fetch ideas', {
      code: json.code,
      hint: json.hint,
      status: res.status,
    });
  }
  return json.data;
}

export async function createIdea(input: CreateIdeaInput): Promise<{ id: number }> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to create idea');
  return json.data;
}

export async function upvoteIdea(id: number): Promise<{ upvotes: number }> {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'PATCH' });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to upvote');
  return json.data;
}

export async function deleteIdea(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to delete');
}

// ============================================
// COMMENTS API
// ============================================

export interface Comment {
  id: number;
  ideaId: number;
  author: string;
  content: string;
  createdAt: string;
}

export async function fetchComments(ideaId: number): Promise<Comment[]> {
  const res = await fetch(`${API_BASE}/${ideaId}/comments`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch comments');
  return json.data;
}

export async function createComment(
  ideaId: number,
  content: string,
  author?: string
): Promise<Comment> {
  const res = await fetch(`${API_BASE}/${ideaId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, author }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to create comment');
  return json.data;
}

export async function deleteComment(ideaId: number, commentId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/${ideaId}/comments/${commentId}`, {
    method: 'DELETE',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to delete comment');
}

export async function fetchCommentCount(ideaId: number): Promise<number> {
  const res = await fetch(`${API_BASE}/${ideaId}/comments/count`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch comment count');
  return json.data.count;
}
