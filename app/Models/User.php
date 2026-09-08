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

#[Fillable(['name', 'email', 'password', 'role'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

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
}
