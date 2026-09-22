import Tippy from '@tippyjs/react'
import 'tippy.js/dist/tippy.css'

const DEFAULTS = {
  delay: [75, 0],
  duration: [150, 100],
  placement: 'top',
  appendTo: () => document.body,
  arrow: true,
  theme: 'longhouse',
  offset: [0, 6],
  touch: 'hold',
  maxWidth: 280,
}

export default function AppTooltip({ content, children, disabled = false, ...rest }) {
  const text = typeof content === 'string' ? content.trim() : content
  if (disabled || !text) {
    return children
  }

  return (
    <Tippy content={text} {...DEFAULTS} {...rest}>
      {children}
    </Tippy>
  )
}
