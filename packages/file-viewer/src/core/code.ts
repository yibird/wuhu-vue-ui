import { extensionOf, escapeHtml } from './format'

export type CodeTokenType =
  | 'plain'
  | 'comment'
  | 'string'
  | 'number'
  | 'keyword'
  | 'literal'
  | 'builtin'
  | 'function'
  | 'tag'
  | 'attr'
  | 'operator'
  | 'decorator'
  | 'regex'
  | 'added'
  | 'removed'
  | 'meta'

export interface CodeToken {
  text: string
  type: CodeTokenType
}

interface LanguageDefinition {
  keywords?: string[]
  literals?: string[]
  builtins?: string[]
  lineComments?: string[]
  blockComments?: Array<[string, string]>
  strings?: string[]
  caseInsensitive?: boolean
  markup?: boolean
  css?: boolean
  pythonTriple?: boolean
  diff?: boolean
  json?: boolean
}

const C_LIKE_KEYWORDS =
  'abstract asserts async await break case catch class const continue debugger declare default delete do else enum export extends finally for from function get if implements import in infer instanceof interface is keyof let namespace new of override private protected public readonly return satisfies set static super switch this throw try type typeof var void while with yield'
    .split(' ')
    .filter(Boolean)

const LANGUAGE_DEFINITIONS: Record<string, LanguageDefinition> = {
  javascript: {
    keywords: C_LIKE_KEYWORDS,
    literals: ['true', 'false', 'null', 'undefined', 'NaN', 'Infinity'],
    builtins:
      'Array Boolean Date Error JSON Map Math Number Object Promise Proxy Reflect RegExp Set String Symbol WeakMap WeakSet BigInt Intl console document window globalThis fetch setTimeout clearTimeout setInterval clearInterval queueMicrotask structuredClone URL URLSearchParams localStorage sessionStorage'.split(
        ' ',
      ),
    lineComments: ['//'],
    blockComments: [['/*', '*/']],
    strings: ["'", '"', '`'],
  },
  typescript: {
    keywords: C_LIKE_KEYWORDS,
    literals: ['true', 'false', 'null', 'undefined', 'NaN', 'Infinity'],
    builtins:
      'Array Boolean Date Error JSON Map Math Number Object Promise Proxy Reflect RegExp Set String Symbol WeakMap WeakSet BigInt Intl console document window globalThis fetch setTimeout clearTimeout setInterval clearInterval queueMicrotask structuredClone URL URLSearchParams localStorage sessionStorage Record Partial Required Readonly Pick Omit Exclude Extract PromiseLike Awaited'.split(
        ' ',
      ),
    lineComments: ['//'],
    blockComments: [['/*', '*/']],
    strings: ["'", '"', '`'],
  },
  vue: {
    keywords: C_LIKE_KEYWORDS,
    literals: ['true', 'false', 'null', 'undefined'],
    builtins:
      'defineProps defineEmits defineExpose defineOptions withDefaults ref computed watch watchEffect onMounted onUnmounted nextTick'.split(
        ' ',
      ),
    lineComments: ['//'],
    blockComments: [['/*', '*/']],
    strings: ["'", '"', '`'],
    markup: true,
  },
  html: {
    lineComments: [],
    blockComments: [['<!--', '-->']],
    markup: true,
  },
  xml: {
    lineComments: [],
    blockComments: [['<!--', '-->']],
    markup: true,
  },
  json: {
    literals: ['true', 'false', 'null'],
    lineComments: ['//'],
    blockComments: [['/*', '*/']],
    strings: ['"'],
    json: true,
  },
  css: {
    keywords: [
      'important',
      'media',
      'supports',
      'keyframes',
      'font-face',
      'import',
      'charset',
      'namespace',
      'from',
      'to',
      'and',
      'or',
      'not',
      'only',
    ],
    literals: [
      'inherit',
      'initial',
      'unset',
      'revert',
      'none',
      'auto',
      'transparent',
      'currentColor',
    ],
    lineComments: [],
    blockComments: [['/*', '*/']],
    strings: ["'", '"'],
    css: true,
  },
  scss: {
    keywords: [
      'mixin',
      'include',
      'extend',
      'function',
      'return',
      'if',
      'else',
      'each',
      'for',
      'while',
      'use',
      'forward',
      'import',
      'media',
      'supports',
      'at-root',
      'debug',
      'warn',
      'error',
    ],
    literals: ['true', 'false', 'null', 'auto', 'none', 'inherit', 'initial', 'unset'],
    lineComments: ['//'],
    blockComments: [['/*', '*/']],
    strings: ["'", '"'],
    css: true,
  },
  python: {
    keywords:
      'False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda match case nonlocal not or pass raise return try while with yield'.split(
        ' ',
      ),
    literals: ['False', 'None', 'True', 'self', 'cls'],
    builtins:
      'print len range int str float list dict set tuple bool bytes bytearray open isinstance issubclass super object type enumerate zip map filter sorted sum min max abs round input repr hash id iter next Exception ValueError TypeError KeyError IndexError RuntimeError'.split(
        ' ',
      ),
    lineComments: ['#'],
    strings: ["'", '"'],
    pythonTriple: true,
  },
  java: {
    keywords:
      'abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while var record sealed permits yield'.split(
        ' ',
      ),
    literals: ['true', 'false', 'null'],
    builtins:
      'System String Integer Long Double Float Boolean Character Object List Map Set ArrayList HashMap HashSet StringBuilder Thread Exception RuntimeException Override'.split(
        ' ',
      ),
    lineComments: ['//'],
    blockComments: [['/*', '*/']],
    strings: ["'", '"'],
  },
  kotlin: {
    keywords:
      'as break class continue do else false for fun if in interface is null object package return super this throw true try typealias typeof val var when while by catch constructor delegate dynamic field file finally get import init param property receiver set setparam where actual abstract annotation companion const crossinline data enum expect external final infix inline inner internal lateinit noinline open operator out override private protected public reified sealed suspend tailrec vararg'.split(
        ' ',
      ),
    literals: ['true', 'false', 'null'],
    builtins: [
      'println',
      'print',
      'listOf',
      'mapOf',
      'setOf',
      'mutableListOf',
      'mutableMapOf',
      'String',
      'Int',
      'Long',
      'Double',
      'Boolean',
      'Any',
      'Unit',
      'Nothing',
    ],
    lineComments: ['//'],
    blockComments: [['/*', '*/']],
    strings: ["'", '"'],
  },
  csharp: {
    keywords:
      'abstract as base bool break byte case catch char checked class const continue decimal default delegate do double else enum event explicit extern false finally fixed float for foreach goto if implicit in int interface internal is lock long namespace new null object operator out override params private protected public readonly ref return sbyte sealed short sizeof stackalloc static string struct switch this throw true try typeof uint ulong unchecked unsafe ushort using virtual void volatile while async await record init get set partial where yield var'.split(
        ' ',
      ),
    literals: ['true', 'false', 'null'],
    builtins: [
      'Console',
      'String',
      'Int32',
      'List',
      'Dictionary',
      'Task',
      'Exception',
      'Math',
      'DateTime',
      'Guid',
    ],
    lineComments: ['//'],
    blockComments: [['/*', '*/']],
    strings: ["'", '"'],
  },
  cpp: {
    keywords:
      'alignas alignof and and_eq asm auto bitand bitor bool break case catch char char16_t char32_t class compl concept const constexpr const_cast continue decltype default delete do double dynamic_cast else enum explicit export extern false float for friend goto if inline int long mutable namespace new noexcept not not_eq nullptr operator or or_eq private protected public register reinterpret_cast return short signed sizeof static static_assert static_cast struct switch template this thread_local throw true try typedef typeid typename union unsigned using virtual void volatile wchar_t while override final'.split(
        ' ',
      ),
    literals: ['true', 'false', 'nullptr', 'NULL'],
    builtins: ['std', 'string', 'vector', 'map', 'set', 'cout', 'cin', 'endl', 'printf', 'size_t'],
    lineComments: ['//'],
    blockComments: [['/*', '*/']],
    strings: ["'", '"'],
  },
  c: {
    keywords:
      'auto break case char const continue default do double else enum extern float for goto if inline int long register restrict return short signed sizeof static struct switch typedef union unsigned void volatile while _Bool _Complex'.split(
        ' ',
      ),
    literals: ['true', 'false', 'NULL'],
    builtins: [
      'printf',
      'scanf',
      'malloc',
      'free',
      'memcpy',
      'strlen',
      'size_t',
      'FILE',
      'stdin',
      'stdout',
      'stderr',
    ],
    lineComments: ['//'],
    blockComments: [['/*', '*/']],
    strings: ["'", '"'],
  },
  go: {
    keywords:
      'break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var'.split(
        ' ',
      ),
    literals: ['true', 'false', 'nil', 'iota'],
    builtins: [
      'append',
      'cap',
      'close',
      'complex',
      'copy',
      'delete',
      'imag',
      'len',
      'make',
      'new',
      'panic',
      'print',
      'println',
      'real',
      'recover',
      'string',
      'int',
      'int64',
      'float64',
      'bool',
      'byte',
      'rune',
      'error',
      'fmt',
      'context',
      'sync',
    ],
    lineComments: ['//'],
    blockComments: [['/*', '*/']],
    strings: ["'", '"', '`'],
  },
  rust: {
    keywords:
      'as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type unsafe use where while yield'.split(
        ' ',
      ),
    literals: ['true', 'false', 'None', 'Some', 'Ok', 'Err'],
    builtins: [
      'Vec',
      'Option',
      'Result',
      'String',
      'Box',
      'Rc',
      'Arc',
      'HashMap',
      'HashSet',
      'println',
      'print',
      'format',
      'vec',
      'assert',
      'assert_eq',
      'panic',
      'usize',
      'isize',
      'u8',
      'u16',
      'u32',
      'u64',
      'i8',
      'i16',
      'i32',
      'i64',
      'f32',
      'f64',
      'bool',
      'str',
    ],
    lineComments: ['//'],
    blockComments: [['/*', '*/']],
    strings: ['"'],
  },
  swift: {
    keywords:
      'associatedtype class deinit enum extension fileprivate func import init inout internal let open operator private protocol public static struct subscript typealias var break case continue default defer do else fallthrough for guard if in repeat return switch where while as any catch false is nil rethrows super self Self throw throws true try'.split(
        ' ',
      ),
    literals: ['true', 'false', 'nil'],
    builtins: [
      'print',
      'String',
      'Int',
      'Double',
      'Bool',
      'Array',
      'Dictionary',
      'Set',
      'Optional',
      'Result',
      'Error',
    ],
    lineComments: ['//'],
    blockComments: [['/*', '*/']],
    strings: ['"'],
  },
  php: {
    keywords:
      'abstract and array as break callable case catch class clone const continue declare default do echo else elseif empty enddeclare endfor endforeach endif endswitch endwhile eval exit extends final finally fn for foreach function global goto if implements include include_once instanceof insteadof interface isset list match namespace new or print private protected public readonly require require_once return static switch throw trait try unset use var while xor yield'.split(
        ' ',
      ),
    literals: ['true', 'false', 'null', 'TRUE', 'FALSE', 'NULL'],
    builtins: [
      'array',
      'count',
      'strlen',
      'str_replace',
      'explode',
      'implode',
      'json_encode',
      'json_decode',
      'var_dump',
      'print_r',
      'isset',
      'empty',
    ],
    lineComments: ['//', '#'],
    blockComments: [['/*', '*/']],
    strings: ["'", '"'],
  },
  ruby: {
    keywords:
      'alias and begin break case class def defined do else elsif end ensure false for if in module next nil not or redo rescue retry return self super then true undef unless until when while yield require require_relative attr_accessor attr_reader attr_writer'.split(
        ' ',
      ),
    literals: ['true', 'false', 'nil', 'self'],
    builtins: [
      'puts',
      'print',
      'p',
      'gets',
      'Array',
      'Hash',
      'String',
      'Integer',
      'Float',
      'Symbol',
      'Range',
    ],
    lineComments: ['#'],
    strings: ["'", '"'],
  },
  shell: {
    keywords:
      'if then else elif fi case esac for while until do done function in select time coproc break continue return exit export local readonly declare typeset unset shift source alias echo printf cd pwd read test set trap wait kill'.split(
        ' ',
      ),
    literals: ['true', 'false'],
    builtins: [
      'grep',
      'sed',
      'awk',
      'cat',
      'ls',
      'mkdir',
      'rm',
      'cp',
      'mv',
      'curl',
      'git',
      'pnpm',
      'npm',
      'node',
      'python',
    ],
    lineComments: ['#'],
    strings: ["'", '"', '`'],
  },
  powershell: {
    keywords:
      'begin break catch class continue data define do dynamicparam else elseif end enum exit filter finally for foreach from function if in param process return switch throw trap try until using var while'.split(
        ' ',
      ),
    literals: ['$true', '$false', '$null'],
    lineComments: ['#'],
    blockComments: [['<#', '#>']],
    strings: ["'", '"'],
    caseInsensitive: true,
  },
  sql: {
    keywords:
      'add all alter and any as asc backup between by case check column constraint create database default delete desc distinct drop else end exists foreign from full group having in index inner insert into is join key left like limit not null offset on or order outer primary procedure references right rollback select set table top transaction trigger union unique update values view when where'.split(
        ' ',
      ),
    literals: ['null', 'true', 'false'],
    builtins: [
      'count',
      'sum',
      'avg',
      'min',
      'max',
      'coalesce',
      'cast',
      'convert',
      'now',
      'current_date',
      'current_timestamp',
    ],
    lineComments: ['--'],
    blockComments: [['/*', '*/']],
    strings: ["'", '"', '`'],
    caseInsensitive: true,
  },
  yaml: {
    literals: ['true', 'false', 'null', 'yes', 'no', 'on', 'off'],
    lineComments: ['#'],
    strings: ["'", '"'],
  },
  toml: {
    literals: ['true', 'false'],
    lineComments: ['#'],
    strings: ["'", '"'],
  },
  ini: {
    literals: ['true', 'false'],
    lineComments: ['#', ';'],
    strings: ["'", '"'],
  },
  graphql: {
    keywords:
      'query mutation subscription fragment on type input enum scalar interface union schema extend directive implements'.split(
        ' ',
      ),
    literals: ['true', 'false', 'null'],
    lineComments: ['#'],
    strings: ['"'],
  },
  docker: {
    keywords:
      'FROM RUN CMD LABEL MAINTAINER EXPOSE ENV ADD COPY ENTRYPOINT VOLUME USER WORKDIR ARG ONBUILD STOPSIGNAL HEALTHCHECK SHELL'.split(
        ' ',
      ),
    lineComments: ['#'],
    strings: ["'", '"'],
    caseInsensitive: true,
  },
  makefile: {
    keywords: [
      'include',
      'define',
      'endef',
      'ifdef',
      'ifndef',
      'ifeq',
      'ifneq',
      'else',
      'endif',
      'export',
      'unexport',
      'override',
      'private',
      'vpath',
    ],
    lineComments: ['#'],
    strings: ["'", '"'],
  },
  plaintext: {},
  diff: {
    diff: true,
  },
}

