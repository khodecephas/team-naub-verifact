<?php declare(strict_types=1);

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * @method static static HARD_DRIVE()
 * @method static static USB_DRIVE()
 * @method static static MOBILE_PHONE()
 * @method static static LAPTOP()
 * @method static static DOCUMENT()
 * @method static static OTHER()
 */
final class PhysicalSourceType extends Enum
{
    const HARD_DRIVE = 'HARD_DRIVE';
    const USB_DRIVE = 'USB_DRIVE';
    const MOBILE_PHONE = 'MOBILE_PHONE';
    const LAPTOP = 'LAPTOP';
    const DOCUMENT = 'DOCUMENT';
    const OTHER = 'OTHER';
}
