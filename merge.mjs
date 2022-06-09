import { mergeRecordFilesToTableFile, processDbs } from './cli/utils.mjs'

(async () => {
  await processDbs(mergeRecordFilesToTableFile)
})()
