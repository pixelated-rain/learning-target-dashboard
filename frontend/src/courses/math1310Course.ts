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
        lessons: [
          {
            lessonId: 'extra-summations',
            relationship: 'primary',
            basis: 'explicit-target',
          },
          {
            lessonId: 'lesson20',
            relationship: 'application',
            basis: 'curricular-inference',
            note: 'Uses summation notation to build Riemann sums and accumulated area/net change.',
          },
          {
            lessonId: 'lesson21',
            relationship: 'application',
            basis: 'curricular-inference',
            note: 'Uses summation notation and Riemann sums to define the definite integral.',
          },
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
        lessons: [
          {
            lessonId: 'extra-trig',
            relationship: 'primary',
            basis: 'explicit-target',
          },
          {
            lessonId: 'extra-exp-log',
            relationship: 'primary',
            basis: 'explicit-target',
          },
          {
            lessonId: 'lesson10',
            relationship: 'application',
            basis: 'objective-match',
            note: 'Applies trigonometric identities and function fluency while developing trigonometric derivatives.',
          },
          {
            lessonId: 'lesson12',
            relationship: 'application',
            basis: 'objective-match',
            note: 'Applies inverse-trigonometric definitions and relationships while deriving inverse-trig derivatives.',
          },
          {
            lessonId: 'lesson13',
            relationship: 'application',
            basis: 'objective-match',
            note: 'Applies logarithm laws and exponential/logarithmic inverse relationships while developing derivative formulas.',
          },
          {
            lessonId: 'lesson15',
            relationship: 'application',
            basis: 'curricular-inference',
            note: 'Applies special-function algebra and identities in L\'Hôpital problems.',
          },
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
        lessons: [
          {
            lessonId: 'lesson1',
            relationship: 'primary',
            basis: 'explicit-target',
          },
          {
            lessonId: 'lesson2',
            relationship: 'primary',
            basis: 'explicit-target',
            note: 'The worksheet labels its limit-law outcome L1.',
          },
          {
            lessonId: 'lesson3',
            relationship: 'extension',
            basis: 'objective-match',
            note: 'Extends the meaning of limits to the definition and classification of continuity.',
          },
          {
            lessonId: 'lesson5',
            relationship: 'application',
            basis: 'objective-match',
            note: 'Applies one-sided/two-sided limit reasoning, DNE, and infinite-limit meaning to c/0 forms.',
          },
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
        lessons: [
          {
            lessonId: 'lesson2',
            relationship: 'primary',
            basis: 'objective-match',
            note: 'The current dashboard assigns limit-law computation to L2, although the worksheet labels it L1.',
          },
          {
            lessonId: 'lesson4',
            relationship: 'primary',
            basis: 'explicit-target',
          },
          {
            lessonId: 'lesson5',
            relationship: 'primary',
            basis: 'explicit-target',
          },
          {
            lessonId: 'lesson6',
            relationship: 'primary',
            basis: 'explicit-target',
          },
          {
            lessonId: 'lesson1',
            relationship: 'preview',
            basis: 'objective-match',
            note: 'Introduces infinite-limit meaning that is used in the current L2 objectives.',
          },
          {
            lessonId: 'lesson15',
            relationship: 'extension',
            basis: 'objective-match',
            note: 'Extends limit-computation techniques to indeterminate forms using L\'Hôpital\'s Rule.',
          },
          {
            lessonId: 'lesson3',
            relationship: 'application',
            basis: 'objective-match',
            note: 'Applies limit computation and one-sided limits when checking continuity conditions.',
          },
          {
            lessonId: 'lesson7',
            relationship: 'application',
            basis: 'objective-match',
            note: 'Applies limit computation to difference quotients in the derivative-at-a-point definition.',
          },
          {
            lessonId: 'lesson8',
            relationship: 'application',
            basis: 'objective-match',
            note: 'Applies limit computation to the derivative-as-a-function definition and differentiability questions.',
          },
          {
            lessonId: 'lesson18',
            relationship: 'application',
            basis: 'curricular-inference',
            note: 'Applies limits at interval boundaries to determine absolute-extrema behavior on nonclosed intervals.',
          },
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
        lessons: [
          {
            lessonId: 'lesson3',
            relationship: 'primary',
            basis: 'explicit-target',
          },
          {
            lessonId: 'lesson18',
            relationship: 'application',
            basis: 'curricular-inference',
            note: 'Applies continuity as the central hypothesis of the Extreme Value Theorem.',
          },
          {
            lessonId: 'lesson23',
            relationship: 'application',
            basis: 'objective-match',
            note: 'Applies continuity hypotheses when deciding whether the Fundamental Theorem can be used.',
          },
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
        lessons: [
          {
            lessonId: 'lesson7',
            relationship: 'primary',
            basis: 'objective-match',
          },
          {
            lessonId: 'lesson8',
            relationship: 'primary',
            basis: 'objective-match',
          },
          {
            lessonId: 'lesson10',
            relationship: 'application',
            basis: 'objective-match',
            note: 'Applies the limit definition of the derivative when product-rule hypotheses fail.',
          },
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
        lessons: [
          {
            lessonId: 'lesson7',
            relationship: 'primary',
            basis: 'objective-match',
          },
          {
            lessonId: 'lesson8',
            relationship: 'primary',
            basis: 'objective-match',
          },
          {
            lessonId: 'lesson9',
            relationship: 'application',
            basis: 'objective-match',
            note: 'Applies tangent-line slope and instantaneous-rate interpretations while using basic derivative formulas.',
          },
          {
            lessonId: 'lesson10',
            relationship: 'application',
            basis: 'objective-match',
            note: 'Applies instantaneous-rate interpretation in a velocity problem while practicing product and quotient rules.',
          },
          {
            lessonId: 'lesson11',
            relationship: 'application',
            basis: 'objective-match',
            note: 'Applies derivative units, signs, and contextual rate interpretations alongside the Chain Rule.',
          },
          {
            lessonId: 'lesson20',
            relationship: 'application',
            basis: 'curricular-inference',
            note: 'Applies derivatives as rates whose accumulated signed area represents net change.',
          },
          {
            lessonId: 'lesson24',
            relationship: 'application',
            basis: 'objective-match',
            note: 'Applies rate functions, units, signs, and derivative interpretation in net-change problems.',
          },
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
            type: 'link',
            label: 'OpenStax Calculus Volume 1 — Table of Derivatives',
            url: 'https://openstax.org/books/calculus-volume-1/pages/b-table-of-derivatives',
          },
        ],
        lessons: [
          {
            lessonId: 'lesson9',
            relationship: 'primary',
            basis: 'objective-match',
          },
          {
            lessonId: 'lesson10',
            relationship: 'primary',
            basis: 'objective-match',
          },
          {
            lessonId: 'lesson12',
            relationship: 'primary',
            basis: 'explicit-target',
          },
          {
            lessonId: 'lesson13',
            relationship: 'primary',
            basis: 'objective-match',
          },
          {
            lessonId: 'lesson14',
            relationship: 'application',
            basis: 'objective-match',
            note: 'Applies basic-function derivative formulas when constructing linearizations and differentials.',
          },
          {
            lessonId: 'lesson15',
            relationship: 'application',
            basis: 'objective-match',
            note: 'Applies basic-function derivative formulas repeatedly under L\'Hôpital\'s Rule.',
          },
          {
            lessonId: 'lesson18',
            relationship: 'application',
            basis: 'explicit-target',
            note: 'Applies inverse-trigonometric derivative formulas while finding absolute extrema.',
          },
          {
            lessonId: 'lesson22',
            relationship: 'extension',
            basis: 'curricular-inference',
            note: 'Extends the basic-function derivative table by using the formulas in reverse to identify antiderivatives.',
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
        lessons: [
          {
            lessonId: 'lesson9',
            relationship: 'primary',
            basis: 'objective-match',
          },
          {
            lessonId: 'lesson10',
            relationship: 'primary',
            basis: 'objective-match',
          },
          {
            lessonId: 'lesson11',
            relationship: 'primary',
            basis: 'objective-match',
          },
          {
            lessonId: 'lesson12',
            relationship: 'extension',
            basis: 'objective-match',
            note: 'Extends differentiation rules to implicitly defined relationships.',
          },
          {
            lessonId: 'lesson25',
            relationship: 'extension',
            basis: 'curricular-inference',
            note: 'Extends recognition of Chain Rule structure to the reverse process used in substitution.',
          },
          {
            lessonId: 'lesson13',
            relationship: 'application',
            basis: 'objective-match',
            note: 'Applies previously learned differentiation rules while developing logarithmic and exponential derivative formulas.',
          },
          {
            lessonId: 'lesson14',
            relationship: 'application',
            basis: 'objective-match',
            note: 'Applies differentiation rules to construct linearizations, differentials, and approximations.',
          },
          {
            lessonId: 'lesson15',
            relationship: 'application',
            basis: 'objective-match',
            note: 'Applies differentiation rules repeatedly inside L\'Hôpital\'s Rule.',
          },
          {
            lessonId: 'lesson16',
            relationship: 'application',
            basis: 'curricular-inference',
            note: 'Applies derivative computation in the First Derivative Test.',
          },
          {
            lessonId: 'lesson17',
            relationship: 'application',
            basis: 'curricular-inference',
            note: 'Applies derivative computation to concavity and the Second Derivative Test.',
          },
          {
            lessonId: 'lesson18',
            relationship: 'application',
            basis: 'curricular-inference',
            note: 'Applies derivative computation to locate and classify extrema.',
          },
          {
            lessonId: 'lesson19',
            relationship: 'application',
            basis: 'curricular-inference',
            note: 'Applies derivative computation to objective functions in optimization problems.',
          },
          {
            lessonId: 'lesson23',
            relationship: 'application',
            basis: 'objective-match',
            note: 'Applies the Chain Rule to variable-bound area functions.',
          },
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
        lessons: [
          {
            lessonId: 'lesson12',
            relationship: 'primary',
            basis: 'objective-match',
          },
          {
            lessonId: 'lesson13',
            relationship: 'application',
            basis: 'explicit-target',
            note: 'Applies implicit differentiation in an exam-practice problem involving logarithmic relationships.',
          },
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
        lessons: [
          {
            lessonId: 'lesson14',
            relationship: 'primary',
            basis: 'objective-match',
          },
          {
            lessonId: 'lesson9',
            relationship: 'preview',
            basis: 'explicit-target',
            note: 'Introduces linearization and tangent-line approximation before the dedicated lesson.',
          },
          {
            lessonId: 'lesson17',
            relationship: 'extension',
            basis: 'objective-match',
            note: 'Extends linear approximation by using concavity to determine when tangent-line approximations over- or underestimate.',
          },
          {
            lessonId: 'lesson23',
            relationship: 'application',
            basis: 'curricular-inference',
            note: 'Applies linear approximation to explain how Riemann-sum rectangles approximate changes in an antiderivative.',
          },
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
        lessons: [
          {
            lessonId: 'lesson15',
            relationship: 'primary',
            basis: 'objective-match',
          },
          {
            lessonId: 'lesson4',
            relationship: 'preview',
            basis: 'objective-match',
            note: 'Develops 0/0 form recognition and algebraic simplification.',
          },
          {
            lessonId: 'lesson5',
            relationship: 'preview',
            basis: 'objective-match',
            note: 'Distinguishes c/0 behavior from indeterminate forms and strengthens sign/form classification.',
          },
          {
            lessonId: 'lesson6',
            relationship: 'preview',
            basis: 'objective-match',
            note: 'Develops limits at infinity and infinity/infinity forms.',
          },
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
        lessons: [
          {
            lessonId: 'lesson16',
            relationship: 'primary',
            basis: 'objective-match',
          },
          {
            lessonId: 'lesson17',
            relationship: 'primary',
            basis: 'objective-match',
          },
          {
            lessonId: 'lesson18',
            relationship: 'primary',
            basis: 'objective-match',
          },
          {
            lessonId: 'lesson19',
            relationship: 'application',
            basis: 'explicit-target',
            note: 'Applies absolute-extrema methods from Lesson 18 to optimization problems.',
          },
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
        lessons: [
          {
            lessonId: 'lesson16',
            relationship: 'primary',
            basis: 'objective-match',
          },
          {
            lessonId: 'lesson17',
            relationship: 'primary',
            basis: 'objective-match',
          },
          {
            lessonId: 'lesson18',
            relationship: 'primary',
            basis: 'objective-match',
            note: 'Absolute extrema are explicitly included in the current A3 objectives.',
          },
          {
            lessonId: 'lesson7',
            relationship: 'preview',
            basis: 'objective-match',
            note: 'Introduces the connection between derivative sign and increasing/decreasing behavior at a point.',
          },
          {
            lessonId: 'lesson8',
            relationship: 'preview',
            basis: 'objective-match',
            note: 'Builds the graphical relationship between a function and its derivative.',
          },
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
        lessons: [
          {
            lessonId: 'lesson19',
            relationship: 'primary',
            basis: 'objective-match',
          },
          {
            lessonId: 'lesson8',
            relationship: 'preview',
            basis: 'explicit-target',
            note: 'Explicitly previews mathematical modelling and optimization.',
          },
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
        lessons: [
          {
            lessonId: 'lesson20',
            relationship: 'primary',
            basis: 'objective-match',
          },
          {
            lessonId: 'lesson21',
            relationship: 'primary',
            basis: 'objective-match',
          },
          {
            lessonId: 'lesson23',
            relationship: 'extension',
            basis: 'curricular-inference',
            note: 'Extends definite-integral evaluation from geometry/properties to antiderivatives through the Fundamental Theorem.',
          },
          {
            lessonId: 'lesson26',
            relationship: 'extension',
            basis: 'objective-match',
            note: 'Extends definite-integral evaluation by allowing a change of variables and transformed bounds.',
          },
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
        lessons: [
          {
            lessonId: 'lesson22',
            relationship: 'primary',
            basis: 'objective-match',
          },
          {
            lessonId: 'lesson23',
            relationship: 'extension',
            basis: 'curricular-inference',
            note: 'Extends antiderivatives from indefinite integrals to evaluating definite integrals through the Fundamental Theorem.',
          },
          {
            lessonId: 'lesson25',
            relationship: 'extension',
            basis: 'objective-match',
            note: 'Extends indefinite-integration technique with substitution.',
          },
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
        lessons: [
          {
            lessonId: 'lesson23',
            relationship: 'primary',
            basis: 'objective-match',
          },
          {
            lessonId: 'lesson24',
            relationship: 'extension',
            basis: 'objective-match',
            note: 'Extends the Fundamental Theorem into the Net Change Theorem and contextual accumulated-change interpretation.',
          },
          {
            lessonId: 'lesson26',
            relationship: 'application',
            basis: 'objective-match',
            note: 'Applies antiderivative/FTC machinery after changing variables in a definite integral.',
          },
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
        lessons: [
          {
            lessonId: 'lesson20',
            relationship: 'primary',
            basis: 'explicit-target',
          },
          {
            lessonId: 'lesson24',
            relationship: 'primary',
            basis: 'objective-match',
          },
          {
            lessonId: 'lesson21',
            relationship: 'extension',
            basis: 'objective-match',
            note: 'Extends the net-change/area idea by formalizing it as a definite integral.',
          },
          {
            lessonId: 'lesson23',
            relationship: 'extension',
            basis: 'objective-match',
            note: 'Extends the definite-integral meaning by identifying it with net change in an antiderivative through the Fundamental Theorem.',
          },
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
        lessons: [
          {
            lessonId: 'lesson25',
            relationship: 'primary',
            basis: 'objective-match',
          },
          {
            lessonId: 'lesson26',
            relationship: 'primary',
            basis: 'objective-match',
          },
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
        lessons: [
          {
            lessonId: 'lesson6',
            relationship: 'primary',
            basis: 'explicit-target',
            note: 'The worksheet explicitly identifies its synthesis problem as PS.',
          },
          {
            lessonId: 'lesson19',
            relationship: 'application',
            basis: 'curricular-inference',
            note: 'Applies problem-solving skills by combining modelling, derivative computation, and extrema methods in unfamiliar contexts.',
          },
        ],
      },
    },
  ],

  lessons: [
    { id: 'extra-summations', title: 'Extra Skills Practice: Summations' },
    { id: 'extra-trig', title: 'Extra Skills Practice: Trig & Inverse Trig Functions' },
    { id: 'extra-exp-log', title: 'Extra Skills Practice: Exponents & Logarithms' },
    { id: 'lesson1', number: 1, title: 'Introduction to Limits' },
    { id: 'lesson2', number: 2, title: 'Limit Laws' },
    { id: 'lesson3', number: 3, title: 'Using Limits to Describe Continuity' },
    { id: 'lesson4', number: 4, title: 'Computing Limits (0/0)' },
    { id: 'lesson5', number: 5, title: 'Computing Limits (c/0)' },
    { id: 'lesson6', number: 6, title: 'Limits at Infinity' },
    { id: 'lesson7', number: 7, title: 'Rates of Change' },
    { id: 'lesson8', number: 8, title: 'Derivative as a Function' },
    { id: 'lesson9', number: 9, title: 'Basic Derivatives' },
    { id: 'lesson10', number: 10, title: 'Product and Quotient Rules' },
    { id: 'lesson11', number: 11, title: 'Chain Rule' },
    { id: 'lesson12', number: 12, title: 'Implicit Differentiation and Inverse Trig Derivatives' },
    { id: 'lesson13', number: 13, title: 'Derivatives of Logarithms and Exponentials' },
    { id: 'lesson14', number: 14, title: 'Linearization and Differentials' },
    { id: 'lesson15', number: 15, title: "L'Hôpital's Rule" },
    { id: 'lesson16', number: 16, title: 'Local Extrema & the First Derivative Test' },
    { id: 'lesson17', number: 17, title: 'Concavity & the Second Derivative Test' },
    { id: 'lesson18', number: 18, title: 'Absolute Extrema & the Extreme Value Theorem' },
    { id: 'lesson19', number: 19, title: 'Applied Optimization' },
    { id: 'lesson20', number: 20, title: 'Estimating Net Change & Area' },
    { id: 'lesson21', number: 21, title: 'The Definite Integral' },
    { id: 'lesson22', number: 22, title: 'Antidifferentiation, Indefinite Integrals, & Initial Value Problems' },
    { id: 'lesson23', number: 23, title: 'The Fundamental Theorem of Calculus' },
    { id: 'lesson24', number: 24, title: 'Net Change Revisited' },
    { id: 'lesson25', number: 25, title: 'Substitution in Indefinite Integrals' },
    { id: 'lesson26', number: 26, title: 'Substitution in Definite Integrals' },
  ],
}

// Compatibility export for code that wants the CORE target IDs directly.
// The source of truth is each target's isCore flag above.
export const math1310CoreTargetIds = math1310Course.targets
  .filter((target) => target.isCore)
  .map((target) => target.id)
