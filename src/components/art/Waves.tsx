import { useId } from 'react'

export function Waves({
  className = '',
  tone = 'ink'
}: {
  className?: string
  tone?: 'ink' | 'clay'
}) {
  const id = useId().replaceAll(':', '')

  return (
    <svg
      className={className}
      viewBox="0 0 1440 100"
      preserveAspectRatio="none"
      fill="none"
      style={{ color: `var(--${tone})` }}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={id}
          width="240"
          height="65"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="
              M 0 25
              C 30 5, 90 5, 120 25
              C 150 45, 210 45, 240 25
            "
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </pattern>
      </defs>

      <rect
        x="0"
        y="0"
        width="1440"
        height="100"
        fill={`url(#${id})`}
      />
    </svg>
  )
}