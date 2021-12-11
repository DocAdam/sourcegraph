import { gql } from '@sourcegraph/shared/src/graphql/graphql'

export const GET_BATCH_CHANGE = gql`
    query GetBatchChange($namespace: ID!, $name: String!) {
        batchChange(namespace: $namespace, name: $name) {
            ...EditBatchChangeFields
        }
    }

    fragment EditBatchChangeFields on BatchChange {
        __typename
        id
        url
        name
        namespace {
            id
            namespaceName
            url
        }
        description

        currentSpec {
            id
            originalInput
        }
    }
`

export const EXECUTE_BATCH_SPEC = gql`
    mutation ExecuteBatchSpec($batchSpec: ID!) {
        executeBatchSpec(batchSpec: $batchSpec) {
            id
            namespace {
                url
            }
        }
    }
`

// TODO: This mutation will not be used until we support creating + executing a new batch
// spec on an existing non-draft batch change. Use `CREATE_EMPTY_BATCH_CHANGE` and
// `REPLACE_BATCH_SPEC_INPUT` for draft batch changes.
//
// export const CREATE_BATCH_SPEC_FROM_RAW = gql`
//     mutation CreateBatchSpecFromRaw($spec: String!, $noCache: Boolean!, $batchChange: ID) {
//         createBatchSpecFromRaw(batchSpec: $spec, noCache: $noCache, batchChange: $batchChange) {
//             id
//         }
//     }
// `

export const REPLACE_BATCH_SPEC_INPUT = gql`
    mutation ReplaceBatchSpecInput($previousSpec: ID!, $spec: String!, $noCache: Boolean!) {
        replaceBatchSpecInput(previousSpec: $previousSpec, batchSpec: $spec, noCache: $noCache) {
            id
        }
    }
`

export const WORKSPACE_RESOLUTION_STATUS = gql`
    query WorkspaceResolutionStatus($batchSpec: ID!) {
        node(id: $batchSpec) {
            __typename
            ... on BatchSpec {
                workspaceResolution {
                    state
                    failureMessage
                }
            }
        }
    }
`

export const WORKSPACES = gql`
    query BatchSpecWorkspacesPreview($batchSpec: ID!, $first: Int, $after: String) {
        node(id: $batchSpec) {
            __typename
            ... on BatchSpec {
                workspaceResolution {
                    __typename
                    workspaces(first: $first, after: $after) {
                        __typename
                        totalCount
                        pageInfo {
                            hasNextPage
                            endCursor
                        }
                        nodes {
                            ...PreviewBatchSpecWorkspaceFields
                        }
                    }
                }
            }
        }
    }

    fragment PreviewBatchSpecWorkspaceFields on BatchSpecWorkspace {
        __typename
        repository {
            __typename
            id
            name
            url
            defaultBranch {
                __typename
                id
            }
        }
        ignored
        unsupported
        branch {
            __typename
            id
            abbrevName
            displayName
            target {
                __typename
                oid
            }
            url
        }
        path
        searchResultPaths
        cachedResultFound
    }
`

export const IMPORTING_CHANGESETS = gql`
    query BatchSpecImportingChangesets($batchSpec: ID!, $first: Int, $after: String) {
        node(id: $batchSpec) {
            __typename
            ... on BatchSpec {
                importingChangesets(first: $first, after: $after) {
                    __typename
                    totalCount
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                    nodes {
                        __typename
                        ... on VisibleChangesetSpec {
                            ...PreviewBatchSpecImportingChangesetFields
                        }
                        ... on HiddenChangesetSpec {
                            ...PreviewBatchSpecImportingHiddenChangesetFields
                        }
                    }
                }
            }
        }
    }

    fragment PreviewBatchSpecImportingChangesetFields on VisibleChangesetSpec {
        __typename
        id
        description {
            __typename
            ... on ExistingChangesetReference {
                baseRepository {
                    name
                    url
                }
                externalID
            }
        }
    }

    fragment PreviewBatchSpecImportingHiddenChangesetFields on HiddenChangesetSpec {
        __typename
        id
    }
`
