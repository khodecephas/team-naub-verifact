import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\CustodyController::index
* @see app/Http/Controllers/CustodyController.php:19
* @route '/custody'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/custody',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CustodyController::index
* @see app/Http/Controllers/CustodyController.php:19
* @route '/custody'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CustodyController::index
* @see app/Http/Controllers/CustodyController.php:19
* @route '/custody'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CustodyController::index
* @see app/Http/Controllers/CustodyController.php:19
* @route '/custody'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

const CustodyController = { index }

export default CustodyController