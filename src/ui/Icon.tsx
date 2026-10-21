import { Fragment } from 'react'
import { ICON_SIZES } from './iconManifest'
import { EMOJI_ICON } from './icons'

export type IconSize = 16 | 32 | 48

/** An icon file exists at exactly this size (icons are never scaled). The flag is a vector and fits anywhere. */
export const hasIcon = (file: string, size: IconSize) => file.endsWith('.svg') || !!ICON_SIZES[file]?.includes(size)

const src = (file: string, size: IconSize) =>
  `${import.meta.env.BASE_URL}icons/${file.endsWith('.svg') ? file : `${size}/${file}.png`}`

/** Shows the icon at its real size. If that size doesn't exist for this icon, nothing is drawn. */
export function Icon({ file, size, className = '' }: { file: string; size: IconSize; className?: string }) {
  if (!hasIcon(file, size)) return null
  return <img className={`icon ${className}`} src={src(file, size)} width={size} height={size} alt="" draggable={false} />
}

const PATTERN = new RegExp(
  `(${Object.keys(EMOJI_ICON)
    .sort((a, b) => b.length - a.length)
    .join('|')})`,
  'u',
)

/** Text where engine emoji are swapped for Windows 95 icons (16px), or left as the emoji when there is no 16px icon. */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(PATTERN).map((part, i) =>
        EMOJI_ICON[part] && hasIcon(EMOJI_ICON[part], 16) ? <Icon key={i} file={EMOJI_ICON[part]} size={16} className="inline" /> : <Fragment key={i}>{part}</Fragment>,
      )}
    </>
  )
}
