import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\EvidenceVerificationComparisonController::index
* @see app/Http/Controllers/EvidenceVerificationComparisonController.php:25
* @route '/verify'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/verify',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EvidenceVerificationComparisonController::index
* @see app/Http/Controllers/EvidenceVerificationComparisonController.php:25
* @route '/verify'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EvidenceVerificationComparisonController::index
* @see app/Http/Controllers/EvidenceVerificationComparisonController.php:25
* @route '/verify'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EvidenceVerificationComparisonController::index
* @see app/Http/Controllers/EvidenceVerificationComparisonController.php:25
* @route '/verify'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EvidenceVerificationComparisonController::uploadChunk
* @see app/Http/Controllers/EvidenceVerificationComparisonController.php:93
* @route '/verify/{evidence}/chunks'
*/
export const uploadChunk = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: uploadChunk.url(args, options),
    method: 'post',
})

uploadChunk.definition = {
    methods: ["post"],
    url: '/verify/{evidence}/chunks',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EvidenceVerificationComparisonController::uploadChunk
* @see app/Http/Controllers/EvidenceVerificationComparisonController.php:93
* @route '/verify/{evidence}/chunks'
*/
uploadChunk.url = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions) => {
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

    return uploadChunk.definition.url
            .replace('{evidence}', parsedArgs.evidence.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EvidenceVerificationComparisonController::uploadChunk
* @see app/Http/Controllers/EvidenceVerificationComparisonController.php:93
* @route '/verify/{evidence}/chunks'
*/
uploadChunk.post = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: uploadChunk.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EvidenceVerificationComparisonController::completeChunkUpload
* @see app/Http/Controllers/EvidenceVerificationComparisonController.php:155
* @route '/verify/{evidence}/complete'
*/
export const completeChunkUpload = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: completeChunkUpload.url(args, options),
    method: 'post',
})

completeChunkUpload.definition = {
    methods: ["post"],
    url: '/verify/{evidence}/complete',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EvidenceVerificationComparisonController::completeChunkUpload
* @see app/Http/Controllers/EvidenceVerificationComparisonController.php:155
* @route '/verify/{evidence}/complete'
*/
completeChunkUpload.url = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions) => {
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

    return completeChunkUpload.definition.url
            .replace('{evidence}', parsedArgs.evidence.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EvidenceVerificationComparisonController::completeChunkUpload
* @see app/Http/Controllers/EvidenceVerificationComparisonController.php:155
* @route '/verify/{evidence}/complete'
*/
completeChunkUpload.post = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: completeChunkUpload.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EvidenceVerificationComparisonController::store
* @see app/Http/Controllers/EvidenceVerificationComparisonController.php:248
* @route '/verify/{evidence}'
*/
export const store = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/verify/{evidence}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EvidenceVerificationComparisonController::store
* @see app/Http/Controllers/EvidenceVerificationComparisonController.php:248
* @route '/verify/{evidence}'
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
* @see \App\Http\Controllers\EvidenceVerificationComparisonController::store
* @see app/Http/Controllers/EvidenceVerificationComparisonController.php:248
* @route '/verify/{evidence}'
*/
store.post = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

const EvidenceVerificationComparisonController = { index, uploadChunk, completeChunkUpload, store }

export default EvidenceVerificationComparisonController