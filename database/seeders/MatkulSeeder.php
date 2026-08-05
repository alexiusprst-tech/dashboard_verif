<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\ProgramStudi;
use Illuminate\Database\Seeder;

class MatkulSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $prodi = ProgramStudi::where('kode_prodi', 'SI')->first();

        if (!$prodi) {
            $this->command->warn('Program Studi SI tidak ditemukan. Pastikan DatabaseSeeder sudah dijalankan terlebih dahulu.');
            return;
        }

        // Format: [kode_mk, nama_mk, sks, semester, kategori]
        $matkul = [
            // Semester 1 (20 SKS)
            ['UCK1EDB1', 'Agama',                                                                    2, 1, 'wajib'],
            ['UCK1FDB1', 'Internalisasi Budaya dan Pembentukan Karakter',                            2, 1, 'wajib'],
            ['BBK1AAB4', 'Algoritma dan Pemrograman',                                               4, 1, 'wajib'],
            ['BBK1BAB3', 'Matematika Diskrit',                                                      3, 1, 'wajib'],
            ['BBK1CAB3', 'Matematika untuk Sistem Informasi',                                       3, 1, 'wajib'],
            ['BBK1DAB3', 'Pengantar Sistem Informasi',                                              3, 1, 'wajib'],
            ['BBK1EAB3', 'Sistem Enterprise',                                                       3, 1, 'wajib'],

            // Semester 2 (20 SKS)
            ['BBK1FAB3', 'Design Thinking',                                                         3, 2, 'wajib'],
            ['BBK1GAB3', 'Jaringan Komputer',                                                       3, 2, 'wajib'],
            ['BBK1HAB2', 'Kepemimpinan dan Komunikasi Interpersonal',                               2, 2, 'wajib'],
            ['BBK1IAB3', 'Manajemen Rantai Pasok',                                                  3, 2, 'wajib'],
            ['BBK1JAB3', 'Pemrograman Berorientasi Objek',                                          3, 2, 'wajib'],
            ['BBK1KAB2', 'Probabilitas dan Statistik',                                              2, 2, 'wajib'],
            ['BBK1LAB3', 'Sistem Basis Data',                                                       3, 2, 'wajib'],
            ['UCKXADB2', 'Bahasa Inggris',                                                          1, 2, 'wajib'],

            // Semester 3 (20 SKS)
            ['BBK2AAB3', 'Analisis dan Perancangan Sistem Informasi',                               3, 3, 'wajib'],
            ['BBK2BAB2', 'Etika Profesi, Regulasi Teknologi Informasi dan Properti Intelektual',    2, 3, 'wajib'],
            ['BBK2CAB3', 'Pemodelan Proses Bisnis',                                                 3, 3, 'wajib'],
            ['BBK2DAB3', 'Pengembangan Aplikasi Website',                                           3, 3, 'wajib'],
            ['BBK2EAB3', 'Perancangan Interaksi',                                                   3, 3, 'wajib'],
            ['BBK2FAB3', 'Sistem Operasi',                                                          3, 3, 'wajib'],
            ['BBK2GAB3', 'Statistika Industri',                                                     3, 3, 'wajib'],

            // Semester 4 (20 SKS)
            ['BBK2HAB3', 'Integrasi Aplikasi Enterprise',                                           3, 4, 'wajib'],
            ['BBK2IAB3', 'Keamanan Sistem Informasi',                                               3, 4, 'wajib'],
            ['BBK2JAB3', 'Manajemen Proyek Sistem Informasi',                                       3, 4, 'wajib'],
            ['BBK2KAB3', 'Manajemen Sumber Daya Manusia',                                           3, 4, 'wajib'],
            ['BBK2LAB3', 'Penambangan Data',                                                        3, 4, 'wajib'],
            ['BBK2MAB2', 'Pengujian dan Implementasi Sistem',                                       2, 4, 'wajib'],
            ['BBK2NAB3', 'Rekayasa Proses Bisnis',                                                  3, 4, 'wajib'],

            // Semester 5 (20 SKS)
            ['BBK3AAB3', 'Arsitektur Enterprise',                                                   3, 5, 'wajib'],
            ['BBK3BAB3', 'Data Warehouse dan Business Intelligence',                                3, 5, 'wajib'],
            ['BBK3CAB3', 'Komputasi Awan',                                                          3, 5, 'wajib'],
            ['BBK3DAB3', 'Manajemen Data Enterprise',                                               3, 5, 'wajib'],
            ['BBK3EAB3', 'Proyek Perangkat Lunak',                                                  3, 5, 'wajib'],
            ['BBK3FAB3', 'Sistem Informasi Akuntansi',                                              3, 5, 'wajib'],
            ['UBKXCCB2', 'Bahasa Indonesia',                                                        2, 5, 'wajib'],

            // Semester 6 (20 SKS)
            ['BBK3GAB3', 'Bahasa Inggris II',                                                       3, 6, 'wajib'],
            ['BBK3HAB3', 'Kecerdasan Artifisial dan Penerapannya',                                  3, 6, 'wajib'],
            ['BBK3IAB2', 'Kerja Praktek dan Pengabdian Masyarakat',                                 2, 6, 'wajib'],
            ['BBK3JAB3', 'Tata Kelola dan Manajemen Teknologi Informasi',                           3, 6, 'wajib'],
            ['MKP3001',  'Mata Kuliah Pilihan Prodi I / MK MBKM / MK WRAP',                        3, 6, 'pilihan'],
            ['MKP3002',  'Mata Kuliah Pilihan Prodi II / MK MBKM / MK WRAP',                       3, 6, 'pilihan'],
            ['UCKXBDB2', 'Kewirausahaan',                                                           3, 6, 'wajib'],

            // Semester 7 (18 SKS)
            ['BBK4AAC4', 'Capstone Project',                                                        4, 7, 'wajib'],
            ['BBK4BAB2', 'Metode Penelitian dan Penyusunan Karya Ilmiah',                           2, 7, 'wajib'],
            ['MKP4003',  'Mata Kuliah Pilihan Prodi III / MK MBKM / MK WRAP',                      3, 7, 'pilihan'],
            ['MKP4004',  'Mata Kuliah Pilihan Prodi IV / MK MBKM / MK WRAP',                       3, 7, 'pilihan'],
            ['MKP4005',  'Mata Kuliah Pilihan Prodi V / MK MBKM / MK WRAP',                        3, 7, 'pilihan'],
            ['UBKXACB2', 'Kewarganegaraan',                                                         2, 7, 'wajib'],
            ['UBKXBCB2', 'Pancasila',                                                               2, 7, 'wajib'],

            // Semester 8 (7 SKS)
            ['BBK4CAB3', 'Pelatihan dan Sertifikasi',                                               3, 8, 'wajib'],
            ['BBK4DAA4', 'Tugas Akhir',                                                             4, 8, 'wajib'],
        ];

        foreach ($matkul as [$kode, $nama, $sks, $semester, $kategori]) {
            Course::updateOrCreate(
                ['kode_mk' => $kode],
                [
                    'nama_mk'  => $nama,
                    'sks'      => $sks,
                    'semester' => $semester,
                    'kategori' => $kategori,
                    'prodi_id' => $prodi->id,
                ]
            );
        }

        $this->command->info('MatkulSeeder: ' . count($matkul) . ' mata kuliah berhasil di-seed dengan data semester, SKS & kategori.');
    }
}
