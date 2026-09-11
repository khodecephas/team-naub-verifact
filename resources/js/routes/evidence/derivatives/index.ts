import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\EvidenceController::store
* @see app/Http/Controllers/EvidenceController.php:352
* @route '/evidence/{evidence}/derivatives'
*/
export const store = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/evidence/{evidence}/derivatives',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EvidenceController::store
* @see app/Http/Controllers/EvidenceController.php:352
* @route '/evidence/{evidence}/derivatives'
*/
store.url = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions) => {
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

    return store.definition.url
            .replace('{evidence}', parsedArgs.evidence.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EvidenceController::store
* @see app/Http/Controllers/EvidenceController.php:352
* @route '/evidence/{evidence}/derivatives'
*/
store.post = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EvidenceController::download
* @see app/Http/Controllers/EvidenceController.php:390
* @route '/evidence/{evidence}/derivatives/{derivative}/download'
*/
export const download = (args: { evidence: string | { evidence_number: string }, derivative: string | { derivative_number: string } } | [evidence: string | { evidence_number: string }, derivative: string | { derivative_number: string } ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: download.url(args, options),
    method: 'get',
})

download.definition = {
    methods: ["get","head"],
    url: '/evidence/{evidence}/derivatives/{derivative}/download',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EvidenceController::download
* @see app/Http/Controllers/EvidenceController.php:390
* @route '/evidence/{evidence}/derivatives/{derivative}/download'
*/
download.url = (args: { evidence: string | { evidence_number: string }, derivative: string | { derivative_number: string } } | [evidence: string | { evidence_number: string }, derivative: string | { derivative_number: string } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            evidence: args[0],
            derivative: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        evidence: typeof args.evidence === 'object'
        ? args.evidence.evidence_number
        : args.evidence,
        derivative: typeof args.derivative === 'object'
        ? args.derivative.derivative_number
        : args.derivative,
    }

    return download.definition.url
            .replace('{evidence}', parsedArgs.evidence.toString())
            .replace('{derivative}', parsedArgs.derivative.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EvidenceController::download
* @see app/Http/Controllers/EvidenceController.php:390
* @route '/evidence/{evidence}/derivatives/{derivative}/download'
*/
download.get = (args: { evidence: string | { evidence_number: string }, derivative: string | { derivative_number: string } } | [evidence: string | { evidence_number: string }, derivative: string | { derivative_number: string } ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: download.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EvidenceController::download
* @see app/Http/Controllers/EvidenceController.php:390
* @route '/evidence/{evidence}/derivatives/{derivative}/download'
*/
download.head = (args: { evidence: string | { evidence_number: string }, derivative: string | { derivative_number: string } } | [evidence: string | { evidence_number: string }, derivative: string | { derivative_number: string } ], options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: download.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EvidenceController::revoke
* @see app/Http/Controllers/EvidenceController.php:444
* @route '/evidence/{evidence}/derivatives/{derivative}/revoke'
*/
export const revoke = (args: { evidence: string | { evidence_number: string }, derivative: string | { derivative_number: string } } | [evidence: string | { evidence_number: string }, derivative: string | { derivative_number: string } ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: revoke.url(args, options),
    method: 'post',
})

revoke.definition = {
    methods: ["post"],
    url: '/evidence/{evidence}/derivatives/{derivative}/revoke',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EvidenceController::revoke
* @see app/Http/Controllers/EvidenceController.php:444
* @route '/evidence/{evidence}/derivatives/{derivative}/revoke'
*/
revoke.url = (args: { evidence: string | { evidence_number: string }, derivative: string | { derivative_number: string } } | [evidence: string | { evidence_number: string }, derivative: string | { derivative_number: string } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            evidence: args[0],
            derivative: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        evidence: typeof args.evidence === 'object'
        ? args.evidence.evidence_number
        : args.evidence,
        derivative: typeof args.derivative === 'object'
        ? args.derivative.derivative_number
        : args.derivative,
    }

    return revoke.definition.url
            .replace('{evidence}', parsedArgs.evidence.toString())
            .replace('{derivative}', parsedArgs.derivative.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EvidenceController::revoke
* @see app/Http/Controllers/EvidenceController.php:444
* @route '/evidence/{evidence}/derivatives/{derivative}/revoke'
*/
revoke.post = (args: { evidence: string | { evidence_number: string }, derivative: string | { derivative_number: string } } | [evidence: string | { evidence_number: string }, derivative: string | { derivative_number: string } ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: revoke.url(args, options),
    method: 'post',
})

const derivatives = {
    store: Object.assign(store, store),
    download: Object.assign(download, download),
    revoke: Object.assign(revoke, revoke),
}

export default derivatives