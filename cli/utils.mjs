import { readFile, writeFile, readdir } from 'fs/promises';

/**
 * Get valid file name
 * See: https://stackoverflow.com/a/4814088
 * @param oldStr
 * @returns POSIX "Fully portable filenames"
 * @see https://github.com/db-man/github/blob/main/src/githubDb.js#L15
 */
export const validFilename = (oldStr) => {
  return oldStr.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export const convert = (data) => {
  const rows = JSON.parse(data)
  return rows
}

export const getDbs = async () => {
  const dbs = []
  let dbNames = []

  try {
    dbNames = await readdir(`./dbs`);
  } catch (err) {
    console.error('Failed to list db dir files, err:', err)
    return []
  }

  for (const dbName of dbNames) {
    let tables = []
    try {
      const fileContent = await readFile(`./dbs/${dbName}/columns.json`, 'utf8')
      tables = JSON.parse(fileContent)
    } catch (err) {
      console.error('Failed to read db columns data file, err:', err)
      return []
    }
    dbs.push({
      name: dbName,
      tables
    })
  }

  return dbs
}

export const processDbs = async (_processTable) => {
  const dbs = await getDbs()

  for (const db of dbs) {
    for (const table of db.tables) {
      const primaryCol = table.columns.find(col => col.primary)
      if (!primaryCol) {
        console.error('No primary key found in table!', table.columns)
        continue
      }
      console.log('start process table:', db.name, table.name, primaryCol.id)
      await _processTable(db.name, table.name, primaryCol.id);
      console.log('finish process table:', db.name, table.name)
    }
  }
}

// split one big file to small files
export const splitTableFileToRecordFiles = async (dbName, tableName, primaryKey) => {
  let data = null
  try {
    data = await readFile(`./dbs/${dbName}/${tableName}.data.json`, 'utf8')
  } catch (err) {
    console.error('Failed to read table data file, err:', err)
    return
  }

  if (!data) {
    console.error('table data file is empty!')
    return
  }

  const rows = convert(data)

  console.debug(`Split ${dbName}/${tableName} rows count: ${rows.length}`)
    
  for (const row of rows) {
    try {
      const filename = validFilename(row[primaryKey])
      await writeFile(`./dbs/${dbName}/${tableName}/${filename}.json`, JSON.stringify(row, null, '  '), 'utf8')
    } catch (err) {
      console.error('Failed to write to a record file, err:', err)
    }
  }
}

// merge multiple small files into one big file
export const mergeRecordFilesToTableFile = async (dbName, tableName, primaryKey) => {
  let files = null
  try {
    files = await readdir(`./dbs/${dbName}/${tableName}`);
  } catch (err) {
    console.error('Failed to list table dir files, err:', err)
    return
  }

  const rows = []

  for (const file of files) {
    let data = null
    try {
      data = await readFile(`./dbs/${dbName}/${tableName}/${file}`, 'utf8')
    } catch (err) {
      console.error('Failed to read record file, err:', err)
      continue
    }

    if (!data) {
      console.warn('record file is empty!')
      continue
    }

    const record = JSON.parse(data)
    rows.push(record)
  }

  // Sort by primary key
  rows.sort((a, b) => {
    return ('' + a[primaryKey]).localeCompare('' + b[primaryKey]);
  });

  try {
    await writeFile(`./dbs/${dbName}/${tableName}.data.json`, JSON.stringify(rows, null, ' '), 'utf8')
  } catch (err) {
    console.error('Failed to write to a table data file, err:', err)
    return
  }

  console.log(`Merged ${rows.length} rows into ${dbName}/${tableName} table file.`)
}

export const integrate = async (dbName, tableName, primaryKey) => {
  let files = null
  try {
    files = await readdir(`./dbs/${dbName}/${tableName}`);
  } catch (err) {
    console.error('Failed to list table dir files, err:', err)
    return
  }

  let data = null
  try {
    data = await readFile(`./dbs/${dbName}/${tableName}.data.json`, 'utf8')
  } catch (err) {
    console.error('Failed to read table data file, err:', err)
    return
  }

  if (!data) {
    console.error('table data file is empty!')
    return
  }

  const rows = convert(data)

  console.log('count:', files.length, rows.length)
}
