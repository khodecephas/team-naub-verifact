import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\OfflineSyncController::store
* @see app/Http/Controllers/OfflineSyncController.php:86
* @route '/offline-sync/evidence'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/offline-sync/evidence',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OfflineSyncController::store
* @see app/Http/Controllers/OfflineSyncController.php:86
* @route '/offline-sync/evidence'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfflineSyncController::store
* @see app/Http/Controllers/OfflineSyncController.php:86
* @route '/offline-sync/evidence'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfflineSyncController::status
* @see app/Http/Controllers/OfflineSyncController.php:121
* @route '/offline-sync/evidence-status'
*/
export const status = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status.url(options),
    method: 'get',
})

status.definition = {
    methods: ["get","head"],
    url: '/offline-sync/evidence-status',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OfflineSyncController::status
* @see app/Http/Controllers/OfflineSyncController.php:121
* @route '/offline-sync/evidence-status'
*/
status.url = (options?: RouteQueryOptions) => {
    return status.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfflineSyncController::status
* @see app/Http/Controllers/OfflineSyncController.php:121
* @route '/offline-sync/evidence-status'
*/
status.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OfflineSyncController::status
* @see app/Http/Controllers/OfflineSyncController.php:121
* @route '/offline-sync/evidence-status'
*/
status.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: status.url(options),
    method: 'head',
})

const evidence = {
    store: Object.assign(store, store),
    status: Object.assign(status, status),
}

export default evidence