const EXTENSION_LANGUAGES: Record<string, string> = {
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  tsx: 'typescript',
  vue: 'vue',
  svelte: 'html',
  astro: 'html',
  html: 'html',
  htm: 'html',
  xhtml: 'html',
  xml: 'xml',
  xsl: 'xml',
  xslt: 'xml',
  xsd: 'xml',
  svg: 'xml',
  rss: 'xml',
  atom: 'xml',
  plist: 'xml',
  json: 'json',
  jsonc: 'json',
  json5: 'json',
  geojson: 'json',
  css: 'css',
  less: 'scss',
  scss: 'scss',
  sass: 'scss',
  styl: 'scss',
  py: 'python',
  pyw: 'python',
  java: 'java',
  kt: 'kotlin',
  kts: 'kotlin',
  scala: 'java',
  groovy: 'java',
  gradle: 'groovy',
  c: 'c',
  h: 'c',
  cc: 'cpp',
  cpp: 'cpp',
  cxx: 'cpp',
  hpp: 'cpp',
  hh: 'cpp',
  hxx: 'cpp',
  cs: 'csharp',
  fs: 'csharp',
  fsx: 'csharp',
  go: 'go',
  rs: 'rust',
  swift: 'swift',
  php: 'php',
  phtml: 'php',
  rb: 'ruby',
  erb: 'ruby',
  rake: 'ruby',
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  fish: 'shell',
  ksh: 'shell',
  awk: 'shell',
  sed: 'shell',
  ps1: 'powershell',
  psm1: 'powershell',
  bat: 'shell',
  cmd: 'shell',
  sql: 'sql',
  graphql: 'graphql',
  gql: 'graphql',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  ini: 'ini',
  cfg: 'ini',
  conf: 'ini',
  properties: 'ini',
  env: 'ini',
  tf: 'hcl',
  tfvars: 'hcl',
  hcl: 'hcl',
  diff: 'diff',
  patch: 'diff',
  dockerfile: 'docker',
  makefile: 'makefile',
  cmake: 'makefile',
}

