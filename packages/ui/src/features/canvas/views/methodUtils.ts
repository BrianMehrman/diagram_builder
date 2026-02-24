const VISIBILITY_SORT_ORDER: Record<string, number> = {
  public: 0,
  protected: 1,
  private: 2,
}

export function sortMethodsByVisibility<T extends { visibility?: string }>(
  methods: readonly T[]
): T[] {
  return methods
    .map((m, i) => ({ m, i }))
    .sort((a, b) => {
      const aPri = VISIBILITY_SORT_ORDER[a.m.visibility ?? 'public'] ?? 0
      const bPri = VISIBILITY_SORT_ORDER[b.m.visibility ?? 'public'] ?? 0
      return aPri !== bPri ? aPri - bPri : a.i - b.i
    })
    .map(({ m }) => m)
}
