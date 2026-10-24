// The personal studio's current draft, as the home page and the assembly guide see it. The studio saves
// { draft: { design, name, activeId, updated } } under this key; `updated` is set only by real edits.
export function readDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem('dd-studio-personal'))?.draft;
    if (!draft?.updated || !draft.design?.colors) return null;
    return { name: draft.name, saved: !!draft.activeId, updated: draft.updated, colors: draft.design.colors };
  } catch {return null;}
}
