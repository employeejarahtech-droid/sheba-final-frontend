import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface QuickPhrasePickerProps {
  options: string[]
  onPick: (phrase: string) => void
  placeholder?: string
  className?: string
}

/** Small "ready-made text" dropdown. It's a one-shot insert action, not a
 *  persistent field value, so it always resets back to its placeholder after
 *  a pick (forced via `key` remount) instead of showing the last choice as
 *  "selected". */
export function QuickPhrasePicker({ options, onPick, placeholder = '+ Quick pick', className }: QuickPhrasePickerProps) {
  const [resetKey, setResetKey] = useState(0)
  return (
    <Select
      key={resetKey}
      onValueChange={(v) => {
        onPick(v)
        setResetKey((k) => k + 1)
      }}
    >
      <SelectTrigger className={className ?? 'h-6 w-auto border-none shadow-none bg-transparent px-1.5 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 gap-1'}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o} value={o} className="text-sm">{o}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

/** Appends a ready-made phrase to free-text narrative fields (Chief
 *  Complaints, History, Diagnosis, Advice, …) instead of replacing whatever
 *  the doctor already typed. */
export function appendPhrase(current: string, phrase: string): string {
  const trimmed = (current || '').trim()
  if (!trimmed) return phrase
  const sep = /[.,;]\s*$/.test(trimmed) ? ' ' : ', '
  return `${trimmed}${sep}${phrase}`
}
