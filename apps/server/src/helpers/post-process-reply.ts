const KEYWORDS_TO_REPLACE: { keyword: string; replacement: [string, ...string[]] }[] = [
  {
    keyword: "in my experience",
    replacement: [
      "i think",
      "when i was dealing with this",
      "this is what i did",
      "i've dealt with this",
      "from what i've seen",
      "in my experience",
    ],
  },
  {
    keyword: "i've been there",
    replacement: [
      "i know what it feels like",
      "i remember this",
      "i know how it feels",
      "i got you",
      "i've been there",
    ],
  },
  {
    keyword: "moved the needle",
    replacement: [
      "improved the outcome",
      "actually made a difference",
      "helped a lot",
      "changed things",
    ],
  },
  {
    keyword: "tip:",
    replacement: [
      "i'd suggest",
      "i'd recommend",
      "if i were you",
      "what worked for me was",
      "i'd try",
    ],
  },
  {
    keyword: "\\bAbsolutely\\b",
    replacement: ["definitely", "for sure", "100%"],
  },
  {
    keyword: "game changer",
    replacement: [
      "really helpful",
      "made a big difference",
      "totally changed things",
      "huge help",
      "worked wonders",
    ],
  },
  {
    keyword: "\\bhonestly\\b",
    replacement: ["tbh", "ngl", "real talk", "genuinely"],
  },
  {
    keyword: "table stakes",
    replacement: ["basic stuff", "the bare minimum", "obvious by now", "standard at this point"],
  },
  {
    keyword: "high-signal",
    replacement: ["useful", "worth paying attention to", "actually valuable"],
  },
  {
    keyword: "\\blegitimately\\b",
    replacement: ["actually", "genuinely", "for real"],
  },
  {
    keyword: "\\blegitimate\\b",
    replacement: ["real", "actual", "genuine"],
  },
  {
    keyword: "\\btrajectory\\b",
    replacement: ["direction", "trend", "growth path", "where things are headed"],
  },
  {
    keyword: "unit economics",
    replacement: ["the math", "the numbers", "how the revenue works"],
  },
  {
    keyword: "buyer intent",
    replacement: [
      "what people are actually looking for",
      "purchase intent",
      "what they're trying to buy",
    ],
  },
  {
    keyword: "product.market fit",
    replacement: ["people actually wanting it", "real traction", "finding what clicks"],
  },
  {
    keyword: "\\bcompounding\\b",
    replacement: ["building up", "stacking over time", "adding up"],
  },
  {
    keyword: "\\bcompounds\\b",
    replacement: ["builds up", "stacks", "adds up over time"],
  },
  {
    keyword: "pain points",
    replacement: [
      "problems",
      "issues",
      "what's frustrating them",
      "what they're struggling with",
    ],
  },
  {
    keyword: "\\bleverage\\b",
    replacement: ["use", "take advantage of", "lean on"],
  },
  {
    keyword: "\\bexactly\\b",
    replacement: ["precisely", "right", "yes", "that's it", "exactly"],
  },
  {
    keyword: "\\bsolid\\b",
    replacement: ["good", "interesting", "worth noting", "useful", "solid"],
  },
  {
    keyword: "\\bresonates\\b",
    replacement: ["clicks", "makes sense", "tracks", "rings true", "lands"],
  },
  {
    keyword: "\\bresonate\\b",
    replacement: ["click", "make sense", "track", "ring true", "land"],
  },
  {
    keyword: "hits different",
    replacement: ["stands out", "feels different", "lands differently", "is worth noting"],
  },
  {
    keyword: "doing the heavy lifting",
    replacement: ["doing most of the work", "handling the hard part", "taking care of it"],
  },
  {
    keyword: "worth checking out",
    replacement: ["worth a look", "might be useful", "could be worth trying"],
  },
  {
    keyword: "cutting through the noise",
    replacement: ["filtering out the clutter", "finding the useful stuff", "separating signal from junk"],
  },
  {
    keyword: "\\bplaybook\\b",
    replacement: ["approach", "strategy", "method", "workflow"],
  },
]

export function postProcessReply(content: string): string {
  let cleaned = content

  KEYWORDS_TO_REPLACE.forEach(({ keyword, replacement }) => {
    const regex = new RegExp(keyword, "gi")
    cleaned = cleaned.replace(regex, () => {
      const randomIndex = Math.floor(Math.random() * replacement.length)
      return replacement[randomIndex] ?? replacement[0]
    })
  })

  // em-dash → comma
  cleaned = cleaned.replace(/—/g, ", ")

  // spaced hyphens → comma
  cleaned = cleaned.replace(/\s+-\s+/g, ", ")

  // rightwards arrow → ASCII
  cleaned = cleaned.replace(/→/g, "->")

  // collapse multiple spaces (preserve newlines)
  cleaned = cleaned.replace(/[ \t]+/g, " ")

  // normalize comma spacing
  cleaned = cleaned.replace(/,\s+/g, ", ")

  // strip "Short answer:" prefix
  cleaned = cleaned.replace(/^short answer:\s*/i, "")

  // strip asterisks
  cleaned = cleaned.replace(/\*/g, "")

  // remove periods before line breaks
  cleaned = cleaned.replace(/\.\n/g, "\n")

  // lowercase first char
  cleaned = cleaned.charAt(0).toLowerCase() + cleaned.slice(1)

  // normalize 3+ consecutive line breaks down to two (preserve paragraph breaks)
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n")

  return cleaned
}
