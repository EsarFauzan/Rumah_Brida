function AnimatedChevron({ size = 14, open = false }) {
  return (
    <span
      className={`chevron-icon${open ? ' is-open' : ''}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  )
}

export default AnimatedChevron
