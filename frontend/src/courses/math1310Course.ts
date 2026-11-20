import type { Course } from "../types/Course";

/**
 * MATH 1310 knowledge-checkpoint learning targets.
 *
 * Names/IDs come from the course's Learning Targets page. Prerequisites
 * are a PROPOSED graph inferred from the supplied learning objectives.
 * They represent conceptual dependencies, not course sequence or an
 * official prerequisite list. Transitive edges are omitted.
 *
 * Only the 21 named targets appear here. The grade policy also counts
 * 10 separately graded final-exam targets whose IDs are not specified
 * on the supplied Learning Targets page.
 */
export const math1310Course: Course = {
  targets: [
    // Fundamentals
    { id: "F1", name: "Summations", prerequisites: [] },
    { id: "F2", name: "Special Functions", prerequisites: [] },

    // Limits
    { id: "L1", name: "Meaning of a Limit", prerequisites: [] },
    { id: "L2", name: "Computing Limits", prerequisites: ["L1"], isCore: true },
    { id: "L3", name: "Continuity", prerequisites: ["L2"] },
    { id: "L4", name: "Limits & the Derivative", prerequisites: ["L2"] },

    // Derivatives
    {
      id: "D1",
      name: "Meaning of a Derivative",
      prerequisites: ["L4"],
      isCore: true,
    },
    {
      id: "D2",
      name: "Computing Derivatives",
      prerequisites: ["D3"],
      isCore: true,
    },
    {
      id: "D3",
      name: "Derivatives of Basic Functions",
      prerequisites: ["D1", "F2"],
      isCore: true,
    },
    { id: "D4", name: "Implicit Differentiation", prerequisites: ["D2"] },
    { id: "D5", name: "Linearization", prerequisites: ["D2"] },

    // Applications of derivatives
    { id: "A1", name: "L'Hôpital's Rule", prerequisites: ["D2"] },
    { id: "A2", name: "Local & Absolute Extrema", prerequisites: ["D2", "L3"] },
    { id: "A3", name: "Derivatives & Graphing", prerequisites: ["A2"] },
    { id: "A4", name: "Applied Optimization", prerequisites: ["A2"] },

    // Integrals
    {
      id: "I1",
      name: "Definite Integrals and Their Properties",
      prerequisites: ["F1"],
    },
    {
      id: "I2",
      name: "Antiderivatives & Indefinite Integrals",
      prerequisites: ["D3"],
    },
    {
      id: "I3",
      name: "Fundamental Theorem of Calculus",
      prerequisites: ["I1", "I2"],
      isCore: true,
    },
    {
      id: "I4",
      name: "Meaning of a Definite Integral",
      prerequisites: ["I3"],
      isCore: true,
    },
    { id: "I5", name: "Substitution", prerequisites: ["I3", "D2"] },

    // A cross-cutting skill developed throughout the semester, not a capstone.
    { id: "PS", name: "Problem Solving", prerequisites: [] },
  ],
};

// These six targets are designated CORE in the supplied course materials.
// Keep grading rules separate from the graph's prerequisite relations.
export const math1310CoreTargetIds = [
  "L2",
  "D1",
  "D2",
  "D3",
  "I3",
  "I4",
] as const;
