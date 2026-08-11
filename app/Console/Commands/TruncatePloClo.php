<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class TruncatePloClo extends Command
{
    protected $signature = 'plo:truncate-all {--force : Skip confirmation}';
    protected $description = 'Delete all PLO, CLO and related pivot data (course_clo).';

    public function handle(): int
    {
        if (!$this->option('force')) {
            if (!$this->confirm('This will permanently delete ALL PLO and CLO data. Continue?')) {
                $this->info('Aborted.');
                return 1;
            }
        }

        DB::beginTransaction();
        try {
            $driver = DB::getDriverName();
            $tables = [];
            if (DB::getSchemaBuilder()->hasTable('course_clo')) $tables[] = 'course_clo';
            if (DB::getSchemaBuilder()->hasTable('clo')) $tables[] = 'clo';
            if (DB::getSchemaBuilder()->hasTable('plo')) $tables[] = 'plo';

            if ($driver === 'mysql') {
                DB::statement('SET FOREIGN_KEY_CHECKS=0');
                foreach ($tables as $t) {
                    DB::table($t)->truncate();
                }
                DB::statement('SET FOREIGN_KEY_CHECKS=1');
            } elseif ($driver === 'pgsql') {
                if (!empty($tables)) {
                    $list = implode(', ', array_map(function ($t) { return '"' . $t . '"'; }, $tables));
                    DB::statement("TRUNCATE TABLE {$list} RESTART IDENTITY CASCADE");
                }
            } else {
                // Fallback: delete rows
                foreach ($tables as $t) {
                    DB::table($t)->delete();
                }
            }

            DB::commit();
            $this->info('All PLO, CLO and course_clo data have been deleted.');
            return 0;
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error('Error: ' . $e->getMessage());
            return 1;
        }
    }
}
