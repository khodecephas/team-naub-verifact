<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

/**
 * Renders the two offline-mode screens. Both are effectively client-side
 * shells: the pending-sync queue and the offline capture form read and
 * write IndexedDB directly and call OfflineSyncController's JSON endpoints
 * when online, so no server-side props are required to render them.
 */
class OfflineController extends Controller
{
    /** The pending-sync queue for this device's offline collection records. */
    public function index(): Response
    {
        return Inertia::render('Offline/PendingSync');
    }

    /** The offline evidence capture form. */
    public function collect(): Response
    {
        return Inertia::render('Offline/Collect');
    }
}
