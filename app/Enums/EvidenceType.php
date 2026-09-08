<?php declare(strict_types=1);

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * @method static static DOCUMENT()
 * @method static static IMAGE()
 * @method static static VIDEO()
 * @method static static AUDIO()
 * @method static static ARCHIVE()
 * @method static static LOG()
 * @method static static EMAIL_EXPORT()
 * @method static static CCTV_EXPORT()
 * @method static static DISK_IMAGE()
 * @method static static DATABASE_EXPORT()
 * @method static static OTHER()
 */
final class EvidenceType extends Enum
{
    const DOCUMENT = 'DOCUMENT';
    const IMAGE = 'IMAGE';
    const VIDEO = 'VIDEO';
    const AUDIO = 'AUDIO';
    const ARCHIVE = 'ARCHIVE';
    const LOG = 'LOG';
    const EMAIL_EXPORT = 'EMAIL_EXPORT';
    const CCTV_EXPORT = 'CCTV_EXPORT';
    const DISK_IMAGE = 'DISK_IMAGE';
    const DATABASE_EXPORT = 'DATABASE_EXPORT';
    const OTHER = 'OTHER';
}
