/**
 * Vietnamese localization layer for project / tool data.
 *
 * Project data (titles, categories, descriptions, phases) is sourced from the
 * API or `mockData.ts` in raw English form. This module provides a thin
 * translation layer so that the rendered fields match the active language
 * without changing the underlying data shape (keeps DB / API contracts intact).
 *
 * Conventions:
 * - Project titles are kept as-is. They are mostly proper nouns / brand names
 *   ("Mù Phim", "Nuôi Xuân Đại", "Xuni Dizan Resource Hub", ...).
 * - Categories and phase chips use small lookup tables — many projects share
 *   the same EN value, so a flat map is enough.
 * - Long descriptions are keyed by project id (the canonical id from
 *   mockData / DB seed) since each is unique.
 */
import type { Language } from '../context/LanguageContext';
import type { Project } from '../types';

/* ----------------------------- Categories ------------------------------- */

const categoryViMap: Record<string, string> = {
  'Full-Stack Platform': 'Nền tảng Full-Stack',
  'Streaming Platform': 'Nền tảng xem phim',
  'Fundraising / Full-Stack': 'Quyên góp / Full-Stack',
  'Personal Website': 'Website cá nhân',
  'Creative Mini Project': 'Dự án mini sáng tạo',
  'Movie UI / Frontend': 'Giao diện phim / Frontend',
  'University Group Project': 'Dự án nhóm đại học',
  'Team E-commerce Project': 'Dự án thương mại điện tử nhóm',
  'Next.js Portfolio Website': 'Portfolio Next.js',
};

export const localizeCategory = (category: string, lang: Language): string => {
  if (lang !== 'vi') return category;
  return categoryViMap[category] ?? category;
};

/* ------------------------------- Phases --------------------------------- */

const phaseViMap: Record<string, string> = {
  // Common phases
  'Concept': 'Ý tưởng',
  'Design': 'Thiết kế',
  'Development': 'Phát triển',
  'Deployment': 'Triển khai',
  'Implementation': 'Hiện thực',
  'Research': 'Nghiên cứu',
  'Wireframing': 'Phác thảo wireframe',
  'Testing': 'Kiểm thử',
  'Planning': 'Lập kế hoạch',
  'Team Collaboration': 'Phối hợp nhóm',
  'Delivery': 'Bàn giao',
  'Animation Design': 'Thiết kế hiệu ứng',
  'Animation Polish': 'Tinh chỉnh hiệu ứng',
  'UI Design': 'Thiết kế UI',
  'Information Architecture': 'Kiến trúc thông tin',

  // Flagship-specific phases
  'Architecture': 'Kiến trúc hệ thống',
  'Backend API': 'Backend API',
  'Credential System': 'Hệ thống credential',
  'AI Integration': 'Tích hợp AI',
  'UI / Theming': 'UI / Theming',
  'Catalog Integration': 'Tích hợp catalog',
  'Streaming Pipeline': 'Pipeline streaming',
  'Admin & RBAC': 'Admin & RBAC',
  'Android Shell': 'Vỏ Android',
  'Payment Flow': 'Luồng thanh toán',
  'Public Statement': 'Sao kê công khai',
  'VIP Certificate': 'Chứng nhận VIP',
  'UI Polish': 'Tinh chỉnh UI',
};

export const localizePhase = (phase: string, lang: Language): string => {
  if (lang !== 'vi') return phase;
  return phaseViMap[phase] ?? phase;
};

/* --------------------------- Descriptions ------------------------------- */

/**
 * Per-project Vietnamese descriptions, keyed by `Project.id`. Kept in this
 * separate file (instead of `translations.ts`) because descriptions are
 * lengthy and project-scoped.
 */
