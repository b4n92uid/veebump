import {Command, flags} from '@oclif/command'
import {inc as incSemver, ReleaseType} from 'semver'

import {replaceInJson} from './replacer/json'
import {replaceInFile} from './replacer/text'

interface ProcessBind {
  [index: string]: (bump: ReleaseType, filepath?: string) => Promise<void>;
}

class Veebump extends Command {
  static description = 'Increment version number on all or specified files'

  static flags = {
    help: flags.help({char: 'h'}),

    type: flags.string({
      char: 't',
      multiple: true,
      options: ['package', 'gradle', 'plist'],
      default: ['package', 'gradle', 'plist'],
    }),

    file: flags.string({
      char: 'f',
      multiple: true,
    }),
  }

  static args = [
    {
      name: 'type',
      options: [
        'major',
        'premajor',
        'minor',
        'preminor',
        'patch',
        'prepatch',
        'prerelease',
      ],
      default: 'minor',
    },
  ]

  async run() {
    const {flags, args} = this.parse(Veebump)

    const processMap: ProcessBind = {
      package: this.replacePackage,
      gradle: this.replaceGradle,
      plist: this.replacePlist,
    }

    flags.type.forEach((t, i) => {
      const path = flags.file ? flags.file[i] : undefined
      processMap[t](args.type, path)
    })
  }

  async replacePackage(bump: ReleaseType, filepath = './package.json') {
    await replaceInJson(filepath, 'version', version => {
      return incSemver(version, bump)
    })
  }

  async replaceGradle(
    bump: ReleaseType,
    filepath = './android/app/build.gradle'
  ) {
    await replaceInFile(filepath, /versionCode (\d+)/, ({token, captures}) => {
      const nextVer = parseInt(captures[0], 10) + 1
      return token.replace(captures[0], `${nextVer}`)
    })

    await replaceInFile(
      filepath,
      /versionName "([\da-z.-]+)"/,
      ({token, captures}) => {
        const nextVer = incSemver(captures[0], bump)
        return token.replace(captures[0], `${nextVer}`)
      }
    )
  }

  async replacePlist(bump: ReleaseType, filepath = './ios/App/App/Info.plist') {
    await replaceInFile(
      filepath,
      /<key>CFBundleShortVersionString<\/key>\s+<string>([\da-z.-]+)<\/string>/,
      ({token, captures}) => {
        const nextVer = incSemver(captures[0], bump)
        return token.replace(captures[0], `${nextVer}`)
      }
    )

    await replaceInFile(
      filepath,
      /<key>CFBundleVersion<\/key>\s+<string>(\d+)<\/string>/,
      ({token, captures}) => {
        const nextVer = parseInt(captures[0], 10) + 1
        return token.replace(captures[0], `${nextVer}`)
      }
    )
  }
}

export = Veebump
