import { getJSON, postJSON, putJSON, deleteJSON } from '../fetch-helpers';

const SelfAssessmentController = {
  listSkillFamilies: (frameworkId) =>
    getJSON(`/admin/frameworks/${frameworkId}/skill-families`),

  listQuestions: (frameworkId) =>
    getJSON(`/admin/frameworks/${frameworkId}/self-assessment-questions`),

  addQuestion: (frameworkId, data) =>
    postJSON(`/admin/frameworks/${frameworkId}/self-assessment-questions`, data),

  updateQuestion: (frameworkId, questionId, data) =>
    putJSON(`/admin/frameworks/${frameworkId}/self-assessment-questions/${questionId}`, data),

  deleteQuestion: (frameworkId, questionId) =>
    deleteJSON(`/admin/frameworks/${frameworkId}/self-assessment-questions/${questionId}`),

  regenerateEmbeddings: (frameworkId) =>
    postJSON(`/admin/frameworks/${frameworkId}/self-assessment-questions/regenerate-embeddings`, {}),
};

export default SelfAssessmentController;
