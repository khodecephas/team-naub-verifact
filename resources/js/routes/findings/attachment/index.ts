import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\FindingController::download
* @see app/Http/Controllers/FindingController.php:60
* @route '/findings/{finding}/attachment'
*/
export const download = (args: { finding: string | { finding_number: string } } | [finding: string | { finding_number: string } ] | string | { finding_number: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: download.url(args, options),
    method: 'get',
})

download.definition = {
    methods: ["get","head"],
    url: '/findings/{finding}/attachment',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\FindingController::download
* @see app/Http/Controllers/FindingController.php:60
* @route '/findings/{finding}/attachment'
*/
download.url = (args: { finding: string | { finding_number: string } } | [finding: string | { finding_number: string } ] | string | { finding_number: string }, options?: RouteQueryOptions) => {
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

    return download.definition.url
            .replace('{finding}', parsedArgs.finding.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\FindingController::download
* @see app/Http/Controllers/FindingController.php:60
* @route '/findings/{finding}/attachment'
*/
download.get = (args: { finding: string | { finding_number: string } } | [finding: string | { finding_number: string } ] | string | { finding_number: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: download.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\FindingController::download
* @see app/Http/Controllers/FindingController.php:60
* @route '/findings/{finding}/attachment'
*/
download.head = (args: { finding: string | { finding_number: string } } | [finding: string | { finding_number: string } ] | string | { finding_number: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: download.url(args, options),
    method: 'head',
})

const attachment = {
    download: Object.assign(download, download),
}

export default attachment