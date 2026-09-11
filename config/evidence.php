<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Evidence Storage Disk
    |--------------------------------------------------------------------------
    |
    | The filesystem disk evidence master files are written to. Must never be
    | "public" — evidence is never served through a direct, unauthenticated URL.
    |
    */

    'disk' => env('EVIDENCE_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Maximum Upload Size
    |--------------------------------------------------------------------------
    |
    | Kilobytes, matching Laravel's "max" validation rule for files. Forensic
    | evidence can legitimately be large, so this is generous by default —
    | actual uploads are still bounded by php.ini's upload_max_filesize and
    | post_max_size, which this value does not change.
    |
    */

    'max_upload_size_kb' => (int) env('EVIDENCE_MAX_UPLOAD_KB', 512000),

    /*
    |--------------------------------------------------------------------------
    | Working-copy availability
    |--------------------------------------------------------------------------
    |
    | Working-copy binaries remain on private storage only while available.
    | They are removed after download, revocation, or expiration. Their database
    | metadata and hash-chained activity history are retained permanently.
    |
    */

    'working_copy_retention_minutes' => (int) env('EVIDENCE_WORKING_COPY_RETENTION_MINUTES', 60),

    'working_copy_retention_options' => [15, 60, 240, 1440],

];
