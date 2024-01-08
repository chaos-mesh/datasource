/*
 * Copyright 2024 Chaos Mesh Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import type { ScopedVars } from '@grafana/data'
import { getTemplateSrv } from '@grafana/runtime'
import { EventQuery } from 'types'

/**
 * Replace variables in the query with their real values.
 */
export function processVariables(query: EventQuery, scopedVars: ScopedVars) {
  for (const [k, v] of Object.entries(query)) {
    if (typeof v === 'string' && v.startsWith('$')) {
      const val = getTemplateSrv().replace(query[k], scopedVars, 'json')

      if (val.startsWith('[') && val.endsWith(']')) {
        query[k] = JSON.parse(val)
      } else {
        query[k] = val
      }
    }
  }
}

/**
 * Process multiple variables in the query.
 *
 * This function must call after `processVariables`. Multiple variables will be
 * transformed into a values array.
 */
export function processMultipleVariables(query: EventQuery) {
  // Helper function to generate all combinations of arrays
  function generateCombinations(
    properties: string[],
    currentIndex: number,
    currentCombination: EventQuery,
    result: EventQuery[]
  ) {
    if (currentIndex === properties.length) {
      // Include non-array properties in the final result
      for (const key in query) {
        if (!properties.includes(key)) {
          currentCombination[key] = query[key]
        }
      }

      result.push(currentCombination)

      return
    }

    const currentProperty = properties[currentIndex]
    const arrayValues = query[currentProperty]

    for (const item of arrayValues) {
      const newCombination = { ...currentCombination, [currentProperty]: item }

      generateCombinations(properties, currentIndex + 1, newCombination, result)
    }
  }

  // Get an array of property names with array values
  const arrayProperties = Object.keys(query).filter((key) =>
    Array.isArray(query[key])
  )

  // Generate all combinations
  const combinations: EventQuery[] = []
  generateCombinations(arrayProperties, 0, {} as EventQuery, combinations)

  return combinations
}
