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
    | Comparison Upload Transport
    |--------------------------------------------------------------------------
    |
    | Comparison files are sent in small ordered parts. This lets the verifier
    | accept the configured evidence limit even when PHP limits each request.
    | Temporary parts are private and are deleted as soon as hashing finishes.
    |
    */

    'comparison_disk' => env('EVIDENCE_COMPARISON_DISK', 'local'),

    'comparison_chunk_size_kb' => 1024,

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

    /*
    |--------------------------------------------------------------------------
    | Finding Attachment Upload Size
    |--------------------------------------------------------------------------
    |
    | Kilobytes. Finding attachments are supporting documents (reports,
    | screenshots, exports), not raw forensic images, so this is deliberately
    | far smaller than the evidence upload limit above.
    |
    */

    'finding_attachment_max_upload_size_kb' => (int) env('FINDING_ATTACHMENT_MAX_UPLOAD_KB', 51200),

];
