<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['name', 'email', 'password', 'role'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    protected $guard_name = 'web';

    /**
     * Keeps this user's Spatie role assignment in step with the `role`
     * column — the column stays the single place application code reads
     * "what is this user's role" (display, factories, existing queries),
     * while the actual role → permission mapping now lives in Spatie's
     * tables and is what every policy check below reads. Skips the sync
     * (and its query) when the role hasn't actually changed.
     */
    protected static function booted(): void
    {
        static::saved(function (User $user) {
            if ($user->role && $user->getRoleNames()->first() !== $user->role) {
                $user->syncRoles([$user->role]);
            }
        });
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Cases this user opened.
     */
    public function createdCases(): HasMany
    {
        return $this->hasMany(CaseFile::class, 'created_by');
    }

    /**
     * Cases this user manages.
     */
    public function managedCases(): HasMany
    {
        return $this->hasMany(CaseFile::class, 'case_manager_id');
    }

    /**
     * Cases this user closed.
     */
    public function closedCases(): HasMany
    {
        return $this->hasMany(CaseFile::class, 'closed_by');
    }

    /**
     * This user's team-membership records across all cases.
     */
    public function caseAssignments(): HasMany
    {
        return $this->hasMany(CaseAssignment::class, 'user_id');
    }

    /**
     * Cases this user is assigned to, with their per-case role available via pivot.
     */
    public function assignedCases(): BelongsToMany
    {
        return $this->belongsToMany(CaseFile::class, 'case_assignments', 'user_id', 'case_id')
            ->withPivot(['role_on_case', 'assigned_by', 'assigned_at'])
            ->withTimestamps();
    }

    /**
     * Digital evidence this user registered into the system.
     */
    public function registeredEvidence(): HasMany
    {
        return $this->hasMany(Evidence::class, 'registered_by');
    }

    public function createdEvidenceDerivatives(): HasMany
    {
        return $this->hasMany(EvidenceDerivative::class, 'created_by');
    }

    public function issuedEvidenceDerivatives(): HasMany
    {
        return $this->hasMany(EvidenceDerivative::class, 'issued_to');
    }
}
