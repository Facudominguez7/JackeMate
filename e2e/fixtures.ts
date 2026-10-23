import { test as base } from "@playwright/test"

import { TestData } from "./support/test-data"

/** `testData` creates what a test needs and deletes all of it when the test ends, pass or fail. */
export const test = base.extend<{ testData: TestData }>({
  testData: async ({}, provide) => {
    const testData = new TestData()
    await provide(testData)
    await testData.cleanup()
  },
})

export { expect } from "@playwright/test"
