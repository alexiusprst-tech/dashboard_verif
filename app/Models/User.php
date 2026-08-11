<?php

namespace App\Models;

use App\Enums\NotificationType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, SoftDeletes;

    protected $table = 'users';

    protected $fillable = [
        'uuid',
        'kode_dosen',
        'nama_lengkap',
        'email',
        'password',
        'prodi_id',
        'is_super_admin',
        'is_coordinator',
        'is_koordinator_mk',
        'dev_mode_enabled',
        'tipe_dosen',
        'semester_lb',
        'status_aktif',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password'          => 'hashed',
            'is_super_admin'    => 'boolean',
            'is_coordinator'    => 'boolean',
            'is_koordinator_mk' => 'boolean',
            'dev_mode_enabled'  => 'boolean',
            'status_aktif'      => 'boolean',
            'last_login_at'     => 'datetime',
        ];
    }

    /* ── Relations ──────────────────────────────────────────── */

    public function programStudi(): BelongsTo
    {
        return $this->belongsTo(ProgramStudi::class, 'prodi_id');
    }

    public function prodi(): BelongsTo
    {
        return $this->belongsTo(ProgramStudi::class, 'prodi_id');
    }

    /** Soal yang diupload oleh dosen ini */
    public function soal(): HasMany
    {
        return $this->hasMany(Soal::class, 'dosen_id');
    }

    /** Pemetaan mata kuliah yang diampu oleh dosen ini per periode */
    public function DosenMk(): HasMany
    {
        return $this->hasMany(DosenMk::class, 'dosen_id');
    }

    /** Penugasan sebagai verifikator (per mata kuliah per periode) */
    public function penugasanVerifikator(): HasMany
    {
        return $this->hasMany(PenugasanVerifikator::class, 'dosen_id');
    }

    /** Penugasan sebagai Koordinator (per periode) — BR-02, BR-03, BR-04 */
    public function koordinatorAssignments(): HasMany
    {
        return $this->hasMany(KoordinatorAssignment::class, 'user_id');
    }

    /** Verifikasi yang pernah dilakukan oleh user ini */
    public function verifications(): HasMany
    {
        return $this->hasMany(Verification::class, 'verifier_id');
    }

    public function beritaAcara(): HasMany
    {
        return $this->hasMany(BeritaAcara::class, 'verifier_id');
    }

    public function notifikasi(): HasMany
    {
        return $this->hasMany(Notifikasi::class, 'user_id');
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class, 'user_id');
    }

    /* ── Helpers ────────────────────────────────────────────── */

    public function isDevModeActive(): bool
    {
        return (bool) ($this->dev_mode_enabled ?? false);
    }

    public function isSuperAdmin(): bool
    {
        return $this->isDevModeActive() || (bool) $this->is_super_admin;
    }

    public function isCoordinator(): bool
    {
        return $this->isDevModeActive() || (bool) $this->is_coordinator;
    }

    public function isKoordinatorMk(): bool
    {
        if ($this->isDevModeActive()) {
            return true;
        }

        // Cek assignment Koordinator pada periode aktif
        $activePeriode = app(\App\Repositories\Contracts\PeriodeRepositoryContract::class)->findActive();
        if ($activePeriode && $this->isKoordinatorPadaPeriode($activePeriode->id)) {
            return true;
        }

        // Fallback ke boolean flag untuk backward compatibility
        return (bool) ($this->is_koordinator_mk ?? $this->is_coordinator);
    }

    /**
     * Cek apakah user adalah Koordinator pada periode tertentu.
     * Query ke tabel koordinator_assignments.
     */
    public function isKoordinatorPadaPeriode(int $periodeId): bool
    {
        return $this->koordinatorAssignments()
            ->where('periode_id', $periodeId)
            ->exists();
    }

    /**
     * Cek apakah dosen adalah verifikator aktif di suatu periode.
     * Query ke tabel penugasan_verifikator.
     */
    public function isVerifikatorPadaPeriode(int $periodeId): bool
    {
        return $this->penugasanVerifikator()
            ->where('periode_id', $periodeId)
            ->exists();
    }

    /**
     * Cek apakah dosen adalah verifikator untuk mata kuliah tertentu di periode ini.
     */
    public function isVerifikatorPadaCourse(int $courseId, int $periodeId): bool
    {
        return $this->penugasanVerifikator()
            ->where('course_id', $courseId)
            ->where('periode_id', $periodeId)
            ->exists();
    }

    public function isLbDosen(): bool
    {
        return $this->tipe_dosen === 'lb';
    }

    /**
     * Cek apakah dosen LB aktif di periode ini.
     * Dosen biasa selalu aktif.
     * Dosen LB aktif hanya di periode dengan semester yang sesuai semester_lb-nya.
     *
     * @param  Periode  $periode
     */
    public function isAktifDiPeriode(Periode $periode): bool
    {
        if (!$this->isLbDosen()) {
            // Dosen biasa — selalu aktif
            return true;
        }

        // Dosen LB — aktif hanya di periode yang semester-nya cocok
        return $this->semester_lb === $periode->semester;
    }
}
