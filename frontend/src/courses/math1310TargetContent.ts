/**
 * MATH 1310 learning target descriptions and objectives.
 *
 * Transcribed from the supplied learning-target descriptions. The target IDs
 * correspond to math1310Course.ts. Kept separate from the prerequisite DAG
 * so graph layout does not depend on lesson content.
 */

export type LearningTargetContent = {
  objectives: string[];
  description?: string;
  notes?: string[];
  resources?: { label: string; url: string }[];
};

export const math1310TargetContent: Record<string, LearningTargetContent> = {
  F1: {
    objectives: [
      "Expand and compute a sum written using \\(\\sum\\)-notation.",
      "Represent a sum of things concisely using \\(\\sum\\)-notation.",
      "Use linearity properties of \\(\\sum\\) to rewrite and compute summations.",
    ],
  },
  F2: {
    objectives: [
      "Evaluate exponential, logarithmic, trigonometric, and/or inverse trigonometric functions.",
      "Solve equations involving these functions.",
      "Know and use basic identities and properties to solve problems involving these functions.",
      "Model real-world phenomena using these functions.",
    ],
  },
  L1: {
    objectives: [
      "Define a limit, including one-sided limits",
      "Explain the meaning of a limit, including why a limit does not exist",
      "Describe the relationship between corresponding one-sided and two-sided limits",
      "Evaluate a limit from a table",
      "Evaluate a limit from a graph",
    ],
  },
  L2: {
    objectives: [
      "Evaluate limits using limit laws.",
      "Identify the form of a limit and compute accordingly.",
      "Evaluate limits in \\(\\frac{0}{0}\\), \\(\\frac{c}{0}\\), and \\(\\frac{\\pm\\infty}{\\pm\\infty}\\) forms",
      "Evaluate a limit using substitution and/or algebraic simplification.",
      'Decide when a limit "\\(= \\infty\\)" or "\\(= -\\infty\\)".',
    ],
  },
  L3: {
    objectives: [
      "State the definition of continuity.",
      "Use the definition of continuity to determine whether a function is continuous at a point.",
      "Classify types of discontinuity graphically and algebraically using the definition of continuity.",
      "State and use the Intermediate Value Theorem to make a conclusion about a continuous function.",
    ],
  },
  L4: {
    objectives: [
      "State and/or interpret the limit definition of a derivative and its parts.",
      "Find the derivative of a function using the definition of a derivative.",
      "Determine whether a function - defined either algebraically or graphically - is differentiable (at a point) using the definition of a derivative.",
      "Infer or explain properties of the derivative by characterizing the derivative as a limit.",
    ],
  },
  D1: {
    objectives: [
      "Distinguish between an average and instantaneous rates of change described both algebraically, graphically, and in context.",
      "Correctly use the language of mathematics to express rates of change as derivatives.",
      "Determine the units of measurement of a quantity defined by a derivative.",
      "Decide whether a derivative -- or a related quantity -- is positive or negative in a given context.",
    ],
  },
  D2: {
    objectives: [
      "Use derivative rules -- including the product rule, quotient rule, and chain rule -- to compute derivatives.",
      "Decide in which order derivative rules should be used to compute derivatives of complicated functions.",
    ],
  },
  D3: {
    objectives: [
      "Compute derivatives of constant, power, polynomial, exponential, trigonometric, logarithmic, and inverse trigonometric functions.",
    ],
    notes: [
      "The derivative formulas that could tested in D3 would be 1-6 and 9-24 on the following webpage.",
    ],
    resources: [
      {
        label: "OpenStax Calculus Volume 1 — Table of Derivatives",
        url: "https://openstax.org/books/calculus-volume-1/pages/b-table-of-derivatives",
      },
    ],
  },
  D4: {
    objectives: [
      "Use the differentiation rules (e.g. chain rule) to differentiate implicit equations.",
      "Find a slope of a curve that is defined implicitly, and interpret in context.",
      "Find a slope of a curve that at a given point, or at a given x or y value (where the other one of the x or y value needs to be found first).",
      "Determine points on a given curve where the tangent line has a specific slope (including vertical and horizontal).",
    ],
  },
  D5: {
    objectives: [
      "Find the linearization of a function at a number and use it to approximate an output value of that function.",
      "Estimate the change in the output value of a function using a linear approximation.",
      "Find & interpret differentials.",
      "Use a linear approximation and/or differentials to solve a real-world problem.",
    ],
  },
  A1: {
    objectives: [
      "Identify the form of a limit and decide whether the form is determinate or indeterminate.",
      "Use appropriate algebraic simplification to rewrite a limit and use l'Hopital's Rule.",
    ],
  },
  A2: {
    objectives: [
      "Find the critical numbers of a function.",
      "Use the First Derivative Test or Second Derivative Test to classify local extrema.",
      "State the Extreme Value Theorem & Fermat's Theorem.",
      "Use these theorems to determine the existence of and to locate absolute extrema.",
      "Use the Closed Interval Method or the First Derivative Test for Absolute Extrema to find absolute extrema of a function.",
      "Use limits to determine behavior of a function having a non-closed interval as its domain on the boundary of its domain.",
    ],
  },
  A3: {
    objectives: [
      "Use the tools of calculus to analyze the graph of a function.",
      "Determine on what intervals the graph of a function is increasing or decreasing, on what intervals it is concave up or concave down.",
      "Find local extrema, absolute extrema, & inflection points; represent them graphically.",
    ],
  },
  A4: {
    objectives: [
      "Given a problem in context that involves optimization, formulate the problem using the language of mathematics & solve it using the tools of calculus.",
    ],
  },
  I1: {
    objectives: [
      "Approximate area between the graph of a function and an interval along the horizontal axis using rectangles (i.e. Riemann sums).",
      "Use properties of functions to decide whether an approximation is an overestimate or an underestimate.",
      "Interpret a definite integral in terms of signed area.",
      "Use this area interpretation to compute definite integrals where the area between the graph of the integrand and the horizontal axis is a shape you know.",
      "Compute definite integrals using their properties.",
    ],
  },
  I2: {
    objectives: [
      "Identify basic antiderivatives.",
      "Use the linearity properties of an indefinite integral to find the indefinite integral of a function.",
      "Solve an initial value problem.",
    ],
  },
  I3: {
    objectives: [
      "Identify when the Fundamental Theorem does and does not apply to a given problem.",
      "Use the Fundamental Theorem of Calculus, Part 1 to find the derivative of an area function.",
      "Use the Fundamental Theorem of Calculus, Part 2 to evaluate a definite integral.",
    ],
  },
  I4: {
    objectives: [
      "State the Net Change Theorem.",
      "Interpret a definite integral in context.",
      "Determine the units of measurement of a quantity defined by a definite integral.",
      "Given a context with a rate function, write down an integral expression that gives a desired quantity.",
    ],
  },
  I5: {
    objectives: [
      "Identify when changing the variable is appropriate.",
      "Use a substitution to find indefinite integrals.",
      "Identify how a change of variables distorts the interval of integration in a definite integral.",
      "Use a substitution to evaluate a definite integral using the Fundamental Theorem.",
    ],
  },
  PS: {
    objectives: [],
    description:
      "This target is not about a topic in this course, but the problem solving skills we gain throughout our studies in this course. During the semester, we will have problem solving sessions that combine the knowledge and techniques we've learned to solve challenging problems.",
  },
};
