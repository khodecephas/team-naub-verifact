import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\EvidenceVerificationComparisonController::index
* @see app/Http/Controllers/EvidenceVerificationComparisonController.php:20
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
* @see app/Http/Controllers/EvidenceVerificationComparisonController.php:20
* @route '/verify'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EvidenceVerificationComparisonController::index
* @see app/Http/Controllers/EvidenceVerificationComparisonController.php:20
* @route '/verify'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EvidenceVerificationComparisonController::index
* @see app/Http/Controllers/EvidenceVerificationComparisonController.php:20
* @route '/verify'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EvidenceVerificationComparisonController::store
* @see app/Http/Controllers/EvidenceVerificationComparisonController.php:87
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
* @see app/Http/Controllers/EvidenceVerificationComparisonController.php:87
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
* @see app/Http/Controllers/EvidenceVerificationComparisonController.php:87
* @route '/verify/{evidence}'
*/
store.post = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Auth\EmailVerificationPromptController::__invoke
* @see app/Http/Controllers/Auth/EmailVerificationPromptController.php:16
* @route '/verify-email'
*/
export const notice = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: notice.url(options),
    method: 'get',
})

notice.definition = {
    methods: ["get","head"],
    url: '/verify-email',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Auth\EmailVerificationPromptController::__invoke
* @see app/Http/Controllers/Auth/EmailVerificationPromptController.php:16
* @route '/verify-email'
*/
notice.url = (options?: RouteQueryOptions) => {
    return notice.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\EmailVerificationPromptController::__invoke
* @see app/Http/Controllers/Auth/EmailVerificationPromptController.php:16
* @route '/verify-email'
*/
notice.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: notice.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Auth\EmailVerificationPromptController::__invoke
* @see app/Http/Controllers/Auth/EmailVerificationPromptController.php:16
* @route '/verify-email'
*/
notice.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: notice.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Auth\VerifyEmailController::__invoke
* @see app/Http/Controllers/Auth/VerifyEmailController.php:15
* @route '/verify-email/{id}/{hash}'
*/
export const verify = (args: { id: string | number, hash: string | number } | [id: string | number, hash: string | number ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: verify.url(args, options),
    method: 'get',
})

verify.definition = {
    methods: ["get","head"],
    url: '/verify-email/{id}/{hash}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Auth\VerifyEmailController::__invoke
* @see app/Http/Controllers/Auth/VerifyEmailController.php:15
* @route '/verify-email/{id}/{hash}'
*/
verify.url = (args: { id: string | number, hash: string | number } | [id: string | number, hash: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            id: args[0],
            hash: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        id: args.id,
        hash: args.hash,
    }

    return verify.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace('{hash}', parsedArgs.hash.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\VerifyEmailController::__invoke
* @see app/Http/Controllers/Auth/VerifyEmailController.php:15
* @route '/verify-email/{id}/{hash}'
*/
verify.get = (args: { id: string | number, hash: string | number } | [id: string | number, hash: string | number ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: verify.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Auth\VerifyEmailController::__invoke
* @see app/Http/Controllers/Auth/VerifyEmailController.php:15
* @route '/verify-email/{id}/{hash}'
*/
verify.head = (args: { id: string | number, hash: string | number } | [id: string | number, hash: string | number ], options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: verify.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Auth\EmailVerificationNotificationController::send
* @see app/Http/Controllers/Auth/EmailVerificationNotificationController.php:14
* @route '/email/verification-notification'
*/
export const send = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: send.url(options),
    method: 'post',
})

send.definition = {
    methods: ["post"],
    url: '/email/verification-notification',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Auth\EmailVerificationNotificationController::send
* @see app/Http/Controllers/Auth/EmailVerificationNotificationController.php:14
* @route '/email/verification-notification'
*/
send.url = (options?: RouteQueryOptions) => {
    return send.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\EmailVerificationNotificationController::send
* @see app/Http/Controllers/Auth/EmailVerificationNotificationController.php:14
* @route '/email/verification-notification'
*/
send.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: send.url(options),
    method: 'post',
})

const verification = {
    index: Object.assign(index, index),
    store: Object.assign(store, store),
    notice: Object.assign(notice, notice),
    verify: Object.assign(verify, verify),
    send: Object.assign(send, send),
}

export default verification