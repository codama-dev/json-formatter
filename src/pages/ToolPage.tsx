import {
  AlertCircle,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ClipboardCopy,
  Download,
  Eraser,
  FileJson,
  Minimize2,
  Sparkles,
  WrapText,
} from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ShareModal, isShareDismissed } from '@/components/ShareModal'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/pages/PageHeader'

const SAMPLE_JSON = JSON.stringify(
  {
    name: 'Codama',
    type: 'Software Agency',
    founded: 2020,
    services: ['Web Apps', 'Mobile Apps', 'AI Integration', 'Data & BI'],
    team: {
      size: 4,
      roles: ['CEO', 'CTO', 'Operations', 'Marketing'],
    },
    website: 'https://codama.dev',
    free_tools: [
      { name: 'QR Code Generator', url: 'https://free-qr-code.codama.dev/' },
      { name: 'JSON Formatter', url: 'https://free-json-formatter.codama.dev/' },
    ],
  },
  null,
  2
)

type IndentType = '2' | '4' | 'tab'
type ViewMode = 'text' | 'tree'

interface JsonError {
  message: string
  line?: number
  column?: number
}

function getIndentValue(indent: IndentType): string | number {
  if (indent === 'tab') return '\t'
  return Number(indent)
}

function parseJsonError(error: unknown): JsonError {
  if (error instanceof SyntaxError) {
    const msg = error.message
    // Try to extract position from error message
    // Chrome: "... at position 123"
    // Firefox: "... at line 1 column 5"
    const posMatch = msg.match(/at position (\d+)/)
    const lineColMatch = msg.match(/at line (\d+) column (\d+)/)

    if (lineColMatch) {
      return {
        message: msg,
        line: Number.parseInt(lineColMatch[1], 10),
        column: Number.parseInt(lineColMatch[2], 10),
      }
    }

    if (posMatch) {
      const position = Number.parseInt(posMatch[1], 10)
      return { message: msg, line: undefined, column: position }
    }

    return { message: msg }
  }
  return { message: String(error) }
}

function getLineNumberFromPosition(text: string, position: number): { line: number; column: number } {
  let line = 1
  let col = 1
  for (let i = 0; i < position && i < text.length; i++) {
    if (text[i] === '\n') {
      line++
      col = 1
    } else {
      col++
    }
  }
  return { line, column: col }
}

// ---- Tree View Component ----

interface TreeNodeProps {
  label: string
  value: unknown
  isLast: boolean
  depth: number
}

function JsonTreeNode({ label, value, isLast, depth }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2)

  const isObject = value !== null && typeof value === 'object'
  const isArray = Array.isArray(value)
  const entries = isObject ? Object.entries(value as Record<string, unknown>) : []

  const toggleExpand = useCallback(() => {
    if (isObject) setExpanded(prev => !prev)
  }, [isObject])

  const renderValue = (val: unknown) => {
    if (val === null) return <span className="text-orange-500 dark:text-orange-400">null</span>
    if (typeof val === 'boolean')
      return <span className="text-purple-600 dark:text-purple-400">{String(val)}</span>
    if (typeof val === 'number')
      return <span className="text-blue-600 dark:text-blue-400">{String(val)}</span>
    if (typeof val === 'string')
      return (
        <span className="text-green-700 dark:text-green-400">
          &quot;{val.length > 100 ? `${val.substring(0, 100)}...` : val}&quot;
        </span>
      )
    return null
  }

  if (!isObject) {
    return (
      <div className="flex items-start gap-1 py-0.5 pl-4">
        <span className="shrink-0 w-4" />
        <span className="font-semibold text-foreground">{label}</span>
        <span className="text-muted-foreground">:</span>
        <span className="break-all">{renderValue(value)}</span>
        {!isLast && <span className="text-muted-foreground">,</span>}
      </div>
    )
  }

  const bracketOpen = isArray ? '[' : '{'
  const bracketClose = isArray ? ']' : '}'
  const itemCount = entries.length

  return (
    <div className="py-0.5 pl-4">
      <button
        type="button"
        onClick={toggleExpand}
        className="flex items-start gap-1 text-left hover:bg-accent/30 rounded px-1 -ml-1 transition-colors"
      >
        <span className="shrink-0 mt-0.5">
          {expanded ? (
            <ChevronDown className="size-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3.5 text-muted-foreground" />
          )}
        </span>
        <span className="font-semibold text-foreground">{label}</span>
        <span className="text-muted-foreground">:</span>
        <span className="text-muted-foreground">
          {bracketOpen}
          {!expanded && (
            <span className="text-muted-foreground text-xs">
              {' '}
              {itemCount} {itemCount === 1 ? 'item' : 'items'}{' '}
            </span>
          )}
          {!expanded && bracketClose}
        </span>
        {!expanded && !isLast && <span className="text-muted-foreground">,</span>}
      </button>
      {expanded && (
        <>
          <div className="border-muted-foreground/20 border-l ml-2">
            {entries.map(([key, val], idx) => (
              <JsonTreeNode
                key={key}
                label={isArray ? String(idx) : key}
                value={val}
                isLast={idx === entries.length - 1}
                depth={depth + 1}
              />
            ))}
          </div>
          <div className="pl-4">
            <span className="text-muted-foreground">{bracketClose}</span>
            {!isLast && <span className="text-muted-foreground">,</span>}
          </div>
        </>
      )}
    </div>
  )
}

