import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\CaseController::index
* @see app/Http/Controllers/CaseController.php:29
* @route '/cases'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/cases',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CaseController::index
* @see app/Http/Controllers/CaseController.php:29
* @route '/cases'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CaseController::index
* @see app/Http/Controllers/CaseController.php:29
* @route '/cases'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CaseController::index
* @see app/Http/Controllers/CaseController.php:29
* @route '/cases'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CaseController::create
* @see app/Http/Controllers/CaseController.php:82
* @route '/cases/create'
*/
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/cases/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CaseController::create
* @see app/Http/Controllers/CaseController.php:82
* @route '/cases/create'
*/
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CaseController::create
* @see app/Http/Controllers/CaseController.php:82
* @route '/cases/create'
*/
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CaseController::create
* @see app/Http/Controllers/CaseController.php:82
* @route '/cases/create'
*/
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CaseController::store
* @see app/Http/Controllers/CaseController.php:96
* @route '/cases'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/cases',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CaseController::store
* @see app/Http/Controllers/CaseController.php:96
* @route '/cases'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CaseController::store
* @see app/Http/Controllers/CaseController.php:96
* @route '/cases'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CaseController::show
* @see app/Http/Controllers/CaseController.php:121
* @route '/cases/{caseFile}'
*/
export const show = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/cases/{caseFile}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CaseController::show
* @see app/Http/Controllers/CaseController.php:121
* @route '/cases/{caseFile}'
*/
show.url = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { caseFile: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'case_number' in args) {
        args = { caseFile: args.case_number }
    }

    if (Array.isArray(args)) {
        args = {
            caseFile: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        caseFile: typeof args.caseFile === 'object'
        ? args.caseFile.case_number
        : args.caseFile,
    }

    return show.definition.url
            .replace('{caseFile}', parsedArgs.caseFile.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CaseController::show
* @see app/Http/Controllers/CaseController.php:121
* @route '/cases/{caseFile}'
*/
show.get = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CaseController::show
* @see app/Http/Controllers/CaseController.php:121
* @route '/cases/{caseFile}'
*/
show.head = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CaseController::archive
* @see app/Http/Controllers/CaseController.php:175
* @route '/cases/{caseFile}/archive'
*/
export const archive = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: archive.url(args, options),
    method: 'post',
})

archive.definition = {
    methods: ["post"],
    url: '/cases/{caseFile}/archive',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CaseController::archive
* @see app/Http/Controllers/CaseController.php:175
* @route '/cases/{caseFile}/archive'
*/
archive.url = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { caseFile: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'case_number' in args) {
        args = { caseFile: args.case_number }
    }

    if (Array.isArray(args)) {
        args = {
            caseFile: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        caseFile: typeof args.caseFile === 'object'
        ? args.caseFile.case_number
        : args.caseFile,
    }

    return archive.definition.url
            .replace('{caseFile}', parsedArgs.caseFile.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CaseController::archive
* @see app/Http/Controllers/CaseController.php:175
* @route '/cases/{caseFile}/archive'
*/
archive.post = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: archive.url(args, options),
    method: 'post',
})

const CaseController = { index, create, store, show, archive }

export default CaseController