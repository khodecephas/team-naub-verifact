import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\EvidenceController::index
* @see app/Http/Controllers/EvidenceController.php:45
* @route '/evidence'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/evidence',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EvidenceController::index
* @see app/Http/Controllers/EvidenceController.php:45
* @route '/evidence'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EvidenceController::index
* @see app/Http/Controllers/EvidenceController.php:45
* @route '/evidence'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EvidenceController::index
* @see app/Http/Controllers/EvidenceController.php:45
* @route '/evidence'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EvidenceController::exportMethod
* @see app/Http/Controllers/EvidenceController.php:86
* @route '/evidence-export.csv'
*/
export const exportMethod = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
})

exportMethod.definition = {
    methods: ["get","head"],
    url: '/evidence-export.csv',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EvidenceController::exportMethod
* @see app/Http/Controllers/EvidenceController.php:86
* @route '/evidence-export.csv'
*/
exportMethod.url = (options?: RouteQueryOptions) => {
    return exportMethod.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EvidenceController::exportMethod
* @see app/Http/Controllers/EvidenceController.php:86
* @route '/evidence-export.csv'
*/
exportMethod.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EvidenceController::exportMethod
* @see app/Http/Controllers/EvidenceController.php:86
* @route '/evidence-export.csv'
*/
exportMethod.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportMethod.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EvidenceController::verifyBatch
* @see app/Http/Controllers/EvidenceController.php:126
* @route '/evidence/batch-verify'
*/
export const verifyBatch = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verifyBatch.url(options),
    method: 'post',
})

verifyBatch.definition = {
    methods: ["post"],
    url: '/evidence/batch-verify',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EvidenceController::verifyBatch
* @see app/Http/Controllers/EvidenceController.php:126
* @route '/evidence/batch-verify'
*/
verifyBatch.url = (options?: RouteQueryOptions) => {
    return verifyBatch.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EvidenceController::verifyBatch
* @see app/Http/Controllers/EvidenceController.php:126
* @route '/evidence/batch-verify'
*/
verifyBatch.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verifyBatch.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EvidenceController::quickCreate
* @see app/Http/Controllers/EvidenceController.php:161
* @route '/evidence/quick-ingest'
*/
export const quickCreate = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: quickCreate.url(options),
    method: 'get',
})

quickCreate.definition = {
    methods: ["get","head"],
    url: '/evidence/quick-ingest',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EvidenceController::quickCreate
* @see app/Http/Controllers/EvidenceController.php:161
* @route '/evidence/quick-ingest'
*/
quickCreate.url = (options?: RouteQueryOptions) => {
    return quickCreate.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EvidenceController::quickCreate
* @see app/Http/Controllers/EvidenceController.php:161
* @route '/evidence/quick-ingest'
*/
quickCreate.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: quickCreate.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EvidenceController::quickCreate
* @see app/Http/Controllers/EvidenceController.php:161
* @route '/evidence/quick-ingest'
*/
quickCreate.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: quickCreate.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EvidenceController::quickStore
* @see app/Http/Controllers/EvidenceController.php:170
* @route '/evidence/quick-ingest'
*/
export const quickStore = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: quickStore.url(options),
    method: 'post',
})

