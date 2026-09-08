<?php declare(strict_types=1);

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * @method static static ADMINISTRATOR()
 * @method static static INVESTIGATOR()
 * @method static static EVIDENCE_CUSTODIAN()
 * @method static static FORENSIC_EXAMINER()
 * @method static static ANALYST()
 * @method static static CASE_MANAGER()
 * @method static static AUDITOR()
 */
final class UserRole extends Enum
{
    const ADMINISTRATOR = 'ADMINISTRATOR';
    const INVESTIGATOR = 'INVESTIGATOR';
    const EVIDENCE_CUSTODIAN = 'EVIDENCE_CUSTODIAN';
    const FORENSIC_EXAMINER = 'FORENSIC_EXAMINER';
    const ANALYST = 'ANALYST';
    const CASE_MANAGER = 'CASE_MANAGER';
    const AUDITOR = 'AUDITOR';
}
