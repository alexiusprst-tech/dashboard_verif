import axiosInstance from './axiosInstance';
import type { KoordinatorAssignment } from '../types/KoordinatorAssignment';

/**
 * API layer for Koordinator Assignment endpoints.
 * Endpoints: POST /api/koordinator-assignments, PUT /api/koordinator-assignments/{id}
 * Actor: SuperAdmin
 * Source: AGENTS.md Section 9, tech-spec.md Section 4.2
 */

export const koordinatorAssignmentApi = {
  /**
   * Get all koordinator assignments.
   * Optionally filtered by semester_id.
   */
  getAll: async (semesterId?: number): Promise<KoordinatorAssignment[]> => {
    const params = semesterId ? { semester_id: semesterId } : {};
    const response = await axiosInstance.get('/koordinator-assignments', { params });
    return response.data.data;
  },

  /**
   * Get a single koordinator assignment by ID.
   */
  getById: async (id: number): Promise<KoordinatorAssignment> => {
    const response = await axiosInstance.get(`/koordinator-assignments/${id}`);
    return response.data.data;
  },

  /**
   * Create a new koordinator assignment (menunjuk Koordinator).
   * BR-03: Super Admin dapat menunjuk Koordinator.
   */
  store: async (data: {
    course_id: number;
    user_id: number;
    semester_id: number;
  }): Promise<KoordinatorAssignment> => {
    const response = await axiosInstance.post('/koordinator-assignments', data);
    return response.data.data;
  },

  /**
   * Update an existing koordinator assignment (mengganti Koordinator).
   * BR-04: Super Admin dapat mengganti Koordinator dari user 1 ke user 2.
   * Unique constraint: (course_id, semester_id) — satu MK hanya punya satu Koordinator per semester.
   */
  update: async (
    id: number,
    data: { user_id: number }
  ): Promise<KoordinatorAssignment> => {
    const response = await axiosInstance.put(`/koordinator-assignments/${id}`, data);
    return response.data.data;
  },
};
