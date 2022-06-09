import { processDbs, splitTableFileToRecordFiles } from './cli/utils.mjs'

(async () => {
  await processDbs(splitTableFileToRecordFiles)
})()
