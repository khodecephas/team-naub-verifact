<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Named CaseFile rather than Case — `case` is a reserved word in PHP and
 * cannot be used as a class name. The table itself is the plain `cases`.
 */
#[Fillable([
    'case_number',
    'title',
    'description',
    'status',
    'case_manager_id',
    'created_by',
    'opened_at',
    'closed_at',
    'closed_by',
    'closure_notes',
])]
class CaseFile extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'cases';

    protected function casts(): array
    {
        return [
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    /**
     * Route model binding resolves on `case_number` (e.g.
     * CASE-2026-000001), not the internal numeric id — keeps that id out of
     * URLs entirely rather than adding a redundant third identifier.
     */
    public function getRouteKeyName(): string
    {
        return 'case_number';
    }

    /**
     * The user who opened this case.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * The user with overall ownership of this case.
     */
    public function caseManager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'case_manager_id');
    }

    /**
     * The user who closed this case, if it has been closed.
     */
    public function closer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    /**
     * Team membership records (who is on this case, and in what capacity).
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(CaseAssignment::class, 'case_id');
    }

    /**
     * Users assigned to this case, with their per-case role available via pivot.
     */
    public function assignedUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'case_assignments', 'case_id', 'user_id')
            ->withPivot(['role_on_case', 'assigned_by', 'assigned_at'])
            ->withTimestamps();
    }

    /**
     * Physical exhibits (hard drives, phones, documents, ...) logged against this case.
     */
    public function physicalSources(): HasMany
    {
        return $this->hasMany(PhysicalSource::class, 'case_id');
    }

    /**
     * Digital evidence registered under this case.
     */
    public function evidence(): HasMany
    {
        return $this->hasMany(Evidence::class, 'case_id');
    }

    /** Reports generated for this case. */
    public function reports(): HasMany
    {
        return $this->hasMany(Report::class, 'case_id');
    }

    /**
     * Whether the given user has a team-membership record on this case.
     * Used by policies alongside the creator/case-manager checks — being the
     * creator or manager grants access without needing a case_assignments row.
     */
    public function isAssignedTo(User $user): bool
    {
        return $this->assignments()->where('user_id', $user->id)->exists();
    }

    /**
     * Scope a query to cases the given user is allowed to see individually
     * — the same rule CaseFilePolicy::view() applies, kept in one place so
     * list queries (dashboard, cases index) can't drift from it and leak
     * cases a user couldn't open directly. Administrators and auditors are
     * unrestricted.
     */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if (in_array($user->role, [UserRole::ADMINISTRATOR, UserRole::AUDITOR], true)) {
            return $query;
        }

        return $query->where(function (Builder $query) use ($user) {
            $query->where('created_by', $user->id)
                ->orWhere('case_manager_id', $user->id)
                ->orWhereHas('assignments', fn (Builder $q) => $q->where('user_id', $user->id));
        });
    }
}
