export const mockBugsStore = {
  async submit({ description, consoleLogs, screenshotFile }) {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[mock] Bug report submitted', {
        description,
        consoleLogs: consoleLogs?.slice(0, 200),
        screenshot: screenshotFile?.name,
      })
    }
    return { data: { id: `mock-bug-${Date.now()}` }, error: null }
  },
}
