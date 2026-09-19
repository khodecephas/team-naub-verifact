import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\OfflineController::index
* @see app/Http/Controllers/OfflineController.php:17
* @route '/offline'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/offline',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OfflineController::index
* @see app/Http/Controllers/OfflineController.php:17
* @route '/offline'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfflineController::index
* @see app/Http/Controllers/OfflineController.php:17
* @route '/offline'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OfflineController::index
* @see app/Http/Controllers/OfflineController.php:17
* @route '/offline'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\OfflineController::collect
* @see app/Http/Controllers/OfflineController.php:23
* @route '/offline/collect'
*/
export const collect = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: collect.url(options),
    method: 'get',
})

collect.definition = {
    methods: ["get","head"],
    url: '/offline/collect',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OfflineController::collect
* @see app/Http/Controllers/OfflineController.php:23
* @route '/offline/collect'
*/
collect.url = (options?: RouteQueryOptions) => {
    return collect.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfflineController::collect
* @see app/Http/Controllers/OfflineController.php:23
* @route '/offline/collect'
*/
collect.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: collect.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OfflineController::collect
* @see app/Http/Controllers/OfflineController.php:23
* @route '/offline/collect'
*/
collect.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: collect.url(options),
    method: 'head',
})

const offline = {
    index: Object.assign(index, index),
    collect: Object.assign(collect, collect),
}

export default offline