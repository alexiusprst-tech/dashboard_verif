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

    /** Assignment di mana user ini adalah PIC (verifier) */
    public function penugasanSebagaiPic(): HasMany
    {
        return $this->hasMany(Penugasan::class, 'verifier_id');
    }

    /** Assignment di mana soal user ini diverifikasi */
    public function penugasanSebagaiTarget(): HasMany
    {
        return $this->hasMany(Penugasan::class, 'target_dosen_id');
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

    /**
     * Cek apakah user adalah PIC aktif di suatu periode.
     * Tidak menyimpan state — selalu query ke tabel penugasan.
     */
    public function isPicOnPeriode(int $periodeId): bool
    {
        return $this->penugasanSebagaiPic()
            ->where('periode_id', $periodeId)
            ->exists();
    }

    public function isSuperAdmin(): bool
    {
        return (bool) $this->is_super_admin;
    }

    public function isCoordinator(): bool
    {
        return (bool) $this->is_coordinator;
    }
}
