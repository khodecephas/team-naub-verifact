<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Foundation\Console\ServeCommand as BaseServeCommand;

use function Illuminate\Support\php_binary;

final class ServeCommand extends BaseServeCommand
{
    /** @var string */
    protected $description = 'Serve H1 with evidence upload limits enabled';

    /** Build the PHP development-server command with H1's evidence upload limits. */
    protected function serverCommand(): array
    {
        $server = file_exists(base_path('server.php'))
            ? base_path('server.php')
            : dirname(__DIR__, 3).'/vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php';
        $uploadLimit = max(1, (int) config('evidence.max_upload_size_kb'));

        return [
            php_binary(),
            '-d',
            "upload_max_filesize={$uploadLimit}K",
            '-d',
            'post_max_size='.($uploadLimit + 1024).'K',
            '-S',
            $this->host().':'.$this->port(),
            $server,
        ];
    }
}
