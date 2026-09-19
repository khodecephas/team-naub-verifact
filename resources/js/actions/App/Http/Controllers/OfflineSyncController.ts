import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\OfflineSyncController::session
* @see app/Http/Controllers/OfflineSyncController.php:35
* @route '/offline-sync/session'
*/
export const session = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: session.url(options),
    method: 'get',
})

session.definition = {
    methods: ["get","head"],
    url: '/offline-sync/session',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OfflineSyncController::session
* @see app/Http/Controllers/OfflineSyncController.php:35
* @route '/offline-sync/session'
*/
session.url = (options?: RouteQueryOptions) => {
    return session.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfflineSyncController::session
* @see app/Http/Controllers/OfflineSyncController.php:35
* @route '/offline-sync/session'
*/
session.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: session.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OfflineSyncController::session
* @see app/Http/Controllers/OfflineSyncController.php:35
* @route '/offline-sync/session'
*/
session.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: session.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\OfflineSyncController::bootstrap
* @see app/Http/Controllers/OfflineSyncController.php:51
* @route '/offline-sync/bootstrap'
*/
export const bootstrap = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: bootstrap.url(options),
    method: 'get',
})

bootstrap.definition = {
    methods: ["get","head"],
    url: '/offline-sync/bootstrap',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OfflineSyncController::bootstrap
* @see app/Http/Controllers/OfflineSyncController.php:51
* @route '/offline-sync/bootstrap'
*/
bootstrap.url = (options?: RouteQueryOptions) => {
    return bootstrap.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfflineSyncController::bootstrap
* @see app/Http/Controllers/OfflineSyncController.php:51
* @route '/offline-sync/bootstrap'
*/
bootstrap.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: bootstrap.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OfflineSyncController::bootstrap
* @see app/Http/Controllers/OfflineSyncController.php:51
* @route '/offline-sync/bootstrap'
*/
bootstrap.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: bootstrap.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\OfflineSyncController::syncPhysicalSource
* @see app/Http/Controllers/OfflineSyncController.php:83
* @route '/offline-sync/cases/{caseFile}/physical-sources'
*/
export const syncPhysicalSource = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: syncPhysicalSource.url(args, options),
    method: 'post',
})

syncPhysicalSource.definition = {
    methods: ["post"],
    url: '/offline-sync/cases/{caseFile}/physical-sources',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OfflineSyncController::syncPhysicalSource
* @see app/Http/Controllers/OfflineSyncController.php:83
* @route '/offline-sync/cases/{caseFile}/physical-sources'
*/
syncPhysicalSource.url = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions) => {
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

    return syncPhysicalSource.definition.url
            .replace('{caseFile}', parsedArgs.caseFile.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfflineSyncController::syncPhysicalSource
* @see app/Http/Controllers/OfflineSyncController.php:83
* @route '/offline-sync/cases/{caseFile}/physical-sources'
*/
syncPhysicalSource.post = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: syncPhysicalSource.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfflineSyncController::syncEvidence
* @see app/Http/Controllers/OfflineSyncController.php:107
* @route '/offline-sync/cases/{caseFile}/evidence'
*/
export const syncEvidence = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: syncEvidence.url(args, options),
    method: 'post',
})

syncEvidence.definition = {
    methods: ["post"],
    url: '/offline-sync/cases/{caseFile}/evidence',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OfflineSyncController::syncEvidence
* @see app/Http/Controllers/OfflineSyncController.php:107
* @route '/offline-sync/cases/{caseFile}/evidence'
*/
syncEvidence.url = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions) => {
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

    return syncEvidence.definition.url
            .replace('{caseFile}', parsedArgs.caseFile.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfflineSyncController::syncEvidence
* @see app/Http/Controllers/OfflineSyncController.php:107
* @route '/offline-sync/cases/{caseFile}/evidence'
*/
syncEvidence.post = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: syncEvidence.url(args, options),
    method: 'post',
})

const OfflineSyncController = { session, bootstrap, syncPhysicalSource, syncEvidence }

export default OfflineSyncController