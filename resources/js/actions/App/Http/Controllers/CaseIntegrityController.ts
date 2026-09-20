import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\CaseIntegrityController::verify
* @see app/Http/Controllers/CaseIntegrityController.php:18
* @route '/cases/{caseFile}/integrity-check'
*/
export const verify = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verify.url(args, options),
    method: 'post',
})

verify.definition = {
    methods: ["post"],
    url: '/cases/{caseFile}/integrity-check',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CaseIntegrityController::verify
* @see app/Http/Controllers/CaseIntegrityController.php:18
* @route '/cases/{caseFile}/integrity-check'
*/
verify.url = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions) => {
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

    return verify.definition.url
            .replace('{caseFile}', parsedArgs.caseFile.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CaseIntegrityController::verify
* @see app/Http/Controllers/CaseIntegrityController.php:18
* @route '/cases/{caseFile}/integrity-check'
*/
verify.post = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verify.url(args, options),
    method: 'post',
})

const CaseIntegrityController = { verify }

export default CaseIntegrityController