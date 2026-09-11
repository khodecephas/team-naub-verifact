<?php

namespace App\Enums;

enum EvidenceDerivativeStatus: string
{
    case AVAILABLE = 'AVAILABLE';
    case DOWNLOADED = 'DOWNLOADED';
    case EXPIRED = 'EXPIRED';
    case REVOKED = 'REVOKED';
}
