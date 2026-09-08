<?php declare(strict_types=1);

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * @method static static LEAD_INVESTIGATOR()
 * @method static static CUSTODIAN()
 * @method static static EXAMINER()
 * @method static static ANALYST()
 * @method static static VIEWER()
 */
final class CaseAssignmentRole extends Enum
{
    const LEAD_INVESTIGATOR = 'LEAD_INVESTIGATOR';
    const CUSTODIAN = 'CUSTODIAN';
    const EXAMINER = 'EXAMINER';
    const ANALYST = 'ANALYST';
    const VIEWER = 'VIEWER';
}
