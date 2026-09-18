import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\EvidenceController::create
* @see app/Http/Controllers/EvidenceController.php:161
* @route '/evidence/quick-ingest'
*/
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/evidence/quick-ingest',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EvidenceController::create
* @see app/Http/Controllers/EvidenceController.php:161
* @route '/evidence/quick-ingest'
*/
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EvidenceController::create
* @see app/Http/Controllers/EvidenceController.php:161
* @route '/evidence/quick-ingest'
*/
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EvidenceController::create
* @see app/Http/Controllers/EvidenceController.php:161
* @route '/evidence/quick-ingest'
*/
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EvidenceController::store
* @see app/Http/Controllers/EvidenceController.php:170
* @route '/evidence/quick-ingest'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/evidence/quick-ingest',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EvidenceController::store
* @see app/Http/Controllers/EvidenceController.php:170
* @route '/evidence/quick-ingest'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EvidenceController::store
* @see app/Http/Controllers/EvidenceController.php:170
* @route '/evidence/quick-ingest'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

const quickIngest = {
    create: Object.assign(create, create),
    store: Object.assign(store, store),
}

export default quickIngest