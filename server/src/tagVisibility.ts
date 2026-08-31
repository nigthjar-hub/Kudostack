interface TaggedFicTag {
  tag: { id: string; name: string; category: string };
}

// Content warnings and spice-level tags are private by default; a read event
// only exposes them to other users when its own visibility flags allow it.
export function filterTagsForVisibility<T extends TaggedFicTag>(
  tags: T[],
  showContentWarnings: boolean,
  showSpiceTags: boolean
): T[] {
  return tags.filter((t) => {
    if (t.tag.category === "WARNING") return showContentWarnings;
    if (t.tag.category === "SPICE") return showSpiceTags;
    return true;
  });
}