function JsonTreeView({ data }: { data: unknown }) {
  if (data === null || data === undefined) return null

  const isArray = Array.isArray(data)
  const isObject = typeof data === 'object'

  if (!isObject) {
    return (
      <div className="p-4 font-mono text-sm">
        {typeof data === 'string' && (
          <span className="text-green-700 dark:text-green-400">&quot;{data}&quot;</span>
        )}
        {typeof data === 'number' && (
          <span className="text-blue-600 dark:text-blue-400">{String(data)}</span>
        )}
        {typeof data === 'boolean' && (
          <span className="text-purple-600 dark:text-purple-400">{String(data)}</span>
        )}
      </div>
    )
  }

  const entries = Object.entries(data as Record<string, unknown>)

  return (
    <div className="p-3 font-mono text-sm overflow-auto">
      <div className="text-muted-foreground">{isArray ? '[' : '{'}</div>
      {entries.map(([key, val], idx) => (
        <JsonTreeNode
          key={key}
          label={isArray ? String(idx) : key}
          value={val}
          isLast={idx === entries.length - 1}
          depth={0}
        />
      ))}
      <div className="text-muted-foreground">{isArray ? ']' : '}'}</div>
    </div>
  )
}

// ---- Line Numbers Component ----

function LineNumbers({ count }: { count: number }) {
  const lines = []
  for (let i = 1; i <= count; i++) {
    lines.push(i)
  }
  return (
    <div
      className="select-none text-right pr-3 py-3 text-muted-foreground/50 text-xs font-mono leading-[1.625rem] border-r border-border/50 min-w-[3rem]"
      aria-hidden
    >
      {lines.map(n => (
        <div key={n}>{n}</div>
      ))}
    </div>
  )
}

// ---- Main Tool Page ----

