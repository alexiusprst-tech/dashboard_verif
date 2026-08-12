import axiosInstance from './axiosInstance';

/**
 * API layer for Verifikator Assignment endpoints.
 * Actor: SuperAdmin
 * Source: AGENTS.md Section 9 (penugasan-verifikator), tech-spec.md Section 4.2
 */

export interface VerifikatorAssignmentPayload {
  user_id: number;
  course_id: number; // Include wajib: menentukan MK (use case diagram)
  semester_id: number;
}

export const verifikatorAssignmentApi = {
  /**
   * Get all verifikator assignments.
   */
  getAll: async (semesterId?: number) => {
    const params = semesterId ? { semester_id: semesterId } : {};
    const response = await axiosInstance.get('/penugasan-verifikator', { params });
    return response.data.data;
  },

  /**
   * Create a new verifikator assignment.
   * BR-05: Super Admin dapat menunjuk Verifikator.
   * Include wajib: menentukan MK (use case diagram Section 1.5).
   */
  store: async (data: VerifikatorAssignmentPayload) => {
    const response = await axiosInstance.post('/penugasan-verifikator', data);
    return response.data.data;
  },

  /**
   * Delete a verifikator assignment.
   */
  destroy: async (id: number) => {
    const response = await axiosInstance.delete(`/penugasan-verifikator/${id}`);
    return response.data;
  },
};
