/**
 * Project-data localization layer.
 *
 * The `Project` type carries source-of-truth English copy (matching the DB
 * seeds in `db/schema.sql` and the API response from `/api/projects`). This
 * file provides per-language overrides keyed by the project's stable `slug`,
 * so any UI surface that renders a `Project` (Home, Work, WorkColumns,
 * WorkDeepDiveStrip, ToolShowcase, ProjectModal) can call
 * `localizeProject(project, language)` and get a copy with localized
 * `category`, `description`, and `phases` while keeping `title`,
 * `technologies`, image, and link untouched.
 *
 * Guidelines (per repo i18n rules):
 * - Project titles are NOT translated – they are brand / product names.
 * - Technology names (React, TypeScript, Express, MySQL/TiDB, Tailwind CSS,
 *   Framer Motion, Gemini AI, Cloudinary, i18next, ...) are NOT translated.
 * - Vietnamese copy is written for context, not literal word-for-word.
 */
import type { Language } from '../context/LanguageContext';
import type { Project } from '../types';

export interface ProjectLocale {
  category?: string;
  description?: string;
  /** Map of English phase name -> localized phase name. */
  phases?: Record<string, string>;
}

/**
 * Per-slug Vietnamese overrides for the three flagship projects. The other
 * projects fall back to the global category/phase maps below, which keep the
 * Vietnamese UI from showing English category badges or English phase chips.
 */
const VI_PROJECTS: Record<string, ProjectLocale> = {
  'xuni-dizan-resource-hub': {
    category: 'Nền tảng full-stack',
    description:
      'Hub tài nguyên tập trung dành cho sinh viên FIT (Đại học Nông Lâm), giúp truy cập tài liệu môn học, bài viết học tập và tài khoản AI dùng chung (ChatGPT, Claude, Gemini). Nền tảng full-stack gồm Express API, MySQL/TiDB, cơ chế xoay vòng thông tin đăng nhập an toàn, trình tạo bài viết bằng AI có web grounding, xem trước TOTP, lấy mã xác minh qua SMTP, đặt tài khoản riêng bằng VietQR, middleware chống quá tải cho lưu lượng cao, và giao diện brutalist glass-morphism với theme theo mùa.',
    phases: {
      Architecture: 'Kiến trúc',
      'Backend API': 'API backend',
      'Credential System': 'Hệ thống thông tin đăng nhập',
      'AI Integration': 'Tích hợp AI',
      'UI / Theming': 'UI / Chủ đề',
      Deployment: 'Triển khai',
    },
  },
  'mu-phim-multi-catalog-streaming': {
    category: 'Nền tảng streaming',
    description:
      'Nền tảng tổng hợp phim đa nguồn, gộp ba nhà cung cấp ngoài (KK, OPhim, NguonC) vào một giao diện cinema thống nhất. Xây bằng Next.js App Router và Supabase, hỗ trợ phát HLS qua proxy stream có chữ ký, fallback đa server, tìm/lọc/duyệt xuyên các nguồn, bảng quản trị RBAC kèm audit log, ba theme (Cinematic, Minimal, Neo Noir), kèm vỏ Android native qua Capacitor để mang trải nghiệm tương tự lên mobile.',
    phases: {
      Research: 'Nghiên cứu',
      'Catalog Integration': 'Tích hợp danh mục',
      'Streaming Pipeline': 'Pipeline streaming',
      'Admin & RBAC': 'Quản trị & RBAC',
      'Android Shell': 'Vỏ Android',
      Deployment: 'Triển khai',
    },
  },
  'nuoi-xuan-dai-donation-landing': {
    category: 'Gây quỹ / Full-stack',
    description:
      'Trang donation cá nhân theo phong cách cyber / brutalist system log, nơi người ủng hộ có thể "nuôi" tác giả qua các mức (15.000đ – 1.000.000đ) hoặc tuỳ chọn số tiền. Mỗi donation tạo mã đơn duy nhất và URL thanh toán VNPAY QR. Trang sao kê công khai cập nhật mọi giao dịch đã thanh toán theo thời gian thực, người ủng hộ từ 1.000.000đ trở lên nhận chứng nhận VIP dạng PDF tự sinh.',
    phases: {
      Concept: 'Ý tưởng',
      'Payment Flow': 'Luồng thanh toán',
      'Public Statement': 'Sao kê công khai',
      'VIP Certificate': 'Chứng nhận VIP',
      'UI Polish': 'Trau chuốt UI',
      Deployment: 'Triển khai',
    },
  },
};

