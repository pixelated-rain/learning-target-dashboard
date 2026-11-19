import type { Course } from '../types/Course'

// Illustrative Calculus I prerequisite graph, not a prescribed syllabus.
// Several strands share foundations and meet again at applications.
export const calculusOneCourse: Course = {
  targets: [
    // Foundations
    { id: 'functions', name: 'Functions and Notation', prerequisites: [] },
    { id: 'graphs', name: 'Graphs of Functions', prerequisites: ['functions'] },
    { id: 'algebra', name: 'Algebraic Manipulation', prerequisites: ['functions'] },
    { id: 'trigonometry', name: 'Trigonometric Functions', prerequisites: ['functions'] },
    { id: 'composition', name: 'Function Composition', prerequisites: ['functions'] },
    { id: 'inverse-functions', name: 'Inverse Functions', prerequisites: ['composition', 'graphs'] },
    { id: 'exp-log-functions', name: 'Exponential and Log Functions', prerequisites: ['functions'] },

    // Limits and continuity
    { id: 'limit-concept', name: 'Concept of a Limit', prerequisites: ['graphs'] },
    { id: 'one-sided-limits', name: 'One-Sided Limits', prerequisites: ['limit-concept'] },
    { id: 'limit-laws', name: 'Limit Laws', prerequisites: ['limit-concept', 'algebra'] },
    { id: 'continuity', name: 'Continuity', prerequisites: ['one-sided-limits', 'limit-laws'] },
    { id: 'ivt', name: 'Intermediate Value Theorem', prerequisites: ['continuity', 'graphs'] },
    { id: 'infinite-limits', name: 'Infinite Limits', prerequisites: ['one-sided-limits'] },
    { id: 'limits-at-infinity', name: 'Limits at Infinity', prerequisites: ['limit-laws'] },

    // Differentiation rules
    { id: 'derivative-definition', name: 'Definition of the Derivative', prerequisites: ['limit-concept', 'algebra'] },
    { id: 'derivative-function', name: 'Derivative as a Function', prerequisites: ['derivative-definition', 'graphs'] },
    { id: 'basic-rules', name: 'Basic Derivative Rules', prerequisites: ['derivative-definition'] },
    { id: 'product-rule', name: 'Product Rule', prerequisites: ['basic-rules'] },
    { id: 'quotient-rule', name: 'Quotient Rule', prerequisites: ['product-rule'] },
    { id: 'trig-derivatives', name: 'Trigonometric Derivatives', prerequisites: ['basic-rules', 'trigonometry'] },
    { id: 'chain-rule', name: 'Chain Rule', prerequisites: ['basic-rules', 'composition'] },
    { id: 'implicit-differentiation', name: 'Implicit Differentiation', prerequisites: ['chain-rule'] },
    { id: 'inverse-derivatives', name: 'Derivatives of Inverse Functions', prerequisites: ['implicit-differentiation', 'inverse-functions'] },
    { id: 'exp-derivatives', name: 'Exponential Derivatives', prerequisites: ['chain-rule', 'exp-log-functions'] },
    { id: 'log-derivatives', name: 'Logarithmic Derivatives', prerequisites: ['inverse-derivatives', 'exp-derivatives'] },
    { id: 'higher-derivatives', name: 'Higher Derivatives', prerequisites: ['basic-rules'] },

    // Applications of derivatives
    { id: 'velocity-acceleration', name: 'Velocity and Acceleration', prerequisites: ['derivative-function', 'higher-derivatives'] },
    { id: 'related-rates', name: 'Related Rates', prerequisites: ['implicit-differentiation', 'derivative-function'] },
    { id: 'linear-approximation', name: 'Linear Approximation', prerequisites: ['derivative-function'] },
    { id: 'differentials', name: 'Differentials', prerequisites: ['linear-approximation'] },
    { id: 'critical-points', name: 'Critical Points', prerequisites: ['derivative-function'] },
    { id: 'mean-value-theorem', name: 'Mean Value Theorem', prerequisites: ['continuity', 'derivative-function'] },
    { id: 'monotonicity', name: 'Increasing and Decreasing', prerequisites: ['critical-points', 'mean-value-theorem'] },
    { id: 'concavity', name: 'Concavity', prerequisites: ['higher-derivatives', 'monotonicity'] },
    { id: 'curve-sketching', name: 'Curve Sketching', prerequisites: ['concavity', 'limits-at-infinity', 'infinite-limits'] },
    { id: 'optimization', name: 'Optimization', prerequisites: ['critical-points', 'monotonicity'] },
    { id: 'newtons-method', name: "Newton's Method", prerequisites: ['linear-approximation', 'derivative-function'] },

    // Integration and its applications
    { id: 'antiderivatives', name: 'Antiderivatives', prerequisites: ['basic-rules'] },
    { id: 'riemann-sums', name: 'Riemann Sums', prerequisites: ['limit-concept', 'graphs'] },
    { id: 'definite-integrals', name: 'Definite Integrals', prerequisites: ['riemann-sums'] },
    { id: 'ftc-one', name: 'FTC: Accumulation Functions', prerequisites: ['definite-integrals', 'continuity'] },
    { id: 'ftc-two', name: 'FTC: Evaluating Integrals', prerequisites: ['antiderivatives', 'definite-integrals'] },
    { id: 'u-substitution', name: 'Substitution', prerequisites: ['chain-rule', 'ftc-two'] },
    { id: 'net-change', name: 'Net Change', prerequisites: ['ftc-two', 'velocity-acceleration'] },
    { id: 'area-between-curves', name: 'Area Between Curves', prerequisites: ['ftc-two', 'graphs'] },
    { id: 'average-value', name: 'Average Value of a Function', prerequisites: ['definite-integrals', 'ftc-two'] },
  ],
}
