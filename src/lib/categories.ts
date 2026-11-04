import "server-only";
import { prisma } from "./prisma";

/**
 * Expands a set of category ids to include their ancestors and descendants.
 * This lets a seller who subscribes to a parent category receive requests for
 * any of its children, and vice versa.
 */
export async function expandCategoryIds(categoryIds: string[]): Promise<string[]> {
  if (categoryIds.length === 0) return [];

  const categories = await prisma.category.findMany({
    select: { id: true, parentId: true },
  });
  const byId = new Map(categories.map((category) => [category.id, category]));
  const childrenByParent = new Map<string, string[]>();
  for (const category of categories) {
    if (!category.parentId) continue;
    const siblings = childrenByParent.get(category.parentId) ?? [];
    siblings.push(category.id);
    childrenByParent.set(category.parentId, siblings);
  }

  const result = new Set<string>();

  function addAncestors(id: string) {
    let current = byId.get(id);
    const guard = new Set<string>();
    while (current?.parentId && !guard.has(current.parentId)) {
      guard.add(current.parentId);
      result.add(current.parentId);
      current = byId.get(current.parentId);
    }
  }

  function addDescendants(id: string) {
    const queue = [...(childrenByParent.get(id) ?? [])];
    const guard = new Set<string>();
    while (queue.length > 0) {
      const next = queue.shift()!;
      if (guard.has(next)) continue;
      guard.add(next);
      result.add(next);
      queue.push(...(childrenByParent.get(next) ?? []));
    }
  }

  for (const id of categoryIds) {
    if (!byId.has(id)) continue;
    result.add(id);
    addAncestors(id);
    addDescendants(id);
  }

  return [...result];
}
