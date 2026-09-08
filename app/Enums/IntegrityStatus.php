<?php declare(strict_types=1);

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * @method static static BASELINE_ESTABLISHED()
 * @method static static VERIFIED()
 * @method static static VERIFICATION_REQUIRED()
 * @method static static INTEGRITY_FAILURE()
 */
final class IntegrityStatus extends Enum
{
    /**
     * Set on registration. Means only: this hash is what the evidence looked
     * like when it entered the controlled system — not that it was authentic
     * before that point. See Evidence/Show.tsx for the reader-facing wording.
     */
    const BASELINE_ESTABLISHED = 'BASELINE_ESTABLISHED';
    const VERIFIED = 'VERIFIED';
    const VERIFICATION_REQUIRED = 'VERIFICATION_REQUIRED';
    const INTEGRITY_FAILURE = 'INTEGRITY_FAILURE';
}
