<?php declare(strict_types=1);

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * Recorded result of one offline-sync attempt, kept for audit even when
 * the attempt did not produce authoritative evidence.
 *
 * @method static static SUCCESS()
 * @method static static HASH_MISMATCH()
 * @method static static UNAUTHORIZED()
 * @method static static ERROR()
 */
final class OfflineSyncOutcome extends Enum
{
    const SUCCESS = 'SUCCESS';
    const HASH_MISMATCH = 'HASH_MISMATCH';
    const UNAUTHORIZED = 'UNAUTHORIZED';
    const ERROR = 'ERROR';
}
