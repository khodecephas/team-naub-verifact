<?php

declare(strict_types=1);

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * @method static static REQUEST_APPROVED()
 * @method static static DIRECT_ADMINISTRATIVE()
 * @method static static REGISTRATION()
 */
final class CustodyTransferMethod extends Enum
{
    public const REQUEST_APPROVED = 'REQUEST_APPROVED';

    public const DIRECT_ADMINISTRATIVE = 'DIRECT_ADMINISTRATIVE';

    public const REGISTRATION = 'REGISTRATION';
}
