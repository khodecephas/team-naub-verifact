<?php

namespace Tests\Feature;

use App\Services\EvidenceHashService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Tests\TestCase;

class EvidenceHashServiceTest extends TestCase
{
    public function test_it_computes_the_correct_sha256_for_known_content(): void
    {
        Storage::fake('local');

        $content = 'H1 digital evidence integrity test content.';
        Storage::disk('local')->put('hash-test/known.txt', $content);

        $hash = EvidenceHashService::sha256('local', 'hash-test/known.txt');

        $this->assertSame(hash('sha256', $content), $hash);
        $this->assertMatchesRegularExpression('/^[a-f0-9]{64}$/', $hash);
    }

    public function test_it_throws_when_the_file_does_not_exist(): void
    {
        Storage::fake('local');

        $this->expectException(RuntimeException::class);

        EvidenceHashService::sha256('local', 'hash-test/missing.bin');
    }

    public function test_hashing_a_large_file_does_not_load_it_fully_into_memory(): void
    {
        Storage::fake('local');

        // ftruncate-created, so generating this is fast and doesn't itself
        // hold 50MB in memory — see Illuminate\Http\Testing\FileFactory.
        $file = UploadedFile::fake()->create('large.bin', 50 * 1024); // 50 MB
        $storedPath = Storage::disk('local')->putFileAs('hash-test', $file, 'large.bin');

        $memoryBefore = memory_get_usage(true);

        $hash = EvidenceHashService::sha256('local', $storedPath);

        $memoryDelta = memory_get_usage(true) - $memoryBefore;

        $this->assertMatchesRegularExpression('/^[a-f0-9]{64}$/', $hash);
        $this->assertLessThan(
            5 * 1024 * 1024,
            $memoryDelta,
            'Hashing a 50MB file increased memory usage by more than 5MB — it may be loading the file fully into memory instead of streaming it.',
        );
    }
}
