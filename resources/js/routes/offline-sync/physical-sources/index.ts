import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\OfflineSyncController::store
* @see app/Http/Controllers/OfflineSyncController.php:83
* @route '/offline-sync/cases/{caseFile}/physical-sources'
*/
export const store = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/offline-sync/cases/{caseFile}/physical-sources',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OfflineSyncController::store
* @see app/Http/Controllers/OfflineSyncController.php:83
* @route '/offline-sync/cases/{caseFile}/physical-sources'
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
* @see \App\Http\Controllers\OfflineSyncController::store
* @see app/Http/Controllers/OfflineSyncController.php:83
* @route '/offline-sync/cases/{caseFile}/physical-sources'
*/
store.post = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

const physicalSources = {
    store: Object.assign(store, store),
}

export default physicalSources