<?php

declare(strict_types=1);

namespace App\Support;

final class UploadLimit
{
    /** Return the evidence upload limit allowed by both H1 and the active PHP runtime. */
    public static function evidenceKilobytes(): int
    {
        $limits = [max(1, (int) config('evidence.max_upload_size_kb'))];

        foreach (['upload_max_filesize', 'post_max_size'] as $setting) {
            $runtimeLimit = self::iniKilobytes($setting);

            if ($runtimeLimit > 0) {
                $limits[] = $runtimeLimit;
            }
        }

        return min($limits);
    }

    /** Convert a PHP size directive such as 2M or 512000K to kilobytes. */
    private static function iniKilobytes(string $setting): int
    {
        $value = trim((string) ini_get($setting));

        if ($value === '' || $value === '-1') {
            return 0;
        }

        $unit = strtolower(substr($value, -1));
        $amount = (float) $value;

        return match ($unit) {
            'g' => (int) round($amount * 1024 * 1024),
            'm' => (int) round($amount * 1024),
            'k' => (int) round($amount),
            default => (int) round($amount / 1024),
        };
    }
}
