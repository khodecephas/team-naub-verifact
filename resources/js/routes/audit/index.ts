import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\AuditController::index
* @see app/Http/Controllers/AuditController.php:28
* @route '/audit'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/audit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AuditController::index
* @see app/Http/Controllers/AuditController.php:28
* @route '/audit'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AuditController::index
* @see app/Http/Controllers/AuditController.php:28
* @route '/audit'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AuditController::index
* @see app/Http/Controllers/AuditController.php:28
* @route '/audit'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

const audit = {
    index: Object.assign(index, index),
}

export default audit