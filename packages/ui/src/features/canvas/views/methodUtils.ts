import type { IVMNode } from '../../../shared/types'

const VISIBILITY_SORT_ORDER: Record<string, number> = {
  public: 0,
  protected: 1,
  private: 2,
}

function getVisibility(node: IVMNode): string {
  return (node.metadata?.properties?.visibility as string | undefined) ?? 'public'
}

export function sortMethodsByVisibility(methods: readonly IVMNode[]): IVMNode[] {
  return methods
    .map((m, i) => ({ m, i }))
    .sort((a, b) => {
      const aPri = VISIBILITY_SORT_ORDER[getVisibility(a.m)] ?? 0
      const bPri = VISIBILITY_SORT_ORDER[getVisibility(b.m)] ?? 0
      return aPri !== bPri ? aPri - bPri : a.i - b.i
    })
    .map(({ m }) => m)
}
