<?php

namespace App\Console\Commands;

use App\Models\Plo;
use App\Models\Clo;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanupPloCloDuplicates extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'plo:cleanup-duplicates {--dry-run : Do not modify database, only show actions}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Merge and remove duplicate PLO and CLO records (keep earliest), reassign relations.';

    public function handle(): int
    {
        $dry = $this->option('dry-run');

        $this->info('Starting PLO duplicate cleanup' . ($dry ? ' (dry-run)' : ''));

        // Cleanup PLO duplicates grouped by code + prodi_id + periode_id
        $plos = Plo::orderBy('kode')->orderBy('created_at')->get();
        $groups = $plos->groupBy(function ($p) {
            return strtolower($p->kode) . '|' . ($p->prodi_id ?? '0') . '|' . ($p->periode_id ?? '0');
        });

        foreach ($groups as $key => $group) {
            if ($group->count() <= 1) continue;

            $keep = $group->first();
            $dups = $group->slice(1);

            $this->line("PLO group: {$key} -> keeping ID {$keep->id}, duplicates: " . $dups->pluck('id')->join(', '));

            if ($dry) continue;

            foreach ($dups as $dup) {
                // Move CLOs belonging to dup PLO to keep PLO
                Clo::where('plo_id', $dup->id)->update(['plo_id' => $keep->id]);

                // Delete duplicate PLO
                Plo::where('id', $dup->id)->delete();
                $this->line("Deleted duplicate PLO id={$dup->id}");
            }
        }

        // Cleanup CLO duplicates grouped by kode + plo_id + periode_id
        $clos = Clo::orderBy('kode')->orderBy('created_at')->get();
        $cgroups = $clos->groupBy(function ($c) {
            return strtolower($c->kode) . '|' . ($c->plo_id ?? '0') . '|' . ($c->periode_id ?? '0');
        });

        foreach ($cgroups as $key => $group) {
            if ($group->count() <= 1) continue;

            $keep = $group->first();
            $dups = $group->slice(1);
            $this->line("CLO group: {$key} -> keeping ID {$keep->id}, duplicates: " . $dups->pluck('id')->join(', '));

            if ($dry) continue;

            foreach ($dups as $dup) {
                // Move pivot course_clo entries: insert ignore into keep, then delete dup entries
                $rows = DB::table('course_clo')->where('clo_id', $dup->id)->get();
                foreach ($rows as $row) {
                    DB::table('course_clo')->updateOrInsert(
                        ['course_id' => $row->course_id, 'clo_id' => $keep->id],
                        ['created_at' => $row->created_at ?? now(), 'updated_at' => $row->updated_at ?? now()]
                    );
                }
                DB::table('course_clo')->where('clo_id', $dup->id)->delete();

                // Move soal references
                DB::table('soal')->where('clo_id', $dup->id)->update(['clo_id' => $keep->id]);

                // Delete duplicate CLO
                Clo::where('id', $dup->id)->delete();
                $this->line("Deleted duplicate CLO id={$dup->id}");
            }
        }

        $this->info('Cleanup completed.');
        return 0;
    }
}
