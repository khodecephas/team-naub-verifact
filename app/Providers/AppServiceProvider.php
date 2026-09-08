<?php

namespace App\Providers;

use App\Models\CaseFile;
use App\Models\Evidence;
use App\Policies\CaseFilePolicy;
use App\Policies\EvidencePolicy;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Inertia treats a JsonResource passed as a page prop as a Responsable
        // and renders it via toResponse(), which applies Laravel's automatic
        // "data" wrapper. Pages here read resource props unwrapped (e.g.
        // `evidence.title`, not `evidence.data.title`), so that wrapper would
        // silently break them. Paginated collections are unaffected — they
        // keep their own data/links/meta shape regardless of this setting.
        JsonResource::withoutWrapping();

        Gate::policy(CaseFile::class, CaseFilePolicy::class);
        Gate::policy(Evidence::class, EvidencePolicy::class);

        // Enforced from the start so every future polymorphic relation (evidence
        // integrity checks, custody events, findings, report items) is forced to
        // use a stable map key instead of a raw model class string — renaming a
        // model later then can't silently orphan historical rows. Entries are
        // added here as each model is introduced in later phases.
        Relation::enforceMorphMap([
            //
        ]);
    }
}
