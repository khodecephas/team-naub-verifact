import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\FindingController::create
* @see app/Http/Controllers/FindingController.php:21
* @route '/cases/{caseFile}/findings/create'
*/
export const create = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(args, options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/cases/{caseFile}/findings/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\FindingController::create
* @see app/Http/Controllers/FindingController.php:21
* @route '/cases/{caseFile}/findings/create'
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
* @see \App\Http\Controllers\FindingController::create
* @see app/Http/Controllers/FindingController.php:21
* @route '/cases/{caseFile}/findings/create'
*/
create.get = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\FindingController::create
* @see app/Http/Controllers/FindingController.php:21
* @route '/cases/{caseFile}/findings/create'
*/
create.head = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\FindingController::store
* @see app/Http/Controllers/FindingController.php:33
* @route '/cases/{caseFile}/findings'
*/
export const store = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/cases/{caseFile}/findings',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\FindingController::store
* @see app/Http/Controllers/FindingController.php:33
* @route '/cases/{caseFile}/findings'
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
* @see \App\Http\Controllers\FindingController::store
* @see app/Http/Controllers/FindingController.php:33
* @route '/cases/{caseFile}/findings'
*/
store.post = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\FindingController::downloadAttachment
* @see app/Http/Controllers/FindingController.php:60
* @route '/findings/{finding}/attachment'
*/
export const downloadAttachment = (args: { finding: string | { finding_number: string } } | [finding: string | { finding_number: string } ] | string | { finding_number: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: downloadAttachment.url(args, options),
    method: 'get',
})

downloadAttachment.definition = {
    methods: ["get","head"],
    url: '/findings/{finding}/attachment',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\FindingController::downloadAttachment
* @see app/Http/Controllers/FindingController.php:60
* @route '/findings/{finding}/attachment'
*/
downloadAttachment.url = (args: { finding: string | { finding_number: string } } | [finding: string | { finding_number: string } ] | string | { finding_number: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { finding: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'finding_number' in args) {
        args = { finding: args.finding_number }
    }

    if (Array.isArray(args)) {
        args = {
            finding: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        finding: typeof args.finding === 'object'
        ? args.finding.finding_number
        : args.finding,
    }

    return downloadAttachment.definition.url
            .replace('{finding}', parsedArgs.finding.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\FindingController::downloadAttachment
* @see app/Http/Controllers/FindingController.php:60
* @route '/findings/{finding}/attachment'
*/
downloadAttachment.get = (args: { finding: string | { finding_number: string } } | [finding: string | { finding_number: string } ] | string | { finding_number: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: downloadAttachment.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\FindingController::downloadAttachment
* @see app/Http/Controllers/FindingController.php:60
* @route '/findings/{finding}/attachment'
*/
downloadAttachment.head = (args: { finding: string | { finding_number: string } } | [finding: string | { finding_number: string } ] | string | { finding_number: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: downloadAttachment.url(args, options),
    method: 'head',
})

const FindingController = { create, store, downloadAttachment }

export default FindingController