const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  jsx: 'javascript',
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  yml: 'yaml',
  md: 'plaintext',
  markdown: 'plaintext',
  text: 'plaintext',
  txt: 'plaintext',
  plain: 'plaintext',
  html5: 'html',
  cxx: 'cpp',
  'c++': 'cpp',
  cs: 'csharp',
  'c#': 'csharp',
  kt: 'kotlin',
  golang: 'go',
}

export function detectCodeLanguage(name: string): string {
  const base = name.split(/[\\/]/).pop()?.toLowerCase() ?? ''
  if (base === 'dockerfile') return 'docker'
  if (base === 'makefile' || base === 'cmakelists.txt') return 'makefile'
  if (base === '.gitignore' || base === '.gitattributes' || base === '.env') return 'ini'

  const extension = extensionOf(name)
  return EXTENSION_LANGUAGES[extension] ?? 'plaintext'
}

export function normalizeCodeLanguage(language: string): string {
  const value = language.trim().toLowerCase()
  return LANGUAGE_ALIASES[value] ?? value
}

export function getCodeLanguageDefinition(language: string): LanguageDefinition {
  const normalized = normalizeCodeLanguage(language)
  return LANGUAGE_DEFINITIONS[normalized] ?? LANGUAGE_DEFINITIONS.plaintext ?? {}
}