const projectDescVi: Record<number, string> = {
  // Xuni Dizan Resource Hub
  7:
    'Hub tài nguyên tập trung dành cho sinh viên FIT (Đại học Nông Lâm) để truy cập tài liệu môn học, bài viết học tập và bộ credential AI dùng chung (ChatGPT, Claude, Gemini). Nền tảng full-stack với Express API, cơ sở dữ liệu MySQL/TiDB, hệ thống xoay credential an toàn, trình tạo bài viết bằng AI có web grounding, xem trước TOTP, lấy mã xác thực qua SMTP, đặt tài khoản riêng qua VietQR, middleware chống quá tải khi traffic cao, và giao diện brutalist glass-morphism với theme theo mùa.',
  // Mù Phim
  8:
    'Trình tổng hợp xem phim đa catalog, gộp ba nguồn ngoài (KK, OPhim, NguonC) vào cùng một giao diện điện ảnh thống nhất. Xây trên Next.js App Router và Supabase, hỗ trợ phát HLS qua proxy stream có chữ ký, tự động chuyển server, tìm kiếm / lọc / duyệt xuyên nhà cung cấp, bảng quản trị RBAC kèm audit log, ba biến thể giao diện (Cinematic, Minimal, Neo Noir), kèm vỏ Android native qua Capacitor để mang trải nghiệm tương tự lên di động.',
  // Nuôi Xuân Đại
  9:
    'Trang donation cá nhân được thiết kế như một system log cyber / brutalist, nơi người ủng hộ có thể "nuôi" tác giả qua các mức (15.000đ – 1.000.000đ) hoặc số tiền tùy chỉnh. Mỗi lượt donate sinh ra mã đơn hàng riêng và URL VNPAY QR. Trang sao kê công khai hiển thị mọi đơn đã thanh toán theo thời gian thực, và người ủng hộ từ 1.000.000đ trở lên nhận chứng nhận VIP PDF được tạo tự động.',
  // Personal Portfolio – DIZAN
  1:
    'Website cá nhân đầu tiên của mình mang thương hiệu DIZAN, gồm phần giới thiệu, kỹ năng, dự án nổi bật và trang lab nghịch ngợm để thử nghiệm. Đây là nền móng để mình luyện tập semantic HTML, layout responsive và xây dựng thương hiệu cá nhân trên web.',
  // Christmas Gift for Crush
  2:
    'Một mini-site Giáng Sinh tương tác làm quà tặng số, có nhạc nền, hiệu ứng tuyết và các thông điệp được tiết lộ dần. Mình tập trung vào micro-interaction, animation CSS và lối kể chuyện giàu cảm xúc để tạo bất ngờ đáng nhớ.',
  // Flick Tale Movie Website
  3:
    'Giao diện duyệt phim responsive lấy cảm hứng từ các nền tảng streaming hiện đại. Có hero banner, các section theo thể loại, hover card và typography sạch. Làm để luyện layout grid/flex phức tạp, thiết kế card và các pattern tìm kiếm / lọc cơ bản.',
  // HCI Group 10 Course Portal
  4:
    'Website đồ án nhóm cho môn Tương tác Người – Máy. Đóng vai trò portal lớp: trình bày thành viên, đề bài, các bản thiết kế và sản phẩm cuối. UI áp dụng các nguyên tắc layout, màu sắc, accessibility và usability đã học trong môn HCI.',
  // Handmade Craft Shop – Group 10
  5:
    'Website thương mại điện tử nhóm cho một shop đồ thủ công, có hero banner, các section danh mục, card sản phẩm chi tiết và giỏ hàng tĩnh đơn giản. Nhóm tập trung vào catalog gọn gàng, hiển thị giá nhất quán và hành vi responsive trên cả mobile lẫn desktop.',
  // Dizan – Experience Studio (Next.js Portfolio)
  6:
    'Phiên bản portfolio mới nhất của mình, Dizan – Experience Studio, dựng bằng Next.js, TypeScript, Tailwind CSS và Framer Motion. Trang trình bày dịch vụ, dự án gần đây và thông tin liên hệ với layout sạch và responsive. Đã deploy trên Vercel và là hub trung tâm cho mảng full-stack của mình.',
};

/* ----------------------------- Public API ------------------------------- */

/**
 * Returns a project with its display fields swapped to Vietnamese when the
 * active language is `'vi'`. Title is preserved (proper nouns); description,
 * category and phase chips are translated where a mapping exists.
 *
 * Falls through to the original English value whenever a translation is not
 * available — this keeps newly-added projects safe even before VI copy lands.
 */
export const localizeProject = (project: Project, lang: Language): Project => {
  if (lang !== 'vi') return project;
  return {
    ...project,
    category: localizeCategory(project.category, lang),
    description: projectDescVi[project.id] ?? project.description,
    phases: project.phases?.map((p) => localizePhase(p, lang)),
  };
};

/* ----------------------- Home-page mock entries ------------------------- */

/**
 * Vietnamese labels for the static `AWARDS` / milestones list rendered on the
 * Home page. Keyed by `${year}|${award}` so we can match the existing data
 * shape from `mockData.ts` without forcing a schema change.
 */
const awardI18nMap: Record<string, { org?: string; project?: string; award?: string }> = {
  '2023|Started IT Degree': {
    org: 'Đại học Nông Lâm',
    project: 'Nhập học',
    award: 'Bắt đầu ngành IT',
  },
  '2024|Hello World': {
    org: 'Web Dev',
    project: 'Site đầu tiên',
    award: 'Hello World',
  },
  '2024|UI Fundamentals': {
    org: 'Môn HCI',
    project: 'Bài tập',
    award: 'Nền tảng UI',
  },
  '2025|Modern Stack Transition': {
    org: 'Tự học',
    project: 'React & Next.js',
    award: 'Chuyển sang stack hiện đại',
  },
};

export interface AwardLike {
  year: string;
  org: string;
  project: string;
  award: string;
}

export const localizeAward = <T extends AwardLike>(item: T, lang: Language): T => {
  if (lang !== 'vi') return item;
  const override = awardI18nMap[`${item.year}|${item.award}`];
  if (!override) return item;
  return { ...item, ...override };
};

/**
 * Vietnamese labels for the EXPERIMENTS cards on the Home page lab strip,
 * keyed by experiment id.
 */
const experimentI18nMap: Record<string, { name?: string; desc?: string }> = {
  '01': { name: 'Hiệu ứng hover', desc: 'Nghiên cứu transition CSS & Framer Motion' },
  '02': { name: 'Form', desc: 'Validation, copy UX và các trường hợp biên' },
  '03': { name: 'Layout', desc: 'Grid vs Flexbox và các pattern responsive' },
};

export interface ExperimentLike {
  id: string;
  name: string;
  desc: string;
}

export const localizeExperiment = <T extends ExperimentLike>(item: T, lang: Language): T => {
  if (lang !== 'vi') return item;
  const override = experimentI18nMap[item.id];
  if (!override) return item;
  return { ...item, ...override };
};
