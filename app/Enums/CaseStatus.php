<?php declare(strict_types=1);

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * @method static static OPEN()
 * @method static static IN_PROGRESS()
 * @method static static CLOSED()
 * @method static static ARCHIVED()
 */
final class CaseStatus extends Enum
{
    const OPEN = 'OPEN';
    const IN_PROGRESS = 'IN_PROGRESS';
    const CLOSED = 'CLOSED';
    const ARCHIVED = 'ARCHIVED';
}
