// Compatibility barrel for existing imports.
// New code should import resource-specific helpers from `services/api/*`.
export {
  api,
  ApiError,
  getAdminToken,
  hasAdminToken,
  setAdminToken,
  withRetry,
} from './api/client';
export type { ApiErrorKind, ApiMethod, ApiOptions } from './api/client';

export {
  createProject,
  deleteProject,
  fetchAllProjects,
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
  updateContactStatus,
} from './api/contact';

export { adminLogin, fetchAdminStats, verifyAdminToken } from './api/admin';

export type { AdminStats, Award, ContactMessage, Experiment, Skill } from './api/types';
