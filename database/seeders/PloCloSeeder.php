<?php

namespace Database\Seeders;

use App\Models\Plo;
use App\Models\Clo;
use App\Models\ProgramStudi;
use App\Models\Periode;
use App\Models\User;
use Illuminate\Database\Seeder;

class PloCloSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Get SI Program Studi
        $prodi = ProgramStudi::where('kode_prodi', 'SI')->first() 
            ?? ProgramStudi::where('nama_prodi', 'like', '%Sistem Informasi%')->first()
            ?? ProgramStudi::first();

        if (!$prodi) {
            $this->command->error('Program Studi "SI" (Sistem Informasi) tidak ditemukan. Silakan jalankan DatabaseSeeder terlebih dahulu.');
            return;
        }

        // 2. Get active Periode (or first fallback)
        $periode = Periode::where('status', 'aktif')->first() ?? Periode::first();
        $periodeId = $periode ? $periode->id : null;

        // 3. Get admin user who created these records
        $admin = User::where('is_super_admin', true)->first() ?? User::first();
        $adminId = $admin ? $admin->id : null;

        // 4. Define PLOs
        $plos = [
            [
                'kode' => 'PLO01',
                'deskripsi' => 'Mampu menganalisis permasalahan infokom yang komplek, mendefinisikan, dan memodelkan kebutuhan dalam konteks enterprise atau masyarakat dengan menerapkan ilmu dan pengetahuan dalam bidang komputasi, teknologi informasi dan komunikasi, dan disiplin lain yang relevan.',
            ],
            [
                'kode' => 'PLO02',
                'deskripsi' => 'Mampu merancang, mengembangkan, mengimplementasikan, dan mengevaluasi solusi berbasis sistem informasi untuk memenuhi kebutuhan organisasi menuju data-driven organization.',
            ],
            [
                'kode' => 'PLO03',
                'deskripsi' => 'Mampu untuk bekerja secara kolaboratif, proaktif, dan bertanggungjawab dalam tim untuk mencapai tujuan bersama dalam berbagai kontek profesional.',
            ],
            [
                'kode' => 'PLO04',
                'deskripsi' => 'Mampu menerapkan pemikiran logis, kritis, sistematis, inovatif terhadap isu dan tanggung jawab profesional dan sosial berdasarkan agama, moral, etika, dan regulasi, dalam upaya pembangunan berkelanjutan.',
            ],
            [
                'kode' => 'PLO05',
                'deskripsi' => 'Mampu berkomunikasi secara efektif baik lisan maupun tulisan dalam berbagai konteks profesional.',
            ],
            [
                'kode' => 'PLO06',
                'deskripsi' => 'Mampu menganalisis peran dan dampak dari sistem dan teknologi informasi terhadap upaya pembangunan berkelanjutan baik di level individu, organisasi, dan masyarakat.',
            ],
            [
                'kode' => 'PLO07',
                'deskripsi' => 'Mampu menunjukkan kinerja mandiri, bermutu, dan terukur, serta inisiatif dalam pengembangan diri sebagai profesional di bidang sistem informasi.',
            ],
            [
                'kode' => 'PLO08',
                'deskripsi' => 'Mampu menggunakan teknik, keahlian, atau kakas terkini yang diperlukan untuk menghasilkan solusi di bidang sistem informasi, baik dalam konteks praktikum ataupun kasus nyata.',
            ],
            [
                'kode' => 'PLO09',
                'deskripsi' => 'Mampu mendukung penyelenggaraan, penggunaan, pengelolaan, evaluasi, dan peningkatan Sistem Informasi untuk mencapai tujuan dan sasaran strategi bisnis dari organisasi.',
            ],
            [
                'kode' => 'PLO10',
                'deskripsi' => 'Mampu berinovasi dan mengaplikasikan pengetahuan bisnis dalam pengembangan kapasitas menjadi seorang technopreneurship.',
            ],
        ];

        // 5. Seed PLOs and cache their created instances/IDs
        $seededPlos = [];
        foreach ($plos as $ploData) {
            $plo = Plo::updateOrCreate(
                [
                    'kode' => $ploData['kode'],
                    'prodi_id' => $prodi->id,
                    'periode_id' => $periodeId,
                ],
                [
                    'deskripsi' => $ploData['deskripsi'],
                    'created_by' => $adminId,
                ]
            );
            $seededPlos[$ploData['kode']] = $plo->id;
        }

        $this->command->info(count($seededPlos) . ' PLOs seeded successfully.');

        // 6. Define CLOs
        $clos = [
            // PLO01
            [
                'plo_kode' => 'PLO01',
                'kode' => 'PLO01-CLO01',
                'deskripsi' => 'Mampu memahami prinsip-prinsip infokom yang mencakup komputasi, matematika, statistika, teknologi informasi dan komunikasi, dan desain yang terkait dalam bidang sistem informasi (Taksonomi Bloom: 2 - Understand)',
            ],
            [
                'plo_kode' => 'PLO01',
                'kode' => 'PLO01-CLO02',
                'deskripsi' => 'Mampu mengidentifikasi kebutuhan sistem informasi yang komplek dalam konteks enterprise atau masyarakat (Taksonomi Bloom: 4 - Analyze)',
            ],
            [
                'plo_kode' => 'PLO01',
                'kode' => 'PLO01-CLO03',
                'deskripsi' => 'Mampu menganalisis permasalahan yang kompleks dalam bidang infokom dalam konteks enterprise atau masyarakat (Taksonomi Bloom: 4 - Analyze)',
            ],
            [
                'plo_kode' => 'PLO01',
                'kode' => 'PLO01-CLO04',
                'deskripsi' => 'Mampu mendefinisikan dan memodelkan kebutuhan dalam bidang infokom dalam konteks enterprise atau masyarakat (Taksonomi Bloom: 4 - Analyze)',
            ],
            [
                'plo_kode' => 'PLO01',
                'kode' => 'PLO01-CLO05',
                'deskripsi' => 'Mampu menerapkan pengetahuan matematika dan statistika dalam lingkup disiplin ilmu sistem informasi (Taksonomi Bloom: 3 - Apply)',
            ],
            [
                'plo_kode' => 'PLO01',
                'kode' => 'PLO01-CLO06',
                'deskripsi' => 'Mampu menerapkan prinsip infokom dalam komputasi, teknologi informasi dan komunikasi, dan desain dalam lingkup disiplin ilmu sistem informasi (Taksonomi Bloom: 3 - Apply)',
            ],
            [
                'plo_kode' => 'PLO01',
                'kode' => 'PLO01-CLO07',
                'deskripsi' => 'Mampu menerapkan perspektif disiplin lain dalam analisis permasalahan infokom (Taksonomi Bloom: 3 - Apply)',
            ],

            // PLO02
            [
                'plo_kode' => 'PLO02',
                'kode' => 'PLO02-CLO01',
                'deskripsi' => 'Mampu membuat perancangan sistem informasi untuk memenuhi kebutuhan organisasi menuju data-driven organization (Taksonomi Bloom: 6 - Create)',
            ],
            [
                'plo_kode' => 'PLO02',
                'kode' => 'PLO02-CLO02',
                'deskripsi' => 'Mampu mengembangkan solusi berbasis sistem informasi menggunakan metodologi pengembangan yang tepat (Taksonomi Bloom: 6 - Create)',
            ],
            [
                'plo_kode' => 'PLO02',
                'kode' => 'PLO02-CLO03',
                'deskripsi' => 'Mampu mengevaluasi solusi berbasis sistem informasi dengan menggunakan metode yang tepat (Taksonomi Bloom: 5 - Evaluate)',
            ],

            // PLO03
            [
                'plo_kode' => 'PLO03',
                'kode' => 'PLO03-CLO01',
                'deskripsi' => 'Mampu berkontribusi secara aktif dan proaktif dan bertanggung jawab dalam tim kerja untuk mencapai tujuan bersama dalam lingkungan profesional (Taksonomi Bloom: 3 - Apply)',
            ],
            [
                'plo_kode' => 'PLO03',
                'kode' => 'PLO03-CLO02',
                'deskripsi' => 'Mampu beradaptasi dalam berbagai konteks profesional untuk mencapai tujuan bersama (Taksonomi Bloom: 3 - Apply)',
            ],

            // PLO04
            [
                'plo_kode' => 'PLO04',
                'kode' => 'PLO04-CLO01',
                'deskripsi' => 'Mampu memahami pemikiran logis, kritis, sistematis, inovatif terhadap isu dan tanggung jawab profesional dan sosial berdasarkan agama dalam upaya pembangunan berkelanjutan (Taksonomi Bloom: 2 - Understand)',
            ],
            [
                'plo_kode' => 'PLO04',
                'kode' => 'PLO04-CLO02',
                'deskripsi' => 'Mampu memahami pemikiran logis, kritis, sistematis, inovatif terhadap isu dan tanggung jawab profesional dan sosial berdasarkan moral dan etika dalam upaya pembangunan berkelanjutan (Taksonomi Bloom: 2 - Understand)',
            ],
            [
                'plo_kode' => 'PLO04',
                'kode' => 'PLO04-CLO03',
                'deskripsi' => 'Mampu memahami pemikiran logis, kritis, sistematis, inovatif terhadap isu dan tanggung jawab profesional dan sosial berdasarkan regulasi dalam upaya pembangunan berkelanjutan (Taksonomi Bloom: 2 - Understand)',
            ],
            [
                'plo_kode' => 'PLO04',
                'kode' => 'PLO04-CLO04',
                'deskripsi' => 'Mampu menganalisis pemikiran logis, kritis, sistematis, inovatif terhadap isu dan tanggung jawab profesional dan sosial berdasarkan moral dan etika dalam upaya pembangunan berkelanjutan (Taksonomi Bloom: 4 - Analyze)',
            ],
            [
                'plo_kode' => 'PLO04',
                'kode' => 'PLO04-CLO05',
                'deskripsi' => 'Mampu menerapkan pemikiran logis, kritis, sistematis, inovatif terhadap isu dan tanggung jawab profesional dan sosial berdasarkan moral dan etika dalam upaya pembangunan berkelanjutan (Taksonomi Bloom: 3 - Apply)',
            ],
            [
                'plo_kode' => 'PLO04',
                'kode' => 'PLO04-CLO06',
                'deskripsi' => 'Mampu menerapkan pemikiran logis, kritis, sistematis, inovatif terhadap isu dan tanggung jawab profesional dan sosial berdasarkan regulasi dalam upaya pembangunan berkelanjutan (Taksonomi Bloom: 3 - Apply)',
            ],
            [
                'plo_kode' => 'PLO04',
                'kode' => 'PLO04-CLO07',
                'deskripsi' => 'Mampu menganalisis pemikiran logis, kritis, sistematis, inovatif terhadap isu dan tanggung jawab profesional dan sosial berdasarkan moral dan etika dalam upaya pembangunan berkelanjutan (Taksonomi Bloom: 4 - Analyze)',
            ],

            // PLO05
            [
                'plo_kode' => 'PLO05',
                'kode' => 'PLO05-CLO01',
                'deskripsi' => 'Mampu memahami prinsip komunikasi secara efektif dalam bentuk lisan dan tulisan dalam berbagai konteks profesional (Taksonomi Bloom: 2 - Understand)',
            ],
            [
                'plo_kode' => 'PLO05',
                'kode' => 'PLO05-CLO02',
                'deskripsi' => 'Mampu berkomunikasi secara efektif dalam bentuk lisan dan tulisan dalam berbagai konteks profesional (Taksonomi Bloom: 3 - Apply)',
            ],

            // PLO06
            [
                'plo_kode' => 'PLO06',
                'kode' => 'PLO06-CLO01',
                'deskripsi' => 'Mampu menjelaskan peran dan dampak dari sistem dan teknologi informasi dalam upaya pembangunan berkelanjutan di level individu, organisasi, dan masyarakat (Taksonomi Bloom: 2 - Understand)',
            ],
            [
                'plo_kode' => 'PLO06',
                'kode' => 'PLO06-CLO02',
                'deskripsi' => 'Mampu menganalisis peran dan dampak dari sistem dan teknologi informasi dalam upaya pembangunan berkelanjutan di level individu, organisasi, dan masyarakat (Taksonomi Bloom: 4 - Analyze)',
            ],

            // PLO07
            [
                'plo_kode' => 'PLO07',
                'kode' => 'PLO07-CLO01',
                'deskripsi' => 'Mampu menunjukkan kinerja mandiri di bidang sistem informasi (Taksonomi Bloom: 3 - Apply)',
            ],
            [
                'plo_kode' => 'PLO07',
                'kode' => 'PLO07-CLO02',
                'deskripsi' => 'Mampu menunjukkan kinerja bermutu dan terukur di bidang sistem informasi (Taksonomi Bloom: 3 - Apply)',
            ],
            [
                'plo_kode' => 'PLO07',
                'kode' => 'PLO07-CLO03',
                'deskripsi' => 'Mampu berinisiatif dalam aktivitas pengembangan diri sebagai profesional di bidang sistem informasi (Taksonomi Bloom: 3 - Apply)',
            ],

            // PLO08
            [
                'plo_kode' => 'PLO08',
                'kode' => 'PLO08-CLO01',
                'deskripsi' => 'Mampu menggunakan teknik, metode, perangkat lunak, atau kakas terkini untuk menghasilkan solusi di bidang sistem informasi dalam konteks praktikum (Taksonomi Bloom: 3 - Apply)',
            ],
            [
                'plo_kode' => 'PLO08',
                'kode' => 'PLO08-CLO02',
                'deskripsi' => 'Mampu menggunakan teknik, metode, perangkat lunak, atau kakas terkini untuk menghasilkan solusi di bidang sistem informasi dalam konteks kasus nyata (Taksonomi Bloom: 3 - Apply)',
            ],

            // PLO09
            [
                'plo_kode' => 'PLO09',
                'kode' => 'PLO09-CLO01',
                'deskripsi' => 'Mampu memahami prinsip dan fungsi manajemen Sistem Informasi untuk mendukung strategi bisnis (Taksonomi Bloom: 2 - Understand)',
            ],
            [
                'plo_kode' => 'PLO09',
                'kode' => 'PLO09-CLO02',
                'deskripsi' => 'Mampu menerapkan ilmu dan praktek yang relevan dalam pengelolaan sistem informasi untuk mendukung strategi bisnis dan tujuan organisasi (Taksonomi Bloom: 3 - Apply)',
            ],
            [
                'plo_kode' => 'PLO09',
                'kode' => 'PLO09-CLO03',
                'deskripsi' => 'Mampu memodelkan penyelenggaraan sistem informasi di konteks organisasi (Taksonomi Bloom: 4 - Analyze)',
            ],
            [
                'plo_kode' => 'PLO09',
                'kode' => 'PLO09-CLO04',
                'deskripsi' => 'Mampu mengevaluasi kinerja sistem informasi dan mengusulkan perbaikan untuk meningkatkan kontribusi sistem informasi terhadap tujuan bisnis organisasi (Taksonomi Bloom: 5 - Evaluate)',
            ],
            [
                'plo_kode' => 'PLO09',
                'kode' => 'PLO09-CLO05',
                'deskripsi' => 'Mampu merancang arsitektur sistem informasi untuk mendukung strategi bisnis dan tujuan organisasi (Taksonomi Bloom: 6 - Create)',
            ],

            // PLO10
            [
                'plo_kode' => 'PLO10',
                'kode' => 'PLO10-CLO01',
                'deskripsi' => 'Mampu memahami prinsip dan tahap dalam inisiatif bisnis berbasis sistem dan teknologi informasi (Taksonomi Bloom: 2 - Understand)',
            ],
            [
                'plo_kode' => 'PLO10',
                'kode' => 'PLO10-CLO02',
                'deskripsi' => 'Mampu mengembangkan kapasitas sebagai technopreneurship seperti komunikasi, inovasi, dan networking (Taksonomi Bloom: 3 - Apply)',
            ],
            [
                'plo_kode' => 'PLO10',
                'kode' => 'PLO10-CLO03',
                'deskripsi' => 'Mampu mengembangkan rancangan produk atau layanan berbasis teknologi informasi (Taksonomi Bloom: 6 - Create)',
            ],
        ];

        // 7. Seed CLOs mapped to their respective parent PLOs
        $cloCount = 0;
        foreach ($clos as $cloData) {
            $ploId = $seededPlos[$cloData['plo_kode']] ?? null;
            if (!$ploId) {
                $this->command->error("Parent PLO ({$cloData['plo_kode']}) not found for CLO: {$cloData['kode']}");
                continue;
            }

            Clo::updateOrCreate(
                [
                    'kode' => $cloData['kode'],
                    'plo_id' => $ploId,
                    'periode_id' => $periodeId,
                ],
                [
                    'deskripsi' => $cloData['deskripsi'],
                    'created_by' => $adminId,
                ]
            );
            $cloCount++;
        }

        $this->command->info($cloCount . ' CLOs seeded successfully.');
    }
}
