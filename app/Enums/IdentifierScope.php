<?php declare(strict_types=1);

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * Every human-readable identifier series the system issues (CASE-2026-000001,
 * EV-2026-000001, ...), each backed by its own row in `id_sequences` per year.
 * Cased as CASE_FILE rather than CASE — `case` is a reserved word in PHP.
 *
 * @method static static CASE_FILE()
 * @method static static EVIDENCE()
 * @method static static EVIDENCE_DERIVATIVE()
 * @method static static FINDING()
 * @method static static REPORT()
 */
final class IdentifierScope extends Enum
{
    const CASE_FILE = 'case';
    const EVIDENCE = 'evidence';
    const EVIDENCE_DERIVATIVE = 'evidence_derivative';
    const FINDING = 'finding';
    const REPORT = 'report';

    public function prefix(): string
    {
        return match ($this->value) {
            self::CASE_FILE => 'CASE',
            self::EVIDENCE => 'EV',
            self::EVIDENCE_DERIVATIVE => 'DER',
            self::FINDING => 'FINDING',
            self::REPORT => 'RPT',
        };
    }
}