/**
 * Generic Vietnamese category map used as a fallback when a project does not
 * have an explicit per-slug override. This keeps category badges in Vietnamese
 * even for non-flagship projects.
 */
const VI_CATEGORIES: Record<string, string> = {
  'Full-Stack Platform': 'Nền tảng full-stack',
  'Streaming Platform': 'Nền tảng streaming',
  'Fundraising / Full-Stack': 'Gây quỹ / Full-stack',
  'Personal Website': 'Website cá nhân',
  'Creative Mini Project': 'Dự án sáng tạo nhỏ',
  'Movie UI / Frontend': 'UI phim / Frontend',
  'University Group Project': 'Dự án nhóm đại học',
  'Team E-commerce Project': 'E-commerce nhóm',
  'Next.js Portfolio Website': 'Portfolio Next.js',
};

/**
 * Generic Vietnamese phase map for phase names that recur across projects.
 * Per-slug overrides above take priority; this is only a fallback.
 */
const VI_PHASES: Record<string, string> = {
  Concept: 'Ý tưởng',
  Architecture: 'Kiến trúc',
  'Backend API': 'API backend',
  'Credential System': 'Hệ thống thông tin đăng nhập',
  'AI Integration': 'Tích hợp AI',
  'UI / Theming': 'UI / Chủ đề',
  Deployment: 'Triển khai',
  Research: 'Nghiên cứu',
  'Catalog Integration': 'Tích hợp danh mục',
  'Streaming Pipeline': 'Pipeline streaming',
  'Admin & RBAC': 'Quản trị & RBAC',
  'Android Shell': 'Vỏ Android',
  'Payment Flow': 'Luồng thanh toán',
  'Public Statement': 'Sao kê công khai',
  'VIP Certificate': 'Chứng nhận VIP',
  'UI Polish': 'Trau chuốt UI',
  Design: 'Thiết kế',
  Development: 'Phát triển',
  'Animation Design': 'Thiết kế animation',
  Implementation: 'Triển khai code',
  Wireframing: 'Wireframe',
  Testing: 'Kiểm thử',
  Planning: 'Lập kế hoạch',
  'Team Collaboration': 'Hợp tác nhóm',
  Delivery: 'Bàn giao',
  'Information Architecture': 'Kiến trúc thông tin',
  'UI Design': 'Thiết kế UI',
  'Animation Polish': 'Trau chuốt animation',
};

const PROJECT_TRANSLATIONS: Record<Language, Record<string, ProjectLocale>> = {
  en: {},
  vi: VI_PROJECTS,
};

const CATEGORY_TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {},
  vi: VI_CATEGORIES,
};

const PHASE_TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {},
  vi: VI_PHASES,
};

/**
 * Returns a copy of `project` with `category`, `description`, and `phases`
 * replaced by their localized variants for the given language. Falls back to
 * the original English value if no translation exists. Title, technologies,
 * image, link, id, slug, and featured are always preserved as-is.
 */
export function localizeProject(project: Project, language: Language): Project {
  if (language === 'en') return project;

  const slug = project.slug;
  const slugDict = slug ? PROJECT_TRANSLATIONS[language]?.[slug] : undefined;
  const categoryDict = CATEGORY_TRANSLATIONS[language] ?? {};
  const phaseDict = PHASE_TRANSLATIONS[language] ?? {};

  const localizedCategory =
    slugDict?.category ?? categoryDict[project.category] ?? project.category;
  const localizedDescription = slugDict?.description ?? project.description;
  const localizedPhases = project.phases?.map(
    (phase) => slugDict?.phases?.[phase] ?? phaseDict[phase] ?? phase,
  );

  return {
    ...project,
    category: localizedCategory,
    description: localizedDescription,
    phases: localizedPhases,
  };
}

/** Convenience helper for arrays of projects. */
export function localizeProjects(projects: Project[], language: Language): Project[] {
  if (language === 'en') return projects;
  return projects.map((p) => localizeProject(p, language));
}
