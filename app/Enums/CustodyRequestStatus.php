<?php

declare(strict_types=1);

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * @method static static PENDING()
 * @method static static APPROVED()
 * @method static static REJECTED()
 * @method static static CANCELLED()
 */
final class CustodyRequestStatus extends Enum
{
    public const PENDING = 'PENDING';

    public const APPROVED = 'APPROVED';

    public const REJECTED = 'REJECTED';

    public const CANCELLED = 'CANCELLED';
}
