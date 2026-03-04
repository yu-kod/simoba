import { describe, it, expect } from 'vitest'
import { TALENT_TREES } from '../index'
import type { TalentTreeDefinition } from '../types'

function getAllNodeIds(tree: TalentTreeDefinition): string[] {
  return tree.nodes.map((n) => n.id)
}

function hasCycle(tree: TalentTreeDefinition): boolean {
  const idSet = new Set(getAllNodeIds(tree))
  const visited = new Set<string>()
  const visiting = new Set<string>()

  const nodeMap = new Map(tree.nodes.map((n) => [n.id, n]))

  function dfs(id: string): boolean {
    if (visiting.has(id)) return true
    if (visited.has(id)) return false
    visiting.add(id)
    const node = nodeMap.get(id)
    if (node) {
      for (const prereq of node.prerequisites) {
        if (idSet.has(prereq) && dfs(prereq)) return true
      }
    }
    visiting.delete(id)
    visited.add(id)
    return false
  }

  for (const id of idSet) {
    if (dfs(id)) return true
  }
  return false
}

describe('Talent Tree Integrity', () => {
  const heroTypes = Object.keys(TALENT_TREES) as Array<keyof typeof TALENT_TREES>

  it.each(heroTypes)('%s — all node IDs are unique', (heroType) => {
    const tree = TALENT_TREES[heroType]
    const ids = getAllNodeIds(tree)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it.each(heroTypes)('%s — all prerequisites reference valid node IDs', (heroType) => {
    const tree = TALENT_TREES[heroType]
    const validIds = new Set(getAllNodeIds(tree))
    for (const node of tree.nodes) {
      for (const prereq of node.prerequisites) {
        expect(validIds.has(prereq)).toBe(true)
      }
    }
  })

  it.each(heroTypes)('%s — has no cycles (valid DAG)', (heroType) => {
    const tree = TALENT_TREES[heroType]
    expect(hasCycle(tree)).toBe(false)
  })

  it.each(heroTypes)('%s — all nodes have positive cost', (heroType) => {
    const tree = TALENT_TREES[heroType]
    for (const node of tree.nodes) {
      expect(node.cost).toBeGreaterThan(0)
    }
  })

  it.each(heroTypes)('%s — has at least one root node (no prerequisites)', (heroType) => {
    const tree = TALENT_TREES[heroType]
    const rootNodes = tree.nodes.filter((n) => n.prerequisites.length === 0)
    expect(rootNodes.length).toBeGreaterThan(0)
  })

  it.each(heroTypes)('%s — has at least one grant_skill effect', (heroType) => {
    const tree = TALENT_TREES[heroType]
    const hasGrantSkill = tree.nodes.some((n) =>
      n.effects.some((e) => e.type === 'grant_skill'),
    )
    expect(hasGrantSkill).toBe(true)
  })

  it('all hero types have a talent tree defined', () => {
    expect(heroTypes).toContain('BLADE')
    expect(heroTypes).toContain('BOLT')
    expect(heroTypes).toContain('AURA')
  })

  it('node IDs are globally unique across all trees', () => {
    const allIds: string[] = []
    for (const heroType of heroTypes) {
      allIds.push(...getAllNodeIds(TALENT_TREES[heroType]))
    }
    const uniqueIds = new Set(allIds)
    expect(uniqueIds.size).toBe(allIds.length)
  })
})
