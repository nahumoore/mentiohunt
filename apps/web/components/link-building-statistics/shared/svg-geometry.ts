// Shared SVG path helpers. Data-ends get a 4px radius; the end anchored to the
// baseline stays square so bars visibly sit on the axis.

/** Horizontal bar growing right from x. Rounded on the right (data) end only. */
export function barRight(x: number, y: number, w: number, h: number, r = 4) {
  const radius = Math.min(r, w / 2, h / 2)
  if (w <= radius * 2) {
    return `M${x},${y} h${Math.max(w, 0.5)} v${h} h${-Math.max(w, 0.5)} Z`
  }
  return [
    `M${x},${y}`,
    `h${w - radius}`,
    `a${radius},${radius} 0 0 1 ${radius},${radius}`,
    `v${h - radius * 2}`,
    `a${radius},${radius} 0 0 1 ${-radius},${radius}`,
    `H${x}`,
    "Z",
  ].join(" ")
}

/** Vertical column growing up from the baseline. Rounded on the top (data) end. */
export function barUp(
  x: number,
  baseline: number,
  w: number,
  h: number,
  r = 4
) {
  const height = Math.max(h, 1)
  const radius = Math.min(r, w / 2, height / 2)
  const top = baseline - height
  return [
    `M${x},${baseline}`,
    `V${top + radius}`,
    `a${radius},${radius} 0 0 1 ${radius},${-radius}`,
    `h${w - radius * 2}`,
    `a${radius},${radius} 0 0 1 ${radius},${radius}`,
    `V${baseline}`,
    "Z",
  ].join(" ")
}

export function pct(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`
}

export function num(value: number) {
  return value.toLocaleString("en-US")
}
