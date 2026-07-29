<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->bind(
            \App\Repositories\Contracts\UserRepositoryContract::class,
            \App\Repositories\Eloquent\EloquentUserRepository::class
        );

        $this->app->bind(
            \App\Repositories\Contracts\PloRepositoryContract::class,
            \App\Repositories\Eloquent\EloquentPloRepository::class
        );

        $this->app->bind(
            \App\Repositories\Contracts\CloRepositoryContract::class,
            \App\Repositories\Eloquent\EloquentCloRepository::class
        );

        $this->app->bind(
            \App\Repositories\Contracts\PeriodeRepositoryContract::class,
            \App\Repositories\Eloquent\EloquentPeriodeRepository::class
        );

        $this->app->bind(
            \App\Repositories\Contracts\CategoryRepositoryContract::class,
            \App\Repositories\Eloquent\EloquentCategoryRepository::class
        );

        $this->app->bind(
            \App\Repositories\Contracts\TemplateRepositoryContract::class,
            \App\Repositories\Eloquent\EloquentTemplateRepository::class
        );

        $this->app->bind(
            \App\Repositories\Contracts\SoalRepositoryContract::class,
            \App\Repositories\Eloquent\EloquentSoalRepository::class
        );

        $this->app->bind(
            \App\Repositories\Contracts\PenugasanRepositoryContract::class,
            \App\Repositories\Eloquent\EloquentPenugasanRepository::class
        );

        $this->app->bind(
            \App\Repositories\Contracts\UserRoleRepositoryContract::class,
            \App\Repositories\Eloquent\EloquentUserRoleRepository::class
        );

        $this->app->bind(
            \App\Repositories\Contracts\DosenMataKuliahRepositoryContract::class,
            \App\Repositories\Eloquent\EloquentDosenMataKuliahRepository::class
        );

        $this->app->bind(
            \App\Repositories\Contracts\VerificationRepositoryContract::class,
            \App\Repositories\Eloquent\EloquentVerificationRepository::class
        );

        $this->app->bind(
            \App\Repositories\Contracts\BeritaAcaraRepositoryContract::class,
            \App\Repositories\Eloquent\EloquentBeritaAcaraRepository::class
        );

        $this->app->bind(
            \App\Repositories\Contracts\BroadcastRepositoryContract::class,
            \App\Repositories\Eloquent\EloquentBroadcastRepository::class
        );

        $this->app->bind(
            \App\Repositories\Contracts\NotifikasiRepositoryContract::class,
            \App\Repositories\Eloquent\EloquentNotifikasiRepository::class
        );

        $this->app->bind(
            \App\Repositories\Contracts\ActivityLogRepositoryContract::class,
            \App\Repositories\Eloquent\EloquentActivityLogRepository::class
        );

        $this->app->bind(
            \App\Repositories\Contracts\DashboardRepositoryContract::class,
            \App\Repositories\Eloquent\EloquentDashboardRepository::class
        );

        $this->app->bind(
            \App\Repositories\Contracts\BeritaAcaraTemplateRepositoryContract::class,
            \App\Repositories\Eloquent\EloquentBeritaAcaraTemplateRepository::class
        );
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
