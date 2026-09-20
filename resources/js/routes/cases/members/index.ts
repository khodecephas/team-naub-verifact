import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\CaseController::store
* @see app/Http/Controllers/CaseController.php:243
* @route '/cases/{caseFile}/members'
*/
export const store = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/cases/{caseFile}/members',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CaseController::store
* @see app/Http/Controllers/CaseController.php:243
* @route '/cases/{caseFile}/members'
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
* @see \App\Http\Controllers\CaseController::store
* @see app/Http/Controllers/CaseController.php:243
* @route '/cases/{caseFile}/members'
*/
store.post = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CaseController::destroy
* @see app/Http/Controllers/CaseController.php:263
* @route '/cases/{caseFile}/members/{assignment}'
*/
export const destroy = (args: { caseFile: string | { case_number: string }, assignment: number | { id: number } } | [caseFile: string | { case_number: string }, assignment: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/cases/{caseFile}/members/{assignment}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\CaseController::destroy
* @see app/Http/Controllers/CaseController.php:263
* @route '/cases/{caseFile}/members/{assignment}'
*/
destroy.url = (args: { caseFile: string | { case_number: string }, assignment: number | { id: number } } | [caseFile: string | { case_number: string }, assignment: number | { id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            caseFile: args[0],
            assignment: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        caseFile: typeof args.caseFile === 'object'
        ? args.caseFile.case_number
        : args.caseFile,
        assignment: typeof args.assignment === 'object'
        ? args.assignment.id
        : args.assignment,
    }

    return destroy.definition.url
            .replace('{caseFile}', parsedArgs.caseFile.toString())
            .replace('{assignment}', parsedArgs.assignment.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CaseController::destroy
* @see app/Http/Controllers/CaseController.php:263
* @route '/cases/{caseFile}/members/{assignment}'
*/
destroy.delete = (args: { caseFile: string | { case_number: string }, assignment: number | { id: number } } | [caseFile: string | { case_number: string }, assignment: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

const members = {
    store: Object.assign(store, store),
    destroy: Object.assign(destroy, destroy),
}

export default members