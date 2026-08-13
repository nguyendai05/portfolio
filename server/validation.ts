import { z } from 'zod';

const safeText = (minimum: number, maximum: number) => z.string().trim().min(minimum).max(maximum);

export const aiChatSchema = z.object({
  message: safeText(1, 1000),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({ text: z.string().max(1000) }).strip()).min(1).max(1),
  }).strip()).max(8).default([]),
}).strip().superRefine((value, context) => {
  const total = value.message.length + value.history.reduce((sum, item) => sum + item.parts[0].text.length, 0);
  if (total > 6000) context.addIssue({ code: 'custom', message: 'Conversation history is too long', path: ['history'] });
});

export const contactSchema = z.object({
  name: safeText(1, 100),
  email: z.email().max(255).transform((value) => value.toLowerCase()),
  topic: z.enum(['collaboration', 'mentorship', 'freelance', 'other']).default('other'),
  message: safeText(1, 5000),
}).strip();

const httpUrl = z.url().refine((value) => ['http:', 'https:'].includes(new URL(value).protocol), 'URL must use http or https');

export const projectCreateSchema = z.object({
  slug: safeText(1, 80).optional(),
  title: safeText(1, 255),
  summary: z.string().trim().max(500).nullable().optional(),
  description: safeText(1, 20_000),
  category: safeText(1, 100),
  projectType: z.enum(['project', 'tool']).default('project'),
  imageUrl: httpUrl.max(2048),
  link: httpUrl.max(2048).nullable().optional(),
  featured: z.boolean().default(false),
  technologies: z.array(safeText(1, 100)).max(50).default([]),
  phases: z.array(safeText(1, 100)).max(50).default([]),
}).strict();

export const projectUpdateSchema = projectCreateSchema.partial().strict();

export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const flattened = error.flatten().fieldErrors;
  return Object.fromEntries(Object.entries(flattened).filter((entry): entry is [string, string[]] => Boolean(entry[1])));
}