export function ToolPage() {
  const { t } = useTranslation()
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [parsedData, setParsedData] = useState<unknown>(null)
  const [indent, setIndent] = useState<IndentType>('2')
  const [viewMode, setViewMode] = useState<ViewMode>('text')
  const [error, setError] = useState<JsonError | null>(null)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const hasTriggeredShare = useRef(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const lineCount = (text: string) => {
    if (!text) return 1
    return text.split('\n').length
  }

  const triggerShareIfNeeded = useCallback(() => {
    if (!hasTriggeredShare.current && !isShareDismissed()) {
      hasTriggeredShare.current = true
      setTimeout(() => setShareOpen(true), 600)
    }
  }, [])

  const handleFormat = useCallback(() => {
    if (!input.trim()) return
    try {
      const parsed = JSON.parse(input)
      const formatted = JSON.stringify(parsed, null, getIndentValue(indent))
      setOutput(formatted)
      setParsedData(parsed)
      setError(null)
      setIsValid(true)
      triggerShareIfNeeded()
    } catch (e) {
      const err = parseJsonError(e)
      if (err.column !== undefined && err.line === undefined) {
        const pos = getLineNumberFromPosition(input, err.column)
        err.line = pos.line
        err.column = pos.column
      }
      setError(err)
      setIsValid(false)
      setOutput('')
      setParsedData(null)
    }
  }, [input, indent, triggerShareIfNeeded])

  const handleMinify = useCallback(() => {
    if (!input.trim()) return
    try {
      const parsed = JSON.parse(input)
      const minified = JSON.stringify(parsed)
      setOutput(minified)
      setParsedData(parsed)
      setError(null)
      setIsValid(true)
      triggerShareIfNeeded()
    } catch (e) {
      const err = parseJsonError(e)
      if (err.column !== undefined && err.line === undefined) {
        const pos = getLineNumberFromPosition(input, err.column)
        err.line = pos.line
        err.column = pos.column
      }
      setError(err)
      setIsValid(false)
      setOutput('')
      setParsedData(null)
    }
  }, [input, triggerShareIfNeeded])

  const handleValidate = useCallback(() => {
    if (!input.trim()) return
    try {
      const parsed = JSON.parse(input)
      setParsedData(parsed)
      setError(null)
      setIsValid(true)
      if (!output) {
        setOutput(JSON.stringify(parsed, null, getIndentValue(indent)))
      }
      toast.success(t('tool.valid'), {
        icon: <CheckCircle className="size-4 text-green-500" />,
      })
    } catch (e) {
      const err = parseJsonError(e)
      if (err.column !== undefined && err.line === undefined) {
        const pos = getLineNumberFromPosition(input, err.column)
        err.line = pos.line
        err.column = pos.column
      }
      setError(err)
      setIsValid(false)
      setOutput('')
      setParsedData(null)
    }
  }, [input, output, indent, t])

  const handleCopy = useCallback(async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      toast.success(t('tool.copied'))
    } catch {
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = output
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      toast.success(t('tool.copied'))
    }
  }, [output, t])

  const handleDownload = useCallback(() => {
    if (!output) return
    const blob = new Blob([output], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'formatted.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(t('tool.downloaded'))
  }, [output, t])

  const handleClear = useCallback(() => {
    setInput('')
    setOutput('')
    setParsedData(null)
    setError(null)
    setIsValid(null)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleLoadSample = useCallback(() => {
    setInput(SAMPLE_JSON)
    setError(null)
    setIsValid(null)
    setOutput('')
    setParsedData(null)
  }, [])

  const inputLineCount = lineCount(input)
  const outputLineCount = lineCount(output)

  return (
    <div className="space-y-0">
      <PageHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Action Bar */}
        <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            onClick={handleFormat}
            disabled={!input.trim()}
            className="gap-1.5"
          >
            <Sparkles className="size-4" aria-hidden />
            {t('tool.format')}
          </Button>
          <Button
            onClick={handleMinify}
            disabled={!input.trim()}
            variant="secondary"
            className="gap-1.5"
          >
            <Minimize2 className="size-4" aria-hidden />
            {t('tool.minify')}
          </Button>
          <Button
            onClick={handleValidate}
            disabled={!input.trim()}
            variant="secondary"
            className="gap-1.5"
          >
            <CheckCircle className="size-4" aria-hidden />
            {t('tool.validate')}
          </Button>

          <div className="hidden sm:block h-6 w-px bg-border mx-1" aria-hidden />

          <Select value={indent} onValueChange={(v: IndentType) => setIndent(v)}>
            <SelectTrigger size="sm" className="w-auto gap-1.5">
              <WrapText className="size-3.5 text-muted-foreground" aria-hidden />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">{t('tool.indent2spaces')}</SelectItem>
              <SelectItem value="4">{t('tool.indent4spaces')}</SelectItem>
              <SelectItem value="tab">{t('tool.indentTab')}</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1" />

          <Button
            onClick={handleLoadSample}
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
          >
            <FileJson className="size-3.5" aria-hidden />
            {t('tool.sampleJson')}
          </Button>
          <Button
            onClick={handleClear}
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            disabled={!input && !output}
          >
            <Eraser className="size-3.5" aria-hidden />
            {t('tool.clear')}
          </Button>
        </div>

        {/* Error Bar */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
            <AlertCircle className="size-4 shrink-0" aria-hidden />
            <p className="text-sm font-medium">
              {error.line !== undefined && error.column !== undefined
                ? t('tool.errorAt', { line: error.line, column: error.column })
                : t('tool.invalid')}
              {' - '}
              <span className="font-normal opacity-80">{error.message}</span>
            </p>
          </div>
        )}

        {/* Main Panels */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Input Panel */}
          <div className="flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5">
              <label
                htmlFor="json-input"
                className="text-sm font-semibold text-foreground"
              >
                {t('tool.input.label')}
              </label>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{input.length} {t('tool.chars')}</span>
                <span className="text-muted-foreground/30">|</span>
                <span>{inputLineCount} {t('tool.lines')}</span>
              </div>
            </div>
            <div className="flex flex-1 min-h-[350px] sm:min-h-[450px]">
              <LineNumbers count={inputLineCount} />
              <textarea
                ref={inputRef}
                id="json-input"
                value={input}
                onChange={e => {
                  setInput(e.target.value)
                  if (error) {
                    setError(null)
                    setIsValid(null)
                  }
                }}
                placeholder={t('tool.input.placeholder')}
                className={cn(
                  'flex-1 resize-none bg-transparent p-3 font-mono text-sm leading-[1.625rem] outline-none placeholder:text-muted-foreground/40',
                  error && 'text-red-600 dark:text-red-400'
                )}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
              />
            </div>
          </div>

          {/* Output Panel */}
          <div className="flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5">
              <div className="flex items-center gap-1">
                {/* View mode tabs */}
                <button
                  type="button"
                  onClick={() => setViewMode('text')}
                  className={cn(
                    'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                    viewMode === 'text'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t('tool.textView')}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('tree')}
                  disabled={!parsedData}
                  className={cn(
                    'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                    viewMode === 'tree'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                    !parsedData && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {t('tool.treeView')}
                </button>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  onClick={handleCopy}
                  disabled={!output}
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground h-7 px-2"
                >
                  <ClipboardCopy className="size-3.5" aria-hidden />
                  {t('tool.copy')}
                </Button>
                <Button
                  onClick={handleDownload}
                  disabled={!output}
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground h-7 px-2"
                >
                  <Download className="size-3.5" aria-hidden />
                  {t('tool.download')}
                </Button>
              </div>
            </div>

            <div className="flex-1 min-h-[350px] sm:min-h-[450px] overflow-auto">
              {viewMode === 'text' ? (
                <div className="flex h-full">
                  {output && <LineNumbers count={outputLineCount} />}
                  <textarea
                    readOnly
                    value={output}
                    className="flex-1 resize-none bg-transparent p-3 font-mono text-sm leading-[1.625rem] outline-none text-foreground placeholder:text-muted-foreground/40"
                    placeholder={t('tool.output.label')}
                    spellCheck={false}
                  />
                </div>
              ) : parsedData ? (
                <JsonTreeView data={parsedData} />
              ) : (
                <div className="flex h-full items-center justify-center p-8">
                  <p className="text-sm text-muted-foreground">{t('tool.output.label')}</p>
                </div>
              )}
            </div>

            {/* Status bar */}
            {isValid !== null && (
              <div
                className={cn(
                  'flex items-center gap-2 border-t px-4 py-2 text-xs font-medium',
                  isValid
                    ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/50 dark:text-green-400'
                    : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400'
                )}
              >
                {isValid ? (
                  <>
                    <Check className="size-3.5" aria-hidden />
                    {t('tool.valid')}
                  </>
                ) : (
                  <>
                    <AlertCircle className="size-3.5" aria-hidden />
                    {t('tool.invalid')}
                  </>
                )}
                {output && (
                  <>
                    <span className="text-current/30 mx-1">|</span>
                    <span className="opacity-70">
                      {output.length} {t('tool.chars')}
                    </span>
                    <span className="text-current/30">|</span>
                    <span className="opacity-70">
                      {outputLineCount} {t('tool.lines')}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ShareModal open={shareOpen} onOpenChange={setShareOpen} showDismissOption />
    </div>
  )
}
