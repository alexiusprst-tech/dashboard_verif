<?php

namespace Database\Seeders;

use App\Models\ProgramStudi;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DosenSeeder extends Seeder
{
    /**
     * Dosen tetap (tipe: biasa).
     *
     * @var array<int, array<string, string>>
     */
    private array $dosen = [
        ['kode_dosen' => 'QLB', 'nama_lengkap' => 'Qilbaaini Effendi Muftikhali, S.Kom., M.Kom.'],
        ['kode_dosen' => 'SHC', 'nama_lengkap' => 'Sasmi Hidayatul Yulianing Tyas, S.Kom., M.Kom.'],
        ['kode_dosen' => 'WHO', 'nama_lengkap' => 'Dea Wemona Rahma, S.Kom., M.T.I.'],
        ['kode_dosen' => 'WRA', 'nama_lengkap' => 'Dwina Satrinia, S.Kom., M.T.'],
        ['kode_dosen' => 'DWN', 'nama_lengkap' => 'Dewi Marini Umi Atmaja, S.Kom., M.Kom.'],
        ['kode_dosen' => 'DET', 'nama_lengkap' => 'Deki Satria, S.T., M.Kom.'],
        ['kode_dosen' => 'ILR', 'nama_lengkap' => 'Ilham Roni Yansyah, S.Kom., M.Kom.'],
        ['kode_dosen' => 'MSE', 'nama_lengkap' => 'Muhammad Solehuddin, S.SI., M.Kom.'],
        ['kode_dosen' => 'ARK', 'nama_lengkap' => 'Arif Rahman Hakim, S.Kom., M.Kom.'],
        ['kode_dosen' => 'ZIZ', 'nama_lengkap' => 'Muhammad Aziz Kurniawan, S.SI., M.T.'],
        ['kode_dosen' => 'YZN', 'nama_lengkap' => 'Yumna Zahran Ramadhan, S.Kom., M.Kom.'],
        ['kode_dosen' => 'FRE', 'nama_lengkap' => 'Fadhil Rozi Hendrawan, S.Kom., M.Kom.'],
        ['kode_dosen' => 'AIK', 'nama_lengkap' => 'Ade Rahmat Iskandar, S.Kom., M.T.'],
        ['kode_dosen' => 'CHS', 'nama_lengkap' => 'Adelia Chitra Sazkia, S.Kom., M.Comp.Sc.'],
        ['kode_dosen' => 'HMW', 'nama_lengkap' => 'Ahmad Ridwan Fauzi, S.Kom., M.Sc., MBA.'],
        ['kode_dosen' => 'PRQ', 'nama_lengkap' => 'Putri Rizqiyah, S.Kom., M.Kom.'],
        ['kode_dosen' => 'DIS', 'nama_lengkap' => 'Muhammad Ardiansyah, S.Kom., M.M.'],
        ['kode_dosen' => 'IPJ', 'nama_lengkap' => 'I Putu Eka Juliantara, S.T., M.Eng.'],
        ['kode_dosen' => 'PTM', 'nama_lengkap' => 'Putri Utami Rukmana, S.Kom., M.Kom.'],
        ['kode_dosen' => 'TRM', 'nama_lengkap' => 'Tiara Rahmania Hadiningrum, S.Kom., M.Kom.'],
    ];

    /**
     * Dosen Luar Biasa / DLB (tipe: lb).
     *
     * semester_lb diisi null — administrator mengatur keaktifan
     * per periode melalui panel admin sesuai jadwal semester.
     *
     * @var array<int, array<string, string>>
     */
    private array $dosenLb = [
        ['kode_dosen' => 'MTM', 'nama_lengkap' => 'Muhammad Fakhrul Safitra, S.Kom., M.Kom.'],
        ['kode_dosen' => 'OHO', 'nama_lengkap' => 'Hary Nugroho, S.T., M.T.'],
        ['kode_dosen' => 'MCG', 'nama_lengkap' => 'Monica Khoirunnisa, S.Pd., M.Pd.'],
        ['kode_dosen' => 'SHN', 'nama_lengkap' => 'Sukrina Herman, S.Kom., M.Kom.'],
        ['kode_dosen' => 'CDH', 'nama_lengkap' => 'Ahmad Cecep Damanhuri, M.Pd.'],
        ['kode_dosen' => 'EON', 'nama_lengkap' => 'Eva Novianti, S.Kom, M.MSI.'],
        ['kode_dosen' => 'VYT', 'nama_lengkap' => 'Novyta, S.Si., M.Pd.'],
        ['kode_dosen' => 'MNN', 'nama_lengkap' => 'Masnia, M.Pd.'],
        ['kode_dosen' => 'BYN', 'nama_lengkap' => 'Dr. Bony Parulian Josaphat, S.Si., M.Si.'],
        ['kode_dosen' => 'LUK', 'nama_lengkap' => 'Lukman Medriavin Silalahi, A.Md., S.T., M.T.'],
        ['kode_dosen' => 'LYN', 'nama_lengkap' => 'Lingga Yuliana, S.E., M.M.'],
        ['kode_dosen' => 'SYU', 'nama_lengkap' => "Syukron Ma'mun, S.Kom., M.T.I."],
        ['kode_dosen' => 'PCY', 'nama_lengkap' => 'Paxilla Chairany, S.Kom., M.Kom.'],
        ['kode_dosen' => 'PDO', 'nama_lengkap' => 'Prasetyo Dwi Hatmoko, M.Pd.'],
        ['kode_dosen' => 'MOQ', 'nama_lengkap' => 'Dr. Mohammad Siddiq, M.Si., M.Pd.'],
        ['kode_dosen' => 'NUN', 'nama_lengkap' => 'Ninuk Wiliani, S.Si, M.Kom, Ph.D'],
        ['kode_dosen' => 'AYN', 'nama_lengkap' => 'Dr. Andri Ardiansyah, S.Pd.I., M.Pd.'],
        ['kode_dosen' => 'YPS', 'nama_lengkap' => 'Yohanes Pranata Selai, S.Fil., M.Th.'],
        ['kode_dosen' => 'PJI', 'nama_lengkap' => 'Dr. Puji Rahayu, S.Kom., M.Kom.'],
        ['kode_dosen' => 'VVI', 'nama_lengkap' => 'Alva Nurvina Sularso, S.Sos., M.Hum.'],
        ['kode_dosen' => 'KIH', 'nama_lengkap' => 'Khalid Akbar, M.H.'],
        ['kode_dosen' => 'IIM', 'nama_lengkap' => 'Iman Karim, S.H., M.H.'],
    ];

    /**
     * Jalankan seeder data dosen.
     *
     * Menggunakan DB::transaction agar seluruh operasi bersifat atomik —
     * jika satu gagal, semua perubahan akan di-rollback.
     */
    public function run(): void
    {
        // Pastikan program studi SI sudah tersedia sebelum insert dosen.
        $prodi = ProgramStudi::where('kode_prodi', 'SI')->first();

        DB::transaction(function () use ($prodi): void {
            // Seed dosen tetap.
            $this->seedDosen($this->dosen, 'biasa', null, $prodi?->id);

            // Seed dosen luar biasa (DLB).
            $this->seedDosen($this->dosenLb, 'lb', null, $prodi?->id);
        });

        $total = count($this->dosen) + count($this->dosenLb);

        $this->command->info(sprintf(
            '✓ DosenSeeder: %d dosen tetap + %d dosen LB = %d total berhasil di-seed.',
            count($this->dosen),
            count($this->dosenLb),
            $total,
        ));
    }

    /**
     * Insert atau perbarui satu kelompok dosen ke tabel users.
     *
     * @param  array<int, array<string, string>>  $list        Data dosen yang akan di-seed.
     * @param  string                             $tipe        'biasa' atau 'lb'.
     * @param  string|null                        $semesterLb  'ganjil'|'genap'|null (hanya relevan untuk tipe lb).
     * @param  int|null                           $prodiId     Foreign key ke tabel program_studis.
     */
    private function seedDosen(
        array $list,
        string $tipe,
        ?string $semesterLb,
        ?int $prodiId,
    ): void {
        foreach ($list as $data) {
            User::updateOrCreate(
                // Kunci pencarian: kode_dosen bersifat unik per dosen.
                ['kode_dosen' => $data['kode_dosen']],
                // Kolom yang di-set atau diperbarui jika record sudah ada.
                [
                    'uuid'           => (string) Str::uuid(),
                    'nama_lengkap'   => $data['nama_lengkap'],
                    'email'          => strtolower($data['kode_dosen']) . '@telkomuniversity.ac.id',
                    'password'       => Hash::make('password'),
                    'prodi_id'       => $prodiId,
                    'is_super_admin'    => false,
                    'is_coordinator'    => false,
                    'is_koordinator_mk' => false,
                    'tipe_dosen'        => $tipe,
                    'semester_lb'    => $semesterLb,
                    'status_aktif'   => true,
                ]
            );
        }
    }
}
