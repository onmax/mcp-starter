export function extractTitle(doc: any): string | undefined {
  if (!doc.body?.children) return undefined

  const h1 = doc.body.children.find(
    (node: any) => node.tag === 'h1'
  )

  if (!h1?.children?.[0]) return undefined
  return h1.children[0].value
}

export function extractDescription(doc: any): string | undefined {
  if (!doc.body?.children) return undefined

  const firstP = doc.body.children.find(
    (node: any) => node.tag === 'p'
  )

  if (!firstP?.children?.[0]) return undefined
  return firstP.children[0].value
}

export function getMarkdownContent(doc: any): string {
  if (!doc.body) return ''

  // Simple AST walk - remark/rehype would be more robust but adds dependency weight
  const extractText = (node: any): string => {
    if (typeof node === 'string') return node
    if (node.value) return node.value
    if (node.children) {
      return node.children.map(extractText).join('')
    }
    return ''
  }

  return doc.body.children?.map(extractText).join('\n\n') || ''
}
