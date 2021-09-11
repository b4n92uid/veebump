import {readFile, writeFile} from 'jsonfile'

type JsonReplacerCallback = (params: string) => string | null

export async function replaceInJson(
  path: string,
  field: string,
  replacer: JsonReplacerCallback
) {
  const jsonFile = await readFile(path)

  const nextVer = replacer(jsonFile[field])

  if (nextVer) {
    jsonFile[field] = nextVer
    await writeFile(path, jsonFile, {spaces: 2})
  }
}
