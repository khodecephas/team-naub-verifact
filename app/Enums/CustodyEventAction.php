<?php

declare(strict_types=1);

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * @method static static INITIAL_CUSTODY()
 * @method static static TRANSFER()
 */
final class CustodyEventAction extends Enum
{
    public const INITIAL_CUSTODY = 'INITIAL_CUSTODY';

    public const TRANSFER = 'TRANSFER';
}
