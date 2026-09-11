import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\EvidenceController::complete
* @see app/Http/Controllers/EvidenceController.php:290
* @route '/evidence/{evidence}/complete-intake'
*/
export const complete = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: complete.url(args, options),
    method: 'patch',
})

complete.definition = {
    methods: ["patch"],
    url: '/evidence/{evidence}/complete-intake',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\EvidenceController::complete
* @see app/Http/Controllers/EvidenceController.php:290
* @route '/evidence/{evidence}/complete-intake'
*/
complete.url = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions) => {
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

    return complete.definition.url
            .replace('{evidence}', parsedArgs.evidence.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EvidenceController::complete
* @see app/Http/Controllers/EvidenceController.php:290
* @route '/evidence/{evidence}/complete-intake'
*/
complete.patch = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: complete.url(args, options),
    method: 'patch',
})

const intake = {
    complete: Object.assign(complete, complete),
}

export default intake