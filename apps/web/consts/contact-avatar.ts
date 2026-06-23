export function getContactAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/10.x/micah/svg?mouthVariant=smirk&facialHairVariant=&hairVariant=dannyPhantom,fonze,full,pixie&hairProbability=100&baseColor=f9c9b6,ac6651,f5bd8a&backgroundColor=ffffff&seed=${encodeURIComponent(seed)}`
}
