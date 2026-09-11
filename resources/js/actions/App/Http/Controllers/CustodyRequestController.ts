import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\CustodyRequestController::store
* @see app/Http/Controllers/CustodyRequestController.php:16
* @route '/evidence/{evidence}/custody-requests'
*/
export const store = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/evidence/{evidence}/custody-requests',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CustodyRequestController::store
* @see app/Http/Controllers/CustodyRequestController.php:16
* @route '/evidence/{evidence}/custody-requests'
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
* @see \App\Http\Controllers\CustodyRequestController::store
* @see app/Http/Controllers/CustodyRequestController.php:16
* @route '/evidence/{evidence}/custody-requests'
*/
store.post = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CustodyRequestController::approve
* @see app/Http/Controllers/CustodyRequestController.php:34
* @route '/custody/requests/{custodyRequest}/approve'
*/
export const approve = (args: { custodyRequest: number | { id: number } } | [custodyRequest: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: approve.url(args, options),
    method: 'post',
})

approve.definition = {
    methods: ["post"],
    url: '/custody/requests/{custodyRequest}/approve',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CustodyRequestController::approve
* @see app/Http/Controllers/CustodyRequestController.php:34
* @route '/custody/requests/{custodyRequest}/approve'
*/
approve.url = (args: { custodyRequest: number | { id: number } } | [custodyRequest: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { custodyRequest: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { custodyRequest: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            custodyRequest: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        custodyRequest: typeof args.custodyRequest === 'object'
        ? args.custodyRequest.id
        : args.custodyRequest,
    }

    return approve.definition.url
            .replace('{custodyRequest}', parsedArgs.custodyRequest.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CustodyRequestController::approve
* @see app/Http/Controllers/CustodyRequestController.php:34
* @route '/custody/requests/{custodyRequest}/approve'
*/
approve.post = (args: { custodyRequest: number | { id: number } } | [custodyRequest: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: approve.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CustodyRequestController::reject
* @see app/Http/Controllers/CustodyRequestController.php:51
* @route '/custody/requests/{custodyRequest}/reject'
*/
export const reject = (args: { custodyRequest: number | { id: number } } | [custodyRequest: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reject.url(args, options),
    method: 'post',
})

reject.definition = {
    methods: ["post"],
    url: '/custody/requests/{custodyRequest}/reject',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CustodyRequestController::reject
* @see app/Http/Controllers/CustodyRequestController.php:51
* @route '/custody/requests/{custodyRequest}/reject'
*/
reject.url = (args: { custodyRequest: number | { id: number } } | [custodyRequest: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { custodyRequest: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { custodyRequest: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            custodyRequest: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        custodyRequest: typeof args.custodyRequest === 'object'
        ? args.custodyRequest.id
        : args.custodyRequest,
    }

    return reject.definition.url
            .replace('{custodyRequest}', parsedArgs.custodyRequest.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CustodyRequestController::reject
* @see app/Http/Controllers/CustodyRequestController.php:51
* @route '/custody/requests/{custodyRequest}/reject'
*/
reject.post = (args: { custodyRequest: number | { id: number } } | [custodyRequest: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reject.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CustodyRequestController::cancel
* @see app/Http/Controllers/CustodyRequestController.php:68
* @route '/custody/requests/{custodyRequest}/cancel'
*/
export const cancel = (args: { custodyRequest: number | { id: number } } | [custodyRequest: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancel.url(args, options),
    method: 'post',
})

cancel.definition = {
    methods: ["post"],
    url: '/custody/requests/{custodyRequest}/cancel',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CustodyRequestController::cancel
* @see app/Http/Controllers/CustodyRequestController.php:68
* @route '/custody/requests/{custodyRequest}/cancel'
*/
cancel.url = (args: { custodyRequest: number | { id: number } } | [custodyRequest: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { custodyRequest: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { custodyRequest: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            custodyRequest: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        custodyRequest: typeof args.custodyRequest === 'object'
        ? args.custodyRequest.id
        : args.custodyRequest,
    }

    return cancel.definition.url
            .replace('{custodyRequest}', parsedArgs.custodyRequest.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CustodyRequestController::cancel
* @see app/Http/Controllers/CustodyRequestController.php:68
* @route '/custody/requests/{custodyRequest}/cancel'
*/
cancel.post = (args: { custodyRequest: number | { id: number } } | [custodyRequest: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancel.url(args, options),
    method: 'post',
})

const CustodyRequestController = { store, approve, reject, cancel }

export default CustodyRequestController