import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\EvidenceController::store
* @see app/Http/Controllers/EvidenceController.php:457
* @route '/evidence/{evidence}/custody-transfers'
*/
export const store = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/evidence/{evidence}/custody-transfers',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EvidenceController::store
* @see app/Http/Controllers/EvidenceController.php:457
* @route '/evidence/{evidence}/custody-transfers'
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
* @see app/Http/Controllers/EvidenceController.php:457
* @route '/evidence/{evidence}/custody-transfers'
*/
store.post = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

const custodyTransfers = {
    store: Object.assign(store, store),
}

export default custodyTransfers