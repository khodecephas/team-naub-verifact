import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../wayfinder'
import physicalSources from './physical-sources'
import evidence from './evidence'
/**
* @see \App\Http\Controllers\OfflineSyncController::session
* @see app/Http/Controllers/OfflineSyncController.php:35
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
* @see app/Http/Controllers/OfflineSyncController.php:35
* @route '/offline-sync/session'
*/
session.url = (options?: RouteQueryOptions) => {
    return session.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfflineSyncController::session
* @see app/Http/Controllers/OfflineSyncController.php:35
* @route '/offline-sync/session'
*/
session.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: session.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OfflineSyncController::session
* @see app/Http/Controllers/OfflineSyncController.php:35
* @route '/offline-sync/session'
*/
session.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: session.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\OfflineSyncController::bootstrap
* @see app/Http/Controllers/OfflineSyncController.php:51
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
* @see app/Http/Controllers/OfflineSyncController.php:51
* @route '/offline-sync/bootstrap'
*/
bootstrap.url = (options?: RouteQueryOptions) => {
    return bootstrap.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfflineSyncController::bootstrap
* @see app/Http/Controllers/OfflineSyncController.php:51
* @route '/offline-sync/bootstrap'
*/
bootstrap.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: bootstrap.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OfflineSyncController::bootstrap
* @see app/Http/Controllers/OfflineSyncController.php:51
* @route '/offline-sync/bootstrap'
*/
bootstrap.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: bootstrap.url(options),
    method: 'head',
})

const offlineSync = {
    session: Object.assign(session, session),
    bootstrap: Object.assign(bootstrap, bootstrap),
    physicalSources: Object.assign(physicalSources, physicalSources),
    evidence: Object.assign(evidence, evidence),
}

export default offlineSync