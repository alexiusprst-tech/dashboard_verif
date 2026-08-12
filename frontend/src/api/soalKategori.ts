import axiosInstance from './axiosInstance';

/**
 * API layer for Soal Kategori (Kategori Soal) endpoints.
 * Actor: SuperAdmin
 * Source: AGENTS.md Section 9 — hanya jika tabel terkonfirmasi belum ada (NEEDS CONFIRMATION)
 *
 * NEEDS CONFIRMATION: Tabel soal_kategori di database existing belum terkonfirmasi.
 * Endpoint ini bisa berubah setelah verifikasi skema database.
 */

export interface SoalKategori {
  id: number;
  nama: string;
  deskripsi?: string;
  created_at: string;
  updated_at: string;
}

export const soalKategoriApi = {
  getAll: async (): Promise<SoalKategori[]> => {
    const response = await axiosInstance.get('/soal-kategori');
    return response.data.data;
  },

  store: async (data: { nama: string; deskripsi?: string }): Promise<SoalKategori> => {
    const response = await axiosInstance.post('/soal-kategori', data);
    return response.data.data;
  },

  update: async (
    id: number,
    data: { nama: string; deskripsi?: string }
  ): Promise<SoalKategori> => {
    const response = await axiosInstance.put(`/soal-kategori/${id}`, data);
    return response.data.data;
  },

  destroy: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/soal-kategori/${id}`);
  },
};