quickStore.definition = {
    methods: ["post"],
    url: '/evidence/quick-ingest',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EvidenceController::quickStore
* @see app/Http/Controllers/EvidenceController.php:170
* @route '/evidence/quick-ingest'
*/
quickStore.url = (options?: RouteQueryOptions) => {
    return quickStore.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EvidenceController::quickStore
* @see app/Http/Controllers/EvidenceController.php:170
* @route '/evidence/quick-ingest'
*/
quickStore.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: quickStore.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EvidenceController::create
* @see app/Http/Controllers/EvidenceController.php:187
* @route '/cases/{caseFile}/evidence/create'
*/
export const create = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(args, options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/cases/{caseFile}/evidence/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EvidenceController::create
* @see app/Http/Controllers/EvidenceController.php:187
* @route '/cases/{caseFile}/evidence/create'
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
* @see \App\Http\Controllers\EvidenceController::create
* @see app/Http/Controllers/EvidenceController.php:187
* @route '/cases/{caseFile}/evidence/create'
*/
create.get = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EvidenceController::create
* @see app/Http/Controllers/EvidenceController.php:187
* @route '/cases/{caseFile}/evidence/create'
*/
create.head = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EvidenceController::store
* @see app/Http/Controllers/EvidenceController.php:208
* @route '/cases/{caseFile}/evidence'
*/
export const store = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/cases/{caseFile}/evidence',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EvidenceController::store
* @see app/Http/Controllers/EvidenceController.php:208
* @route '/cases/{caseFile}/evidence'
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
* @see \App\Http\Controllers\EvidenceController::store
* @see app/Http/Controllers/EvidenceController.php:208
* @route '/cases/{caseFile}/evidence'
*/
store.post = (args: { caseFile: string | { case_number: string } } | [caseFile: string | { case_number: string } ] | string | { case_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EvidenceController::completeIntake
* @see app/Http/Controllers/EvidenceController.php:362
* @route '/evidence/{evidence}/complete-intake'
*/
export const completeIntake = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: completeIntake.url(args, options),
    method: 'patch',
})

completeIntake.definition = {
    methods: ["patch"],
    url: '/evidence/{evidence}/complete-intake',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\EvidenceController::completeIntake
* @see app/Http/Controllers/EvidenceController.php:362
* @route '/evidence/{evidence}/complete-intake'
*/
completeIntake.url = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions) => {
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

    return completeIntake.definition.url
            .replace('{evidence}', parsedArgs.evidence.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EvidenceController::completeIntake
* @see app/Http/Controllers/EvidenceController.php:362
* @route '/evidence/{evidence}/complete-intake'
*/
completeIntake.patch = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: completeIntake.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\EvidenceController::viewFile
* @see app/Http/Controllers/EvidenceController.php:385
* @route '/evidence/{evidence}/file'
*/
export const viewFile = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: viewFile.url(args, options),
    method: 'get',
})

viewFile.definition = {
    methods: ["get","head"],
    url: '/evidence/{evidence}/file',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EvidenceController::viewFile
* @see app/Http/Controllers/EvidenceController.php:385
* @route '/evidence/{evidence}/file'
*/
viewFile.url = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions) => {
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

    return viewFile.definition.url
            .replace('{evidence}', parsedArgs.evidence.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EvidenceController::viewFile
* @see app/Http/Controllers/EvidenceController.php:385
* @route '/evidence/{evidence}/file'
*/
viewFile.get = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: viewFile.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EvidenceController::viewFile
* @see app/Http/Controllers/EvidenceController.php:385
* @route '/evidence/{evidence}/file'
*/
viewFile.head = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: viewFile.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EvidenceController::verify
* @see app/Http/Controllers/EvidenceController.php:400
* @route '/evidence/{evidence}/verify'
*/
export const verify = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verify.url(args, options),
    method: 'post',
})

verify.definition = {
    methods: ["post"],
    url: '/evidence/{evidence}/verify',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EvidenceController::verify
* @see app/Http/Controllers/EvidenceController.php:400
* @route '/evidence/{evidence}/verify'
*/
verify.url = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions) => {
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

    return verify.definition.url
            .replace('{evidence}', parsedArgs.evidence.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EvidenceController::verify
* @see app/Http/Controllers/EvidenceController.php:400
* @route '/evidence/{evidence}/verify'
*/
verify.post = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verify.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EvidenceController::issueWorkingCopy
* @see app/Http/Controllers/EvidenceController.php:424
* @route '/evidence/{evidence}/derivatives'
*/
export const issueWorkingCopy = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: issueWorkingCopy.url(args, options),
    method: 'post',
})

issueWorkingCopy.definition = {
    methods: ["post"],
    url: '/evidence/{evidence}/derivatives',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EvidenceController::issueWorkingCopy
* @see app/Http/Controllers/EvidenceController.php:424
* @route '/evidence/{evidence}/derivatives'
*/
issueWorkingCopy.url = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions) => {
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

    return issueWorkingCopy.definition.url
            .replace('{evidence}', parsedArgs.evidence.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EvidenceController::issueWorkingCopy
* @see app/Http/Controllers/EvidenceController.php:424
* @route '/evidence/{evidence}/derivatives'
*/
issueWorkingCopy.post = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: issueWorkingCopy.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EvidenceController::downloadDerivative
* @see app/Http/Controllers/EvidenceController.php:462
* @route '/evidence/{evidence}/derivatives/{derivative}/download'
*/
export const downloadDerivative = (args: { evidence: string | { evidence_number: string }, derivative: string | { derivative_number: string } } | [evidence: string | { evidence_number: string }, derivative: string | { derivative_number: string } ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: downloadDerivative.url(args, options),
    method: 'get',
})

downloadDerivative.definition = {
    methods: ["get","head"],
    url: '/evidence/{evidence}/derivatives/{derivative}/download',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EvidenceController::downloadDerivative
* @see app/Http/Controllers/EvidenceController.php:462
* @route '/evidence/{evidence}/derivatives/{derivative}/download'
*/
downloadDerivative.url = (args: { evidence: string | { evidence_number: string }, derivative: string | { derivative_number: string } } | [evidence: string | { evidence_number: string }, derivative: string | { derivative_number: string } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            evidence: args[0],
            derivative: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        evidence: typeof args.evidence === 'object'
        ? args.evidence.evidence_number
        : args.evidence,
        derivative: typeof args.derivative === 'object'
        ? args.derivative.derivative_number
        : args.derivative,
    }

    return downloadDerivative.definition.url
            .replace('{evidence}', parsedArgs.evidence.toString())
            .replace('{derivative}', parsedArgs.derivative.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EvidenceController::downloadDerivative
* @see app/Http/Controllers/EvidenceController.php:462
* @route '/evidence/{evidence}/derivatives/{derivative}/download'
*/
downloadDerivative.get = (args: { evidence: string | { evidence_number: string }, derivative: string | { derivative_number: string } } | [evidence: string | { evidence_number: string }, derivative: string | { derivative_number: string } ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: downloadDerivative.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EvidenceController::downloadDerivative
* @see app/Http/Controllers/EvidenceController.php:462
* @route '/evidence/{evidence}/derivatives/{derivative}/download'
*/
downloadDerivative.head = (args: { evidence: string | { evidence_number: string }, derivative: string | { derivative_number: string } } | [evidence: string | { evidence_number: string }, derivative: string | { derivative_number: string } ], options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: downloadDerivative.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EvidenceController::revokeDerivative
* @see app/Http/Controllers/EvidenceController.php:516
* @route '/evidence/{evidence}/derivatives/{derivative}/revoke'
*/
export const revokeDerivative = (args: { evidence: string | { evidence_number: string }, derivative: string | { derivative_number: string } } | [evidence: string | { evidence_number: string }, derivative: string | { derivative_number: string } ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: revokeDerivative.url(args, options),
    method: 'post',
})

revokeDerivative.definition = {
    methods: ["post"],
    url: '/evidence/{evidence}/derivatives/{derivative}/revoke',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EvidenceController::revokeDerivative
* @see app/Http/Controllers/EvidenceController.php:516
* @route '/evidence/{evidence}/derivatives/{derivative}/revoke'
*/
revokeDerivative.url = (args: { evidence: string | { evidence_number: string }, derivative: string | { derivative_number: string } } | [evidence: string | { evidence_number: string }, derivative: string | { derivative_number: string } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            evidence: args[0],
            derivative: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        evidence: typeof args.evidence === 'object'
        ? args.evidence.evidence_number
        : args.evidence,
        derivative: typeof args.derivative === 'object'
        ? args.derivative.derivative_number
        : args.derivative,
    }

    return revokeDerivative.definition.url
            .replace('{evidence}', parsedArgs.evidence.toString())
            .replace('{derivative}', parsedArgs.derivative.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EvidenceController::revokeDerivative
* @see app/Http/Controllers/EvidenceController.php:516
* @route '/evidence/{evidence}/derivatives/{derivative}/revoke'
*/
revokeDerivative.post = (args: { evidence: string | { evidence_number: string }, derivative: string | { derivative_number: string } } | [evidence: string | { evidence_number: string }, derivative: string | { derivative_number: string } ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: revokeDerivative.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EvidenceController::transferCustody
* @see app/Http/Controllers/EvidenceController.php:529
* @route '/evidence/{evidence}/custody-transfers'
*/
export const transferCustody = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: transferCustody.url(args, options),
    method: 'post',
})

transferCustody.definition = {
    methods: ["post"],
    url: '/evidence/{evidence}/custody-transfers',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EvidenceController::transferCustody
* @see app/Http/Controllers/EvidenceController.php:529
* @route '/evidence/{evidence}/custody-transfers'
*/
transferCustody.url = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions) => {
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

    return transferCustody.definition.url
            .replace('{evidence}', parsedArgs.evidence.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EvidenceController::transferCustody
* @see app/Http/Controllers/EvidenceController.php:529
* @route '/evidence/{evidence}/custody-transfers'
*/
transferCustody.post = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: transferCustody.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EvidenceController::show
* @see app/Http/Controllers/EvidenceController.php:227
* @route '/evidence/{evidence}'
*/
export const show = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/evidence/{evidence}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EvidenceController::show
* @see app/Http/Controllers/EvidenceController.php:227
* @route '/evidence/{evidence}'
*/
show.url = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions) => {
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

    return show.definition.url
            .replace('{evidence}', parsedArgs.evidence.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EvidenceController::show
* @see app/Http/Controllers/EvidenceController.php:227
* @route '/evidence/{evidence}'
*/
show.get = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EvidenceController::show
* @see app/Http/Controllers/EvidenceController.php:227
* @route '/evidence/{evidence}'
*/
show.head = (args: { evidence: string | { evidence_number: string } } | [evidence: string | { evidence_number: string } ] | string | { evidence_number: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

const EvidenceController = { index, exportMethod, verifyBatch, quickCreate, quickStore, create, store, completeIntake, viewFile, verify, issueWorkingCopy, downloadDerivative, revokeDerivative, transferCustody, show, export: exportMethod }

export default EvidenceController