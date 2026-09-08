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

];
