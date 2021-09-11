import {readFile, writeFile} from 'fs/promises'

type FileReplacerCallback = (params: {
  token: string;
  captures: string[];
}) => string | null

export async function replaceInFile(
  path: string,
  regexp: RegExp,
  replacer: FileReplacerCallback
) {
  let content = (await readFile(path)).toString()

  const matches = content.match(regexp)

  if (!matches) return

  const [token, captures] = [matches[0], matches.slice(1)]

  const newVal = replacer({token, captures})

  if (!newVal) return

  content = content.replace(token, newVal)

  await writeFile(path, content)
}
