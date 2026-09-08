import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\EvidenceController::index
* @see app/Http/Controllers/EvidenceController.php:20
* @route '/evidence'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/evidence',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EvidenceController::index
* @see app/Http/Controllers/EvidenceController.php:20
* @route '/evidence'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EvidenceController::index
* @see app/Http/Controllers/EvidenceController.php:20
* @route '/evidence'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EvidenceController::index
* @see app/Http/Controllers/EvidenceController.php:20
* @route '/evidence'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EvidenceController::show
* @see app/Http/Controllers/EvidenceController.php:77
* @route '/evidence/{evidence}'
*/
export const show = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/evidence/{evidence}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EvidenceController::show
* @see app/Http/Controllers/EvidenceController.php:77
* @route '/evidence/{evidence}'
*/
show.url = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { evidence: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'evidence_number' in args) {
        args = { evidence: args.evidence_number }
    }

    if (Array.isArray(args)) {
        args = {
            evidence: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        evidence: typeof args.evidence === 'object'
        ? args.evidence.evidence_number
        : args.evidence,
    }

    return show.definition.url
            .replace('{evidence}', parsedArgs.evidence.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EvidenceController::show
* @see app/Http/Controllers/EvidenceController.php:77
* @route '/evidence/{evidence}'
*/
show.get = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EvidenceController::show
* @see app/Http/Controllers/EvidenceController.php:77
* @route '/evidence/{evidence}'
*/
show.head = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EvidenceController::create
* @see app/Http/Controllers/EvidenceController.php:37
* @route '/cases/{caseFile}/evidence/create'
*/
export const create = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(args, options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/cases/{caseFile}/evidence/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EvidenceController::create
* @see app/Http/Controllers/EvidenceController.php:37
* @route '/cases/{caseFile}/evidence/create'
*/
create.url = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions) => {
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

    return create.definition.url
            .replace('{caseFile}', parsedArgs.caseFile.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EvidenceController::create
* @see app/Http/Controllers/EvidenceController.php:37
* @route '/cases/{caseFile}/evidence/create'
*/
create.get = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EvidenceController::create
* @see app/Http/Controllers/EvidenceController.php:37
* @route '/cases/{caseFile}/evidence/create'
*/
create.head = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EvidenceController::store
* @see app/Http/Controllers/EvidenceController.php:58
* @route '/cases/{caseFile}/evidence'
*/
export const store = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/cases/{caseFile}/evidence',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EvidenceController::store
* @see app/Http/Controllers/EvidenceController.php:58
* @route '/cases/{caseFile}/evidence'
*/
store.url = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions) => {
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

    return store.definition.url
            .replace('{caseFile}', parsedArgs.caseFile.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EvidenceController::store
* @see app/Http/Controllers/EvidenceController.php:58
* @route '/cases/{caseFile}/evidence'
*/
store.post = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

const evidence = {
    index: Object.assign(index, index),
    show: Object.assign(show, show),
    create: Object.assign(create, create),
    store: Object.assign(store, store),
}

export default evidence