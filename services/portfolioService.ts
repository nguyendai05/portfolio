// Compatibility barrel for existing imports.
// New code should import resource-specific helpers from `services/api/*`.
export {
  api,
  ApiError,
  getAdminToken,
  hasAdminToken,
  setAdminToken,
  setAdminCsrfToken,
  withRetry,
} from './api/client';
export type { ApiErrorKind, ApiMethod, ApiOptions } from './api/client';

export {
  createProject,
  deleteProject,
  fetchAllProjects,
  fetchAdminProjectsPage,
  fetchProjectById,
  fetchProjectBySlug,
  fetchProjects,
  fetchTools,
  updateProject,
} from './api/projects';
export type { ProjectFormPayload } from './api/projects';

export {
  createSkill,
  deleteSkill,
  fetchSkillNames,
  fetchSkills,
  updateSkill,
} from './api/skills';

export { createAward, deleteAward, fetchAwards, updateAward } from './api/awards';

export {
  createExperiment,
  deleteExperiment,
  fetchExperiments,
  updateExperiment,
} from './api/experiments';

export {
  deleteContactMessage,
  fetchContactMessages,
  fetchContactMessagesPage,
  resendContactMessage,
  updateContactStatus,
} from './api/contact';

export {
  adminLogin,
  adminLogout,
  fetchAdminSession,
  fetchAdminStats,
  verifyAdminToken,
} from './api/admin';

export type { AdminStats, Award, ContactMessage, Experiment, Skill } from './api/types';
