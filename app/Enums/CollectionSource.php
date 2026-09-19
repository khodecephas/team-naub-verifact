<?php declare(strict_types=1);

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * Whether a master evidence record was registered through the normal online
 * upload path or synchronized from a device's offline collection queue.
 *
 * @method static static ONLINE()
 * @method static static OFFLINE()
 */
final class CollectionSource extends Enum
{
    const ONLINE = 'ONLINE';
    const OFFLINE = 'OFFLINE';
}
