import { Fragment } from 'react'
import { EMOJI_ICON } from './icons'

const src = (file: string) => `${import.meta.env.BASE_URL}icons/${file.includes('.') ? file : file + '.png'}`

/** `px` keeps hard pixel edges (use at 32px+); small sizes scale smoothly. */
export function Icon({ file, size = 32, px = size >= 32, className = '' }: { file: string; size?: number; px?: boolean; className?: string }) {
  return <img className={`icon ${px ? 'px' : ''} ${className}`} src={src(file)} width={size} height={size} alt="" draggable={false} />
}

const PATTERN = new RegExp(
  `(${Object.keys(EMOJI_ICON)
    .sort((a, b) => b.length - a.length)
    .join('|')})`,
  'u',
)

/** Text where engine emoji are swapped for Windows 95 icons. */
export function Rich({ text, size = 14 }: { text: string; size?: number }) {
  return (
    <>
      {text.split(PATTERN).map((part, i) =>
        EMOJI_ICON[part] ? <Icon key={i} file={EMOJI_ICON[part]} size={size} px={false} className="inline" /> : <Fragment key={i}>{part}</Fragment>,
      )}
    </>
  )
}
