declare module "gray-matter" {
  type FrontmatterValue = string | string[] | boolean | Date | undefined

  type GrayMatterFile = {
    data: Record<string, FrontmatterValue>
    content: string
    excerpt?: string
    orig: string
    language: string
    matter: string
    stringify(language?: string): string
  }

  export default function matter(input: string): GrayMatterFile
}
