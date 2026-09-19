import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ReportController::index
* @see app/Http/Controllers/ReportController.php:25
* @route '/reports'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/reports',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReportController::index
* @see app/Http/Controllers/ReportController.php:25
* @route '/reports'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReportController::index
* @see app/Http/Controllers/ReportController.php:25
* @route '/reports'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ReportController::index
* @see app/Http/Controllers/ReportController.php:25
* @route '/reports'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ReportController::create
* @see app/Http/Controllers/ReportController.php:83
* @route '/reports/create'
*/
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/reports/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReportController::create
* @see app/Http/Controllers/ReportController.php:83
* @route '/reports/create'
*/
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReportController::create
* @see app/Http/Controllers/ReportController.php:83
* @route '/reports/create'
*/
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ReportController::create
* @see app/Http/Controllers/ReportController.php:83
* @route '/reports/create'
*/
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ReportController::store
* @see app/Http/Controllers/ReportController.php:123
* @route '/reports'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/reports',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ReportController::store
* @see app/Http/Controllers/ReportController.php:123
* @route '/reports'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReportController::store
* @see app/Http/Controllers/ReportController.php:123
* @route '/reports'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ReportController::download
* @see app/Http/Controllers/ReportController.php:163
* @route '/reports/{report}/download'
*/
export const download = (args: { report: string | { report_number: string } } | [report: string | { report_number: string } ] | string | { report_number: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: download.url(args, options),
    method: 'get',
})

download.definition = {
    methods: ["get","head"],
    url: '/reports/{report}/download',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReportController::download
* @see app/Http/Controllers/ReportController.php:163
* @route '/reports/{report}/download'
*/
download.url = (args: { report: string | { report_number: string } } | [report: string | { report_number: string } ] | string | { report_number: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { report: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'report_number' in args) {
        args = { report: args.report_number }
    }

    if (Array.isArray(args)) {
        args = {
            report: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        report: typeof args.report === 'object'
        ? args.report.report_number
        : args.report,
    }

    return download.definition.url
            .replace('{report}', parsedArgs.report.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReportController::download
* @see app/Http/Controllers/ReportController.php:163
* @route '/reports/{report}/download'
*/
download.get = (args: { report: string | { report_number: string } } | [report: string | { report_number: string } ] | string | { report_number: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: download.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ReportController::download
* @see app/Http/Controllers/ReportController.php:163
* @route '/reports/{report}/download'
*/
download.head = (args: { report: string | { report_number: string } } | [report: string | { report_number: string } ] | string | { report_number: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: download.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ReportController::show
* @see app/Http/Controllers/ReportController.php:140
* @route '/reports/{report}'
*/
export const show = (args: { report: string | { report_number: string } } | [report: string | { report_number: string } ] | string | { report_number: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/reports/{report}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReportController::show
* @see app/Http/Controllers/ReportController.php:140
* @route '/reports/{report}'
*/
show.url = (args: { report: string | { report_number: string } } | [report: string | { report_number: string } ] | string | { report_number: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { report: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'report_number' in args) {
        args = { report: args.report_number }
    }

    if (Array.isArray(args)) {
        args = {
            report: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        report: typeof args.report === 'object'
        ? args.report.report_number
        : args.report,
    }

    return show.definition.url
            .replace('{report}', parsedArgs.report.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReportController::show
* @see app/Http/Controllers/ReportController.php:140
* @route '/reports/{report}'
*/
show.get = (args: { report: string | { report_number: string } } | [report: string | { report_number: string } ] | string | { report_number: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ReportController::show
* @see app/Http/Controllers/ReportController.php:140
* @route '/reports/{report}'
*/
show.head = (args: { report: string | { report_number: string } } | [report: string | { report_number: string } ] | string | { report_number: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ReportController::finalize
* @see app/Http/Controllers/ReportController.php:222
* @route '/reports/{report}/finalize'
*/
export const finalize = (args: { report: string | { report_number: string } } | [report: string | { report_number: string } ] | string | { report_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: finalize.url(args, options),
    method: 'post',
})

finalize.definition = {
    methods: ["post"],
    url: '/reports/{report}/finalize',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ReportController::finalize
* @see app/Http/Controllers/ReportController.php:222
* @route '/reports/{report}/finalize'
*/
finalize.url = (args: { report: string | { report_number: string } } | [report: string | { report_number: string } ] | string | { report_number: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { report: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'report_number' in args) {
        args = { report: args.report_number }
    }

    if (Array.isArray(args)) {
        args = {
            report: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        report: typeof args.report === 'object'
        ? args.report.report_number
        : args.report,
    }

    return finalize.definition.url
            .replace('{report}', parsedArgs.report.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReportController::finalize
* @see app/Http/Controllers/ReportController.php:222
* @route '/reports/{report}/finalize'
*/
finalize.post = (args: { report: string | { report_number: string } } | [report: string | { report_number: string } ] | string | { report_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: finalize.url(args, options),
    method: 'post',
})

const ReportController = { index, create, store, download, show, finalize }

export default ReportController