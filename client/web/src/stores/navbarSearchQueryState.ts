// NOTE (@fkling): The use of 'zustand' in this codebase should be considered as
// experimental until we had more time to evaluate this library. General
// application of this library is not recommended at this point.
// It is used here because it solves a very real performance issue
// (see https://github.com/sourcegraph/sourcegraph/issues/21200).
import create from 'zustand'

import { FilterType } from '@sourcegraph/shared/src/search/query/filters'
import { appendFilter, updateFilter } from '@sourcegraph/shared/src/search/query/transformer'
import { filterExists } from '@sourcegraph/shared/src/search/query/validate'
import { Settings, SettingsCascadeOrError } from '@sourcegraph/shared/src/settings/settings'

import { parseSearchURL } from '../search'
import { QueryState, SubmitSearchParameters, submitSearch, toggleSubquery, canSubmitSearch } from '../search/helpers'
import { defaultCaseSensitiveFromSettings } from '../util/settings'

type QueryStateUpdate = QueryState | ((queryState: QueryState) => QueryState)

export type QueryUpdate =
    | /**
     * Appends a filter to the current search query. If the filter is unique and
     * already exists in the query, the update is ignored.
     */
    {
          type: 'appendFilter'
          field: FilterType
          value: string
          /**
           * If true, the filter will only be appended a filter with the same name
           * doesn't already exist in the query.
           */
          unique?: true
      }
    /**
     * Appends or updates a filter to/in the query.
     */
    | {
          type: 'updateOrAppendFilter'
          field: FilterType
          value: string
      }
    // Only exists for the filters from the search sidebar since they come in
    // filter:value form. Should not be used elsewhere.
    | {
          type: 'toggleSubquery'
          value: string
      }

function updateQuery(query: string, updates: QueryUpdate[]): string {
    return updates.reduce((query, update) => {
        switch (update.type) {
            case 'appendFilter':
                if (!update.unique || !filterExists(query, update.field)) {
                    return appendFilter(query, update.field, update.value)
                }
                break
            case 'updateOrAppendFilter':
                return updateFilter(query, update.field, update.value)
            case 'toggleSubquery':
                return toggleSubquery(query, update.value)
        }
        return query
    }, query)
}

export interface NavbarQueryState {
    // DATA
    /**
     * The current seach query and auxiliary information needed by the
     * MonacoQueryInput component. You most likely don't have to read this value
     * directly.
     * See {@link QueryState} for more information.
     */
    queryState: QueryState
    searchCaseSensitivity: boolean

    // ACTIONS
    /**
     * setQueryState updates `queryState`
     */
    setQueryState: (queryState: QueryStateUpdate) => void

    /**
     * submitSearch makes it possible to submit a new search query by updating
     * the current query via update directives. It won't submit the query if it
     * is empty.
     * Note that this won't update `queryState` directly.
     */
    submitSearch: (parameters: Omit<SubmitSearchParameters, 'query' | 'caseSensitive'>, updates?: QueryUpdate[]) => void

    setSearchCaseSensitivity: (caseSensitive: boolean) => void
}

export const useNavbarQueryState = create<NavbarQueryState>((set, get) => ({
    queryState: { query: '' },
    searchCaseSensitivity: false,

    setQueryState: queryStateUpdate => {
        if (typeof queryStateUpdate === 'function') {
            set({ queryState: queryStateUpdate(get().queryState) })
        } else {
            set({ queryState: queryStateUpdate })
        }
    },

    submitSearch: (parameters, updates = []) => {
        const {
            queryState: { query },
            searchCaseSensitivity: caseSensitive,
        } = get()
        const updatedQuery = updateQuery(query, updates)
        if (canSubmitSearch(query, parameters.selectedSearchContextSpec)) {
            submitSearch({ ...parameters, query: updatedQuery, caseSensitive })
        }
    },

    setSearchCaseSensitivity: (caseSensitive: boolean) => {
        set({ searchCaseSensitivity: caseSensitive })
    },
}))

/**
 * Update or initialize query state related data from URL search parameters
 */
export function setQueryStateFromURL(urlParameters: string): void {
    // This will be updated with the default in settings when the web app mounts.
    const parsedSearchURL = parseSearchURL(urlParameters)
    if (parsedSearchURL.query) {
        // Only update flags if the URL contains a search query.
        useNavbarQueryState.setState({
            searchCaseSensitivity: parsedSearchURL.caseSensitive,
        })
    }
}

/**
 * Update or initialize query state related data from settings
 */
export function setQueryStateFromSettings(settings: SettingsCascadeOrError<Settings>): void {
    const caseSensitive = defaultCaseSensitiveFromSettings(settings)
    if (caseSensitive) {
        useNavbarQueryState.setState({ searchCaseSensitivity: caseSensitive })
    }
}
