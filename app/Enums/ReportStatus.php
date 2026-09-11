<?php

declare(strict_types=1);

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * @method static static DRAFT()
 * @method static static FINAL()
 * @method static static SUPERSEDED()
 */
final class ReportStatus extends Enum
{
    public const DRAFT = 'DRAFT';

    public const FINAL = 'FINAL';

    public const SUPERSEDED = 'SUPERSEDED';
}
