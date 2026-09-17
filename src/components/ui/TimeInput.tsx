import { inputCls } from './Field'
import { TIME_INPUT_HINT, parseTimeInput } from '../../lib/dates/timeInput'

/**
 * A time field that reads the same on every device. Replaces
 * `<input type="time">`, whose 12- or 24-hour rendering follows the OS locale.
 *
 * Fully controlled, holding no draft of its own: Enter fires a surrounding
 * form's submit without waiting for this field to blur, so a locally-buffered
 * value would reach the store stale — or empty. The parent therefore sees
 * every keystroke and is expected to run parseTimeInput() at submit time;
 * blurring canonicalises what the user sees to 'HH:mm'.
 */
export function TimeInput({
  value,
  onChange,
  className,
  disabled,
  title,
}: {
  /** Whatever has been typed so far — canonical 'HH:mm' once blurred. */
  value: string
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
  title?: string
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="hh:mm"
      title={title ?? TIME_INPUT_HINT}
      className={className ?? inputCls}
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => {
        // Anything unreadable clears, rather than sitting there looking like
        // a time that is set. Almost everything parses, so this is rare.
        if (value.trim()) onChange(parseTimeInput(value) ?? '')
      }}
    />
  )
}
