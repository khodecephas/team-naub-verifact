<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use RuntimeException;

/**
 * Computes SHA-256 hashes for files on any Laravel filesystem disk, reading
 * in fixed-size chunks so a multi-gigabyte forensic image never has to be
 * held fully in PHP memory. Reused by registration now, and later by
 * verification and working-copy hashing.
 */
class EvidenceHashService
{
    /**
     * Chunk size used when streaming the file through the hash context.
     */
    private const CHUNK_SIZE = 1024 * 1024; // 1 MB

    /**
     * Calculate the lowercase 64-character SHA-256 digest of a stored file.
     */
    public static function sha256(string $disk, string $path): string
    {
        $stream = Storage::disk($disk)->readStream($path);

        if ($stream === null) {
            throw new RuntimeException("Evidence file not found for hashing: [{$disk}] {$path}");
        }

        $context = hash_init('sha256');

        try {
            while (! feof($stream)) {
                $chunk = fread($stream, self::CHUNK_SIZE);

                if ($chunk === false) {
                    throw new RuntimeException("Failed reading evidence file while hashing: [{$disk}] {$path}");
                }

                hash_update($context, $chunk);
            }
        } finally {
            fclose($stream);
        }

        return hash_final($context);
    }
}
