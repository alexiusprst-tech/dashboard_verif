<?php

namespace App\Repositories\Eloquent;

use App\Repositories\Contracts\DashboardRepositoryContract;
use Illuminate\Support\Facades\DB;
use App\Models\Soal;
use App\Models\Penugasan;
use App\Models\Periode;
use App\Enums\SoalStatus;

class EloquentDashboardRepository implements DashboardRepositoryContract
{
    public function countSoalByStatus(int $periodeId, ?int $dosenId = null): array
    {
        $query = DB::table('soal')
            ->where('periode_id', $periodeId)
            ->whereNull('deleted_at');

        if ($dosenId !== null) {
            $query->where('dosen_id', $dosenId);
        }

        $results = $query->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $statuses = ['draft', 'submitted', 'in_review', 'revisi', 'approved', 'rejected'];
        $formatted = [];
        foreach ($statuses as $status) {
            $formatted[$status] = $results[$status] ?? 0;
        }

        return $formatted;
    }

    public function progressByPeriode(int $periodeId): array
    {
        $total = DB::table('soal')
            ->where('periode_id', $periodeId)
            ->whereNull('deleted_at')
            ->where('status', '!=', 'draft')
            ->count();

        $verified = DB::table('soal')
            ->where('periode_id', $periodeId)
            ->whereNull('deleted_at')
            ->whereIn('status', ['approved', 'revisi', 'rejected'])
            ->count();

        $percentage = $total > 0 ? round(($verified / $total) * 100, 2) : 0;

        return [
            'total' => $total,
            'verified' => $verified,
            'percentage' => $percentage
        ];
    }

    public function progressByProdi(int $periodeId): array
    {
        return DB::table('program_studi')
            ->leftJoin('users', 'program_studi.id', '=', 'users.prodi_id')
            ->leftJoin('soal', 'users.id', '=', 'soal.dosen_id')
            ->select(
                'program_studi.nama_prodi',
                DB::raw('COUNT(CASE WHEN soal.periode_id = ' . $periodeId . ' AND soal.deleted_at IS NULL AND soal.status != \'draft\' THEN 1 END) as total'),
                DB::raw('COUNT(CASE WHEN soal.periode_id = ' . $periodeId . ' AND soal.deleted_at IS NULL AND soal.status = \'approved\' THEN 1 END) as approved')
            )
            ->groupBy('program_studi.id', 'program_studi.nama_prodi')
            ->get()
            ->map(function ($item) {
                $total = (int) $item->total;
                $approved = (int) $item->approved;
                return [
                    'prodi' => $item->nama_prodi,
                    'total' => $total,
                    'approved' => $approved,
                    'percentage' => $total > 0 ? round(($approved / $total) * 100, 2) : 0
                ];
            })
            ->toArray();
    }

    public function picSummary(int $verifierId, int $periodeId): array
    {
        $targetDosenIds = DB::table('penugasan')
            ->where('verifier_id', $verifierId)
            ->where('periode_id', $periodeId)
            ->pluck('target_dosen_id')
            ->toArray();

        if (empty($targetDosenIds)) {
            return ['total' => 0, 'pending' => 0, 'done' => 0];
        }

        $total = DB::table('soal')
            ->where('periode_id', $periodeId)
            ->whereIn('dosen_id', $targetDosenIds)
            ->whereNull('deleted_at')
            ->where('status', '!=', 'draft')
            ->count();

        $done = DB::table('soal')
            ->where('periode_id', $periodeId)
            ->whereIn('dosen_id', $targetDosenIds)
            ->whereNull('deleted_at')
            ->whereIn('status', ['approved', 'revisi', 'rejected'])
            ->count();

        return [
            'total' => $total,
            'pending' => $total - $done,
            'done' => $done
        ];
    }

    public function nearestDeadline(int $dosenId): ?array
    {
        $periode = DB::table('periode')
            ->where('status', 'aktif')
            ->where('tanggal_deadline', '>=', now()->toDateString())
            ->orderBy('tanggal_deadline', 'asc')
            ->first();

        if (!$periode) {
            return null;
        }

        return (array) $periode;
    }
}
