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
            'password'       => 'hashed',
            'is_super_admin' => 'boolean',
            'is_coordinator' => 'boolean',
            'status_aktif'   => 'boolean',
            'last_login_at'  => 'datetime',
        ];
    }

    /* ── Relations ──────────────────────────────────────────── */

    public function programStudi(): BelongsTo
    {
        return $this->belongsTo(ProgramStudi::class, 'prodi_id');
    }

    /** Soal yang diupload oleh dosen ini */
    public function soal(): HasMany
    {
        return $this->hasMany(Soal::class, 'dosen_id');
    }

    /**
     * Role dinamis (PIC, dsb.) per periode.
     * Gunakan ini untuk cek apakah user adalah PIC.
     */
    public function userRoles(): HasMany
    {
        return $this->hasMany(UserRole::class, 'user_id');
    }

    /** Pemetaan mata kuliah yang diampu oleh dosen ini per periode */
    public function dosenMataKuliah(): HasMany
    {
        return $this->hasMany(DosenMataKuliah::class, 'dosen_id');
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

    public function isSuperAdmin(): bool
    {
        return (bool) $this->is_super_admin;
    }

    public function isCoordinator(): bool
    {
        return (bool) $this->is_coordinator;
    }

    public function isLbDosen(): bool
    {
        return $this->tipe_dosen === 'lb';
    }

    /**
     * Cek apakah user adalah PIC aktif di suatu periode.
     * Query ke tabel user_roles (bukan penugasan lama).
     */
    public function isPicOnPeriode(int $periodeId): bool
    {
        return $this->userRoles()
            ->whereHas('role', fn ($q) => $q->where('nama_role', 'pic'))
            ->where('periode_id', $periodeId)
            ->exists();
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
