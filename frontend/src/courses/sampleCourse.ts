import type { Course } from "../types/Course";

export const sampleCourse: Course = {
  targets: [
    {
      id: "limits",
      name: "Limits",
      prerequisites: [],
    },
    {
      id: "derivatives",
      name: "Derivatives",
      prerequisites: ["limits"],
    },
    {
      id: "chain-rule",
      name: "Chain Rule",
      prerequisites: ["derivatives"],
    },
    {
      id: "implicit-differentiation",
      name: "Implicit Differentiation",
      prerequisites: ["chain-rule"],
    },
    {
      id: "related-rates",
      name: "Related Rates",
      prerequisites: ["chain-rule"],
    },
  ],
};
