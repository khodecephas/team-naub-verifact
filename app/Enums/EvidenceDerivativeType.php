<?php

namespace App\Enums;

enum EvidenceDerivativeType: string
{
    case WORKING_COPY = 'WORKING_COPY';
    case EXTRACTED_FILE = 'EXTRACTED_FILE';
    case FORENSIC_EXPORT = 'FORENSIC_EXPORT';
    case SCREENSHOT = 'SCREENSHOT';
    case OTHER = 'OTHER';
}
