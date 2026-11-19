import type { Course } from '../types/Course'

// Synthetic layout stress test: interwoven chains, long rank-skipping edges,
// branching/merging, wide early ranks, disconnected components, isolated nodes.
// Names are descriptive placeholders rather than actual course content.
export const layoutStressCourse: Course = {
  targets: [
    // Component 1: three long strands with cross-links and rank-skipping arrows.
    { id: 'alpha-0', name: 'Alpha 0', prerequisites: [] },
    { id: 'beta-0', name: 'Beta 0', prerequisites: [] },
    { id: 'gamma-0', name: 'Gamma 0', prerequisites: [] },
    { id: 'alpha-1', name: 'Alpha 1', prerequisites: ['alpha-0'] },
    { id: 'beta-1', name: 'Beta 1', prerequisites: ['beta-0', 'alpha-0'] },
    { id: 'gamma-1', name: 'Gamma 1', prerequisites: ['gamma-0'] },
    { id: 'alpha-2', name: 'Alpha 2', prerequisites: ['alpha-1', 'beta-1'] },
    { id: 'beta-2', name: 'Beta 2', prerequisites: ['beta-1'] },
    { id: 'gamma-2', name: 'Gamma 2', prerequisites: ['gamma-1', 'beta-1'] },
    { id: 'alpha-3', name: 'Alpha 3', prerequisites: ['alpha-2'] },
    { id: 'beta-3', name: 'Beta 3', prerequisites: ['beta-2', 'gamma-2'] },
    { id: 'gamma-3', name: 'Gamma 3', prerequisites: ['gamma-2'] },
    { id: 'alpha-4', name: 'Alpha 4', prerequisites: ['alpha-3', 'gamma-0'] }, // long edge
    { id: 'beta-4', name: 'Beta 4', prerequisites: ['beta-3', 'alpha-2'] }, // skip 1 rank
    { id: 'gamma-4', name: 'Gamma 4', prerequisites: ['gamma-3', 'alpha-0'] }, // long edge
    { id: 'alpha-5', name: 'Alpha 5', prerequisites: ['alpha-4', 'beta-1'] }, // long edge
    { id: 'beta-5', name: 'Beta 5', prerequisites: ['beta-4', 'alpha-4'] },
    { id: 'gamma-5', name: 'Gamma 5', prerequisites: ['gamma-4', 'beta-2'] }, // long edge
    { id: 'alpha-6', name: 'Alpha 6', prerequisites: ['alpha-5'] },
    { id: 'beta-6', name: 'Beta 6', prerequisites: ['beta-5', 'gamma-0'] }, // long edge
    { id: 'gamma-6', name: 'Gamma 6', prerequisites: ['gamma-5', 'beta-5'] },

    // Component 2: fork, repeated merges, and a shortcut from the root.
    { id: 'fork-root', name: 'Fork: Root', prerequisites: [] },
    { id: 'fork-a', name: 'Fork: Upper Branch', prerequisites: ['fork-root'] },
    { id: 'fork-b', name: 'Fork: Middle Branch', prerequisites: ['fork-root'] },
    { id: 'fork-c', name: 'Fork: Lower Branch', prerequisites: ['fork-root'] },
    { id: 'fork-ab', name: 'Fork: Merge A+B', prerequisites: ['fork-a', 'fork-b'] },
    { id: 'fork-bc', name: 'Fork: Merge B+C', prerequisites: ['fork-b', 'fork-c'] },
    { id: 'fork-rejoin', name: 'Fork: Rejoin', prerequisites: ['fork-ab', 'fork-bc', 'fork-root'] },
    { id: 'fork-end', name: 'Fork: Final', prerequisites: ['fork-rejoin'] },

    // Component 3: independent straight chain (should stay straight).
    { id: 'solo-0', name: 'Solo 0', prerequisites: [] },
    { id: 'solo-1', name: 'Solo 1', prerequisites: ['solo-0'] },
    { id: 'solo-2', name: 'Solo 2', prerequisites: ['solo-1'] },
    { id: 'solo-3', name: 'Solo 3', prerequisites: ['solo-2'] },
    { id: 'solo-4', name: 'Solo 4', prerequisites: ['solo-3'] },
    { id: 'solo-5', name: 'Solo 5', prerequisites: ['solo-4'] },
    { id: 'solo-6', name: 'Solo 6', prerequisites: ['solo-5'] },

    // Component 4: a wide layer feeding a single sink.
    { id: 'fan-root', name: 'Fan: Root', prerequisites: [] },
    { id: 'fan-1', name: 'Fan: Branch 1', prerequisites: ['fan-root'] },
    { id: 'fan-2', name: 'Fan: Branch 2', prerequisites: ['fan-root'] },
    { id: 'fan-3', name: 'Fan: Branch 3', prerequisites: ['fan-root'] },
    { id: 'fan-4', name: 'Fan: Branch 4', prerequisites: ['fan-root'] },
    { id: 'fan-end', name: 'Fan: Reunion', prerequisites: ['fan-1', 'fan-2', 'fan-3', 'fan-4'] },

    // Component 5 and 6: isolated targets.
    { id: 'isolated-one', name: 'Isolated Target One', prerequisites: [] },
    { id: 'isolated-two', name: 'Isolated Target Two', prerequisites: [] },
  ],
}
