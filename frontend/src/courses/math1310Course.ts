import type { CourseDefinition } from '../types/Course'

/**
 * Canonical MATH 1310 course definition.
 *
 * Prerequisites are a proposed conceptual dependency graph inferred from the
 * learning objectives. They are not an official course sequence, and
 * transitive edges are omitted.
 *
 * The object is intentionally plain data so it can later be serialized into a
 * standardized course package without changing the dashboard data model.
 */
export const math1310Course: CourseDefinition = {
  schemaVersion: 1,
  id: 'math1310',
  title: 'Calculus I',

  targets: [
    // Fundamentals
    {
      id: 'F1',
      name: 'Summations',
      prerequisites: [],
      content: {
        objectives: [
          'Expand and compute a sum written using \\(\\sum\\)-notation.',
          'Represent a sum of things concisely using \\(\\sum\\)-notation.',
          'Use linearity properties of \\(\\sum\\) to rewrite and compute summations.',
        ],
      },
    },
    {
      id: 'F2',
      name: 'Special Functions',
      prerequisites: [],
      content: {
        objectives: [
          'Evaluate exponential, logarithmic, trigonometric, and/or inverse trigonometric functions.',
          'Solve equations involving these functions.',
          'Know and use basic identities and properties to solve problems involving these functions.',
          'Model real-world phenomena using these functions.',
        ],
      },
    },

    // Limits
    {
      id: 'L1',
      name: 'Meaning of a Limit',
      prerequisites: [],
      content: {
        objectives: [
          'Define a limit, including one-sided limits',
          'Explain the meaning of a limit, including why a limit does not exist',
          'Describe the relationship between corresponding one-sided and two-sided limits',
          'Evaluate a limit from a table',
          'Evaluate a limit from a graph',
        ],
      },
    },
    {
      id: 'L2',
      name: 'Computing Limits',
      prerequisites: ['L1'],
      isCore: true,
      content: {
        objectives: [
          'Evaluate limits using limit laws.',
          'Identify the form of a limit and compute accordingly.',
          'Evaluate limits in \\(\\frac{0}{0}\\), \\(\\frac{c}{0}\\), and \\(\\frac{\\pm\\infty}{\\pm\\infty}\\) forms',
          'Evaluate a limit using substitution and/or algebraic simplification.',
          'Decide when a limit "\\(= \\infty\\)" or "\\(= -\\infty\\)".',
        ],
      },
    },
    {
      id: 'L3',
      name: 'Continuity',
      prerequisites: ['L2'],
      content: {
        objectives: [
          'State the definition of continuity.',
          'Use the definition of continuity to determine whether a function is continuous at a point.',
          'Classify types of discontinuity graphically and algebraically using the definition of continuity.',
          'State and use the Intermediate Value Theorem to make a conclusion about a continuous function.',
        ],
      },
    },
    {
      id: 'L4',
      name: 'Limits & the Derivative',
      prerequisites: ['L2'],
      content: {
        objectives: [
          'State and/or interpret the limit definition of a derivative and its parts.',
          'Find the derivative of a function using the definition of a derivative.',
          'Determine whether a function - defined either algebraically or graphically - is differentiable (at a point) using the definition of a derivative.',
          'Infer or explain properties of the derivative by characterizing the derivative as a limit.',
        ],
      },
    },

    // Derivatives
    {
      id: 'D1',
      name: 'Meaning of a Derivative',
      prerequisites: ['L4'],
      isCore: true,
      content: {
        objectives: [
          'Distinguish between an average and instantaneous rates of change described both algebraically, graphically, and in context.',
          'Correctly use the language of mathematics to express rates of change as derivatives.',
          'Determine the units of measurement of a quantity defined by a derivative.',
          'Decide whether a derivative -- or a related quantity -- is positive or negative in a given context.',
        ],
      },
    },
    {
      id: 'D3',
      name: 'Derivatives of Basic Functions',
      prerequisites: ['D1', 'F2'],
      isCore: true,
      content: {
        objectives: [
          'Compute derivatives of constant, power, polynomial, exponential, trigonometric, logarithmic, and inverse trigonometric functions.',
        ],
        notes: [
          'The derivative formulas that could tested in D3 would be 1-6 and 9-24 on the following webpage.',
        ],
        resources: [
          {
            label: 'OpenStax Calculus Volume 1 — Table of Derivatives',
            url: 'https://openstax.org/books/calculus-volume-1/pages/b-table-of-derivatives',
          },
        ],
      },
    },
    {
      id: 'D2',
      name: 'Computing Derivatives',
      prerequisites: ['D3'],
      isCore: true,
      content: {
        objectives: [
          'Use derivative rules -- including the product rule, quotient rule, and chain rule -- to compute derivatives.',
          'Decide in which order derivative rules should be used to compute derivatives of complicated functions.',
        ],
      },
    },
    {
      id: 'D4',
      name: 'Implicit Differentiation',
      prerequisites: ['D2'],
      content: {
        objectives: [
          'Use the differentiation rules (e.g. chain rule) to differentiate implicit equations.',
          'Find a slope of a curve that is defined implicitly, and interpret in context.',
          'Find a slope of a curve that at a given point, or at a given x or y value (where the other one of the x or y value needs to be found first).',
          'Determine points on a given curve where the tangent line has a specific slope (including vertical and horizontal).',
        ],
      },
    },
    {
      id: 'D5',
      name: 'Linearization',
      prerequisites: ['D2'],
      content: {
        objectives: [
          'Find the linearization of a function at a number and use it to approximate an output value of that function.',
          'Estimate the change in the output value of a function using a linear approximation.',
          'Find & interpret differentials.',
          'Use a linear approximation and/or differentials to solve a real-world problem.',
        ],
      },
    },

    // Applications of derivatives
    {
      id: 'A1',
      name: "L'Hôpital's Rule",
      prerequisites: ['D2'],
      content: {
        objectives: [
          'Identify the form of a limit and decide whether the form is determinate or indeterminate.',
          "Use appropriate algebraic simplification to rewrite a limit and use l'Hôpital's Rule.",
        ],
      },
    },
    {
      id: 'A2',
      name: 'Local & Absolute Extrema',
      prerequisites: ['D2', 'L3'],
      content: {
        objectives: [
          'Find the critical numbers of a function.',
          'Use the First Derivative Test or Second Derivative Test to classify local extrema.',
          "State the Extreme Value Theorem & Fermat's Theorem.",
          'Use these theorems to determine the existence of and to locate absolute extrema.',
          'Use the Closed Interval Method or the First Derivative Test for Absolute Extrema to find absolute extrema of a function.',
          'Use limits to determine behavior of a function having a non-closed interval as its domain on the boundary of its domain.',
        ],
      },
    },
    {
      id: 'A3',
      name: 'Derivatives & Graphing',
      prerequisites: ['A2'],
      content: {
        objectives: [
          'Use the tools of calculus to analyze the graph of a function.',
          'Determine on what intervals the graph of a function is increasing or decreasing, on what intervals it is concave up or concave down.',
          'Find local extrema, absolute extrema, & inflection points; represent them graphically.',
        ],
      },
    },
    {
      id: 'A4',
      name: 'Applied Optimization',
      prerequisites: ['A2'],
      content: {
        objectives: [
          'Given a problem in context that involves optimization, formulate the problem using the language of mathematics & solve it using the tools of calculus.',
        ],
      },
    },

    // Integrals
    {
      id: 'I1',
      name: 'Definite Integrals and Their Properties',
      prerequisites: ['F1'],
      content: {
        objectives: [
          'Approximate area between the graph of a function and an interval along the horizontal axis using rectangles (i.e. Riemann sums).',
          'Use properties of functions to decide whether an approximation is an overestimate or an underestimate.',
          'Interpret a definite integral in terms of signed area.',
          'Use this area interpretation to compute definite integrals where the area between the graph of the integrand and the horizontal axis is a shape you know.',
          'Compute definite integrals using their properties.',
        ],
      },
    },
    {
      id: 'I2',
      name: 'Antiderivatives & Indefinite Integrals',
      prerequisites: ['D3'],
      content: {
        objectives: [
          'Identify basic antiderivatives.',
          'Use the linearity properties of an indefinite integral to find the indefinite integral of a function.',
          'Solve an initial value problem.',
        ],
      },
    },
    {
      id: 'I3',
      name: 'Fundamental Theorem of Calculus',
      prerequisites: ['I1', 'I2'],
      isCore: true,
      content: {
        objectives: [
          'Identify when the Fundamental Theorem does and does not apply to a given problem.',
          'Use the Fundamental Theorem of Calculus, Part 1 to find the derivative of an area function.',
          'Use the Fundamental Theorem of Calculus, Part 2 to evaluate a definite integral.',
        ],
      },
    },
    {
      id: 'I4',
      name: 'Meaning of a Definite Integral',
      prerequisites: ['I3'],
      isCore: true,
      content: {
        objectives: [
          'State the Net Change Theorem.',
          'Interpret a definite integral in context.',
          'Determine the units of measurement of a quantity defined by a definite integral.',
          'Given a context with a rate function, write down an integral expression that gives a desired quantity.',
        ],
      },
    },
    {
      id: 'I5',
      name: 'Substitution',
      prerequisites: ['I3', 'D2'],
      content: {
        objectives: [
          'Identify when changing the variable is appropriate.',
          'Use a substitution to find indefinite integrals.',
          'Identify how a change of variables distorts the interval of integration in a definite integral.',
          'Use a substitution to evaluate a definite integral using the Fundamental Theorem.',
        ],
      },
    },

    // A cross-cutting skill developed throughout the semester, not a capstone.
    {
      id: 'PS',
      name: 'Problem Solving',
      prerequisites: [],
      content: {
        objectives: [],
        description: "This target is not about a topic in this course, but the problem solving skills we gain throughout our studies in this course. During the semester, we will have problem solving sessions that combine the knowledge and techniques we've learned to solve challenging problems.",
      },
    },
  ],

  // Shared lesson definitions will be added here next. Targets will reference
  // them by lessonId so titles and Canvas links are never duplicated.
  lessons: [],
}

// Compatibility export for code that wants the CORE target IDs directly.
// The source of truth is each target's isCore flag above.
export const math1310CoreTargetIds = math1310Course.targets
  .filter((target) => target.isCore)
  .map((target) => target.id)