const IDENTIFIER_START = /[\p{L}_$]/u
const IDENTIFIER_PART = /[\p{L}\p{N}_$-]/u
const NUMBER_PATTERN =
  /^(?:0[xX][\da-fA-F]+|0[bB][01]+|0[oO][0-7]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)(?:%|[a-zA-Z]+)?/
const CSS_COLOR_PATTERN = /^#[\da-fA-F]{3,8}\b/
const CSS_AT_RULE_PATTERN = /^@[\w-]+/

function pushToken(tokens: CodeToken[], text: string, type: CodeTokenType): void {
  if (!text) return
  const last = tokens[tokens.length - 1]
  if (last && last.type === type) last.text += text
  else tokens.push({ text, type })
}

function scanQuoted(source: string, start: number, quote: string, escape = true): number {
  let cursor = start + quote.length
  while (cursor < source.length) {
    if (escape && source[cursor] === '\\') {
      cursor += 2
      continue
    }
    if (source.startsWith(quote, cursor)) return cursor + quote.length
    cursor += 1
  }
  return source.length
}

function isIdentifierStart(character: string): boolean {
  return IDENTIFIER_START.test(character)
}

function isIdentifierPart(character: string): boolean {
  return IDENTIFIER_PART.test(character)
}

function tokenizeGeneric(source: string, definition: LanguageDefinition): CodeToken[] {
  const tokens: CodeToken[] = []
  const lineComments = definition.lineComments ?? []
  const blockComments = definition.blockComments ?? []
  const strings = definition.strings ?? ["'", '"']
  const keywords = new Set(
    (definition.keywords ?? []).map((word) =>
      definition.caseInsensitive ? word.toLowerCase() : word,
    ),
  )
  const literals = new Set(
    (definition.literals ?? []).map((word) =>
      definition.caseInsensitive ? word.toLowerCase() : word,
    ),
  )
  const builtins = new Set(
    (definition.builtins ?? []).map((word) =>
      definition.caseInsensitive ? word.toLowerCase() : word,
    ),
  )

  let cursor = 0
  while (cursor < source.length) {
    const character = source[cursor]

    const block = blockComments.find(([start]) => source.startsWith(start, cursor))
    if (block) {
      const endIndex = source.indexOf(block[1], cursor + block[0].length)
      const end = endIndex < 0 ? source.length : endIndex + block[1].length
      pushToken(tokens, source.slice(cursor, end), 'comment')
      cursor = end
      continue
    }

    const lineComment = lineComments.find((start) => source.startsWith(start, cursor))
    if (lineComment) {
      const endIndex = source.indexOf('\n', cursor)
      const end = endIndex < 0 ? source.length : endIndex
      pushToken(tokens, source.slice(cursor, end), 'comment')
      cursor = end
      continue
    }

    if (
      definition.pythonTriple &&
      (source.startsWith("'''", cursor) || source.startsWith('"""', cursor))
    ) {
      const quote = source.slice(cursor, cursor + 3)
      const end = scanQuoted(source, cursor, quote)
      pushToken(tokens, source.slice(cursor, end), 'string')
      cursor = end
      continue
    }

    if (strings.includes(character)) {
      const end = scanQuoted(source, cursor, character)
      pushToken(tokens, source.slice(cursor, end), 'string')
      cursor = end
      continue
    }

    // Bounded windows keep the regex checks O(1) instead of copying the rest
    // of the source on every token.
    const lookahead = source.slice(cursor, cursor + 128)

    if (definition.css) {
      if (character === '#') {
        const match = CSS_COLOR_PATTERN.exec(lookahead)
        if (match) {
          pushToken(tokens, match[0], 'number')
          cursor += match[0].length
          continue
        }
      }
      if (character === '@') {
        const match = CSS_AT_RULE_PATTERN.exec(lookahead)
        if (match) {
          pushToken(tokens, match[0], 'decorator')
          cursor += match[0].length
          continue
        }
      }
    }

    if (
      character === '@' &&
      cursor + 1 < source.length &&
      isIdentifierStart(source[cursor + 1] ?? '')
    ) {
      let end = cursor + 1
      while (end < source.length && isIdentifierPart(source[end] ?? '')) end += 1
      pushToken(tokens, source.slice(cursor, end), 'decorator')
      cursor = end
      continue
    }

    if (character >= '0' && character <= '9') {
      const match = NUMBER_PATTERN.exec(lookahead)
      if (match) {
        pushToken(tokens, match[0], 'number')
        cursor += match[0].length
        continue
      }
    }

    if (isIdentifierStart(character)) {
      let end = cursor + 1
      while (end < source.length && isIdentifierPart(source[end] ?? '')) end += 1
      const word = source.slice(cursor, end)
      const lookup = definition.caseInsensitive ? word.toLowerCase() : word

      let next = end
      while (next < source.length && /\s/.test(source[next] ?? '')) next += 1

      if (literals.has(lookup)) pushToken(tokens, word, 'literal')
      else if (keywords.has(lookup)) pushToken(tokens, word, 'keyword')
      else if (builtins.has(lookup)) pushToken(tokens, word, 'builtin')
      else if (source[next] === '(') pushToken(tokens, word, 'function')
      else pushToken(tokens, word, 'plain')

      cursor = end
      continue
    }

    if (/[+\-*/%=!<>&|^~?:]/.test(character)) {
      let end = cursor + 1
      while (end < source.length && /[+\-*/%=!<>&|^~?:]/.test(source[end] ?? '')) end += 1
      pushToken(tokens, source.slice(cursor, end), 'operator')
      cursor = end
      continue
    }

    // Group whitespace and punctuation into plain runs without copying the
    // remaining source for each lookup.
    let nextSpecial = cursor
    while (
      nextSpecial < source.length &&
      !/[A-Za-z0-9_$@+\-*/%=!<>&|^~?:'"`#<]/.test(source[nextSpecial] ?? '')
    ) {
      nextSpecial += 1
    }

    if (nextSpecial === cursor) {
      pushToken(tokens, character, 'plain')
      cursor += 1
    } else {
      pushToken(tokens, source.slice(cursor, nextSpecial), 'plain')
      cursor = nextSpecial
    }
  }

  return tokens
}

function tokenizeMarkup(source: string): CodeToken[] {
  const tokens: CodeToken[] = []
  let cursor = 0

  while (cursor < source.length) {
    if (source.startsWith('<!--', cursor)) {
      const endIndex = source.indexOf('-->', cursor + 4)
      const end = endIndex < 0 ? source.length : endIndex + 3
      pushToken(tokens, source.slice(cursor, end), 'comment')
      cursor = end
      continue
    }

    if (source.startsWith('<![CDATA[', cursor)) {
      const endIndex = source.indexOf(']]>', cursor + 9)
      const end = endIndex < 0 ? source.length : endIndex + 3
      pushToken(tokens, source.slice(cursor, end), 'comment')
      cursor = end
      continue
    }

    if (source.startsWith('<!', cursor)) {
      const endIndex = source.indexOf('>', cursor + 2)
      const end = endIndex < 0 ? source.length : endIndex + 1
      pushToken(tokens, source.slice(cursor, end), 'meta')
      cursor = end
      continue
    }

    if (source[cursor] === '<') {
      // Tag names are short; a bounded slice avoids copying the whole tail.
      const remainder = source.slice(cursor, cursor + 256)
      const tagMatch = /^<(\/?)([\w:.-]+)/.exec(remainder)
      if (!tagMatch) {
        pushToken(tokens, '<', 'plain')
        cursor += 1
        continue
      }

      pushToken(tokens, `<${tagMatch[1] ?? ''}`, 'plain')
      const tagName = tagMatch[2] ?? ''
      pushToken(tokens, tagName, 'tag')
      cursor += tagMatch[0].length

      let selfClosing = false
      while (cursor < source.length) {
        const character = source[cursor]
        if (character === '>') {
          pushToken(tokens, '>', 'plain')
          cursor += 1
          break
        }
        if (character === '/' && source[cursor + 1] === '>') {
          selfClosing = true
          pushToken(tokens, '/>', 'plain')
          cursor += 2
          break
        }
        if (/\s/.test(character)) {
          let end = cursor + 1
          while (end < source.length && /\s/.test(source[end] ?? '')) end += 1
          pushToken(tokens, source.slice(cursor, end), 'plain')
          cursor = end
          continue
        }
        if (character === '=') {
          pushToken(tokens, '=', 'operator')
          cursor += 1
          continue
        }
        if (character === '"' || character === "'") {
          const end = scanQuoted(source, cursor, character, false)
          pushToken(tokens, source.slice(cursor, end), 'string')
          cursor = end
          continue
        }
        if (character === '{') {
          const endIndex = source.indexOf('}', cursor + 1)
          const end = endIndex < 0 ? source.length : endIndex + 1
          pushToken(tokens, source.slice(cursor, end), 'decorator')
          cursor = end
          continue
        }
        if (/[\w:.-]/.test(character)) {
          let end = cursor + 1
          while (end < source.length && /[\w:.-]/.test(source[end] ?? '')) end += 1
          pushToken(tokens, source.slice(cursor, end), 'attr')
          cursor = end
          continue
        }

        pushToken(tokens, character, 'plain')
        cursor += 1
      }

      const normalizedTag = tagName.toLowerCase()
      if (
        !selfClosing &&
        !tagMatch[1] &&
        (normalizedTag === 'script' || normalizedTag === 'style')
      ) {
        const closing = new RegExp(`</${normalizedTag}\\s*>`, 'i')
        const remainderSource = source.slice(cursor)
        const match = closing.exec(remainderSource)
        if (match) {
          const inner = remainderSource.slice(0, match.index)
          const innerTokens =
            normalizedTag === 'script'
              ? tokenizeGeneric(inner, LANGUAGE_DEFINITIONS.javascript ?? {})
              : tokenizeGeneric(inner, LANGUAGE_DEFINITIONS.css ?? {})
          tokens.push(...innerTokens)
          cursor += match.index
        }
      }
      continue
    }

    const nextTag = source.indexOf('<', cursor)
    const end = nextTag < 0 ? source.length : nextTag
    pushToken(tokens, source.slice(cursor, end), 'plain')
    cursor = end
  }

  return tokens
}

function tokenizeDiff(source: string): CodeToken[] {
  const tokens: CodeToken[] = []
  const lines = source.split(/(\r?\n)/)

  for (const line of lines) {
    if (!line) continue
    if (line === '\n' || line === '\r\n') {
      pushToken(tokens, line, 'plain')
      continue
    }
    if (line.startsWith('+++') || line.startsWith('---')) {
      pushToken(tokens, line, 'meta')
    } else if (line.startsWith('@@')) {
      pushToken(tokens, line, 'keyword')
    } else if (line.startsWith('+')) {
      pushToken(tokens, line, 'added')
    } else if (line.startsWith('-')) {
      pushToken(tokens, line, 'removed')
    } else if (line.startsWith('diff ') || line.startsWith('index ')) {
      pushToken(tokens, line, 'meta')
    } else {
      pushToken(tokens, line, 'plain')
    }
  }

  return tokens
}

export function tokenizeCode(source: string, language = 'plaintext'): CodeToken[] {
  const definition = getCodeLanguageDefinition(language)
  if (definition.diff) return tokenizeDiff(source)
  if (definition.markup) return tokenizeMarkup(source.replace(/\r\n/g, '\n'))
  if (!definition || Object.keys(definition).length === 0) {
    return source ? [{ text: source.replace(/\r\n/g, '\n'), type: 'plain' }] : []
  }
  return tokenizeGeneric(source.replace(/\r\n/g, '\n'), definition)
}

export function tokensToLines(tokens: CodeToken[]): CodeToken[][] {
  const lines: CodeToken[][] = [[]]

  for (const token of tokens) {
    const parts = token.text.split('\n')
    for (let index = 0; index < parts.length; index += 1) {
      if (index > 0) lines.push([])
      const part = parts[index] ?? ''
      if (!part) continue
      const currentLine = lines[lines.length - 1]
      if (!currentLine) continue
      const last = currentLine[currentLine.length - 1]
      if (last && last.type === token.type) last.text += part
      else currentLine.push({ text: part, type: token.type })
    }
  }

  return lines
}

export function codeTokenClass(type: CodeTokenType): string {
  return type === 'plain' ? '' : `w-file-viewer__token w-file-viewer__token--${type}`
}

export function highlightCodeToHtml(source: string, language = 'plaintext'): string {
  const lines = tokensToLines(tokenizeCode(source, language))
  return lines
    .map((line) =>
      line
        .map((token) => {
          const escaped = escapeHtml(token.text)
          return token.type === 'plain'
            ? escaped
            : `<span class="${codeTokenClass(token.type)}">${escaped}</span>`
        })
        .join(''),
    )
    .join('\n')
}
