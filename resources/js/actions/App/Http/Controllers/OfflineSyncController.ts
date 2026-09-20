import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\OfflineSyncController::session
* @see app/Http/Controllers/OfflineSyncController.php:34
* @route '/offline-sync/session'
*/
export const session = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: session.url(options),
    method: 'get',
})

session.definition = {
    methods: ["get","head"],
    url: '/offline-sync/session',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OfflineSyncController::session
* @see app/Http/Controllers/OfflineSyncController.php:34
* @route '/offline-sync/session'
*/
session.url = (options?: RouteQueryOptions) => {
    return session.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfflineSyncController::session
* @see app/Http/Controllers/OfflineSyncController.php:34
* @route '/offline-sync/session'
*/
session.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: session.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OfflineSyncController::session
* @see app/Http/Controllers/OfflineSyncController.php:34
* @route '/offline-sync/session'
*/
session.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: session.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\OfflineSyncController::bootstrap
* @see app/Http/Controllers/OfflineSyncController.php:53
* @route '/offline-sync/bootstrap'
*/
export const bootstrap = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: bootstrap.url(options),
    method: 'get',
})

bootstrap.definition = {
    methods: ["get","head"],
    url: '/offline-sync/bootstrap',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OfflineSyncController::bootstrap
* @see app/Http/Controllers/OfflineSyncController.php:53
* @route '/offline-sync/bootstrap'
*/
bootstrap.url = (options?: RouteQueryOptions) => {
    return bootstrap.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfflineSyncController::bootstrap
* @see app/Http/Controllers/OfflineSyncController.php:53
* @route '/offline-sync/bootstrap'
*/
bootstrap.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: bootstrap.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OfflineSyncController::bootstrap
* @see app/Http/Controllers/OfflineSyncController.php:53
* @route '/offline-sync/bootstrap'
*/
bootstrap.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: bootstrap.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\OfflineSyncController::syncEvidence
* @see app/Http/Controllers/OfflineSyncController.php:86
* @route '/offline-sync/evidence'
*/
export const syncEvidence = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: syncEvidence.url(options),
    method: 'post',
})

syncEvidence.definition = {
    methods: ["post"],
    url: '/offline-sync/evidence',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OfflineSyncController::syncEvidence
* @see app/Http/Controllers/OfflineSyncController.php:86
* @route '/offline-sync/evidence'
*/
syncEvidence.url = (options?: RouteQueryOptions) => {
    return syncEvidence.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfflineSyncController::syncEvidence
* @see app/Http/Controllers/OfflineSyncController.php:86
* @route '/offline-sync/evidence'
*/
syncEvidence.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: syncEvidence.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfflineSyncController::evidenceStatus
* @see app/Http/Controllers/OfflineSyncController.php:121
* @route '/offline-sync/evidence-status'
*/
export const evidenceStatus = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: evidenceStatus.url(options),
    method: 'get',
})

evidenceStatus.definition = {
    methods: ["get","head"],
    url: '/offline-sync/evidence-status',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OfflineSyncController::evidenceStatus
* @see app/Http/Controllers/OfflineSyncController.php:121
* @route '/offline-sync/evidence-status'
*/
evidenceStatus.url = (options?: RouteQueryOptions) => {
    return evidenceStatus.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfflineSyncController::evidenceStatus
* @see app/Http/Controllers/OfflineSyncController.php:121
* @route '/offline-sync/evidence-status'
*/
evidenceStatus.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: evidenceStatus.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OfflineSyncController::evidenceStatus
* @see app/Http/Controllers/OfflineSyncController.php:121
* @route '/offline-sync/evidence-status'
*/
evidenceStatus.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: evidenceStatus.url(options),
    method: 'head',
})

const OfflineSyncController = { session, bootstrap, syncEvidence, evidenceStatus }

export default OfflineSyncController