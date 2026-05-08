(function exposeProblemBank(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.TEXNIQUE_BANK = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createExports() {
  "use strict";

  const EULER_ACCESS_CODE = "eulercircle";

  const LEAGUES = [
    {
      id: "leibniz",
      name: "Leibniz League",
      badge: "L",
      tiers: [1, 2],
      accent: "#4fb6a8",
      brief: "Notation fluency, operators, fractions, functions, and limits."
    },
    {
      id: "gauss",
      name: "Gauss League",
      badge: "G",
      tiers: [2, 3],
      accent: "#d3a83f",
      brief: "Series, congruences, vectors, matrices, and number theory."
    },
    {
      id: "galois",
      name: "Galois League",
      badge: "A",
      tiers: [3, 4],
      accent: "#8f9bb3",
      brief: "Groups, fields, rings, morphisms, kernels, and algebraic notation."
    },
    {
      id: "newton",
      name: "Newton League",
      badge: "N",
      tiers: [3, 4, 5],
      accent: "#6d9ee8",
      brief: "Calculus, differential equations, tensors, and mechanics."
    },
    {
      id: "euclid",
      name: "Euclid League",
      badge: "E",
      tiers: [4, 5],
      accent: "#d77a61",
      brief: "Geometry, topology, manifolds, measures, and proof-heavy structures."
    },
    {
      id: "euler-circle",
      name: "Euler Circle",
      badge: "EC",
      tiers: [5, 6],
      accent: "#b86adf",
      brief: "Locked elite league with the hardest mixed notation in the bank.",
      locked: true
    }
  ];

  function problem(id, tier, category, title, pretty, answer, aliases, hint) {
    return {
      id,
      tier,
      category,
      title,
      pretty,
      answer,
      aliases: aliases || [],
      hint,
      prompt: `Type the TeX for ${pretty}`
    };
  }

  function add(output, tier, category, title, pretty, answer, aliases, hint) {
    output.push(problem(`${slug(category)}-${output.length + 1}`, tier, category, title, pretty, answer, aliases, hint));
  }

  function slug(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function createProblemBank() {
    const output = [];

    const symbols = [
      ["Greek", "alpha", "alpha", "α", "\\alpha"],
      ["Greek", "beta", "beta", "β", "\\beta"],
      ["Greek", "gamma", "gamma", "γ", "\\gamma"],
      ["Greek", "delta", "delta", "δ", "\\delta"],
      ["Greek", "epsilon", "epsilon", "ε", "\\epsilon"],
      ["Greek", "varepsilon", "varepsilon", "ε variant", "\\varepsilon"],
      ["Greek", "theta", "theta", "θ", "\\theta"],
      ["Greek", "vartheta", "vartheta", "θ variant", "\\vartheta"],
      ["Greek", "lambda", "lambda", "λ", "\\lambda"],
      ["Greek", "mu", "mu", "μ", "\\mu"],
      ["Greek", "pi", "pi", "π", "\\pi"],
      ["Greek", "rho", "rho", "ρ", "\\rho"],
      ["Greek", "sigma", "sigma", "σ", "\\sigma"],
      ["Greek", "phi", "phi", "φ", "\\phi"],
      ["Greek", "varphi", "varphi", "φ variant", "\\varphi"],
      ["Greek", "omega", "omega", "ω", "\\omega"],
      ["Greek", "Gamma", "Gamma", "Γ", "\\Gamma"],
      ["Greek", "Delta", "Delta", "Δ", "\\Delta"],
      ["Greek", "Theta", "Theta", "Θ", "\\Theta"],
      ["Greek", "Lambda", "Lambda", "Λ", "\\Lambda"],
      ["Greek", "Sigma", "Sigma", "Σ", "\\Sigma"],
      ["Greek", "Omega", "Omega", "Ω", "\\Omega"],
      ["Relations", "less or equal", "≤", "≤", "\\leq"],
      ["Relations", "greater or equal", "≥", "≥", "\\geq"],
      ["Relations", "not equal", "≠", "≠", "\\neq"],
      ["Relations", "approximately", "≈", "≈", "\\approx"],
      ["Relations", "equivalent", "≡", "≡", "\\equiv"],
      ["Relations", "proportional", "∝", "∝", "\\propto"],
      ["Relations", "infinity", "∞", "∞", "\\infty"],
      ["Relations", "maps to", "↦", "↦", "\\mapsto"],
      ["Relations", "right arrow", "→", "→", "\\to"],
      ["Relations", "implies", "⇒", "⇒", "\\Rightarrow"],
      ["Relations", "if and only if", "⇔", "⇔", "\\Leftrightarrow"],
      ["Relations", "belongs to", "∈", "∈", "\\in"],
      ["Relations", "not belongs to", "∉", "∉", "\\notin"],
      ["Relations", "subset", "⊂", "⊂", "\\subset"],
      ["Relations", "subset equal", "⊆", "⊆", "\\subseteq"],
      ["Relations", "union", "∪", "∪", "\\cup"],
      ["Relations", "intersection", "∩", "∩", "\\cap"],
      ["Relations", "for all", "∀", "∀", "\\forall"],
      ["Relations", "exists", "∃", "∃", "\\exists"],
      ["Relations", "empty set", "∅", "∅", "\\emptyset"]
    ];

    symbols.forEach(([category, title, pretty, display, answer]) => {
      add(output, 1, category, title, display || pretty, answer, [], `Use ${answer}.`);
    });

    const baseTemplates = [
      [1, "Accents", "hat x", "x-hat", "\\hat{x}", ["\\widehat{x}"], "Wrap x in hat."],
      [1, "Accents", "bar x", "x-bar", "\\bar{x}", [], "Use bar."],
      [1, "Accents", "tilde theta", "theta-tilde", "\\tilde{\\theta}", [], "Put theta inside tilde."],
      [1, "Accents", "vector v", "v with arrow", "\\vec{v}", [], "Use vec."],
      [1, "Accents", "dot x", "x dot", "\\dot{x}", [], "Use dot."],
      [1, "Accents", "double dot x", "x double dot", "\\ddot{x}", [], "Use ddot."],
      [2, "Algebra", "fraction", "a/(b+c)", "\\frac{a}{b+c}", [], "Use frac with two braced arguments."],
      [2, "Algebra", "nested fraction", "(x+1)/(y-1)", "\\frac{x+1}{y-1}", [], "Keep numerator and denominator braced."],
      [2, "Algebra", "square root", "sqrt(x^2+1)", "\\sqrt{x^2+1}", ["\\sqrt{x^{2}+1}"], "Use sqrt."],
      [2, "Algebra", "cube root", "cube root of x+1", "\\sqrt[3]{x+1}", [], "Use optional root index."],
      [2, "Algebra", "binomial", "n choose k", "\\binom{n}{k}", [], "Use binom."],
      [2, "Algebra", "log base two", "log base 2 of n", "\\log_2 n", ["\\log_{2} n"], "Subscript the base."],
      [2, "Algebra", "absolute value", "|x-a|", "\\lvert x-a \\rvert", ["|x-a|", "\\left|x-a\\right|"], "Use vertical bars or lvert/rvert."],
      [2, "Algebra", "floor", "floor x", "\\lfloor x \\rfloor", [], "Use floor delimiters."],
      [2, "Algebra", "ceiling", "ceiling x", "\\lceil x \\rceil", [], "Use ceiling delimiters."],
      [2, "Operators", "sine squared", "sin squared theta", "\\sin^2 \\theta", ["\\sin^{2}\\theta"], "Exponent the operator."],
      [2, "Operators", "exponential", "e to i pi", "e^{i\\pi}", [], "Use pi inside the exponent."],
      [3, "Calculus", "limit", "lim x to 0 f(x)", "\\lim_{x\\to 0} f(x)", ["\\lim_{x \\to 0} f(x)"], "Subscript the limit condition."],
      [3, "Calculus", "derivative", "dy over dx", "\\frac{dy}{dx}", [], "Use frac."],
      [3, "Calculus", "partial derivative", "partial f over partial x", "\\frac{\\partial f}{\\partial x}", [], "Use partial in numerator and denominator."],
      [3, "Calculus", "second derivative", "d squared y over dx squared", "\\frac{d^2y}{dx^2}", ["\\frac{d^{2}y}{dx^{2}}"], "Put powers on d and x."],
      [3, "Calculus", "definite integral", "integral 0 to 1 x squared dx", "\\int_0^1 x^2\\,dx", ["\\int_{0}^{1}x^{2}\\,dx", "\\int_0^1 x^2 dx"], "Use bounds and dx."],
      [3, "Calculus", "summation", "sum i equals 1 to n of i squared", "\\sum_{i=1}^n i^2", ["\\sum_{i=1}^{n}i^{2}"], "Use sum with bounds."],
      [3, "Calculus", "product", "product k equals 1 to n of k", "\\prod_{k=1}^n k", ["\\prod_{k=1}^{n}k"], "Use prod with bounds."],
      [3, "Vector Calculus", "gradient", "nabla f", "\\nabla f", [], "Use nabla."],
      [3, "Vector Calculus", "divergence", "nabla dot F", "\\nabla\\cdot F", ["\\nabla \\cdot F"], "Use cdot."],
      [3, "Vector Calculus", "curl", "nabla cross F", "\\nabla\\times F", ["\\nabla \\times F"], "Use times."],
      [4, "Matrices", "two by two matrix", "pmatrix a b c d", "\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}", [], "Use pmatrix, ampersands, and row breaks."],
      [4, "Matrices", "determinant", "determinant a b c d", "\\begin{vmatrix}a&b\\\\c&d\\end{vmatrix}", [], "Use vmatrix."],
      [4, "Structures", "cases", "piecewise absolute value", "f(x)=\\begin{cases}x&x\\geq0\\\\-x&x<0\\end{cases}", [], "Use cases with two rows."],
      [4, "Structures", "aligned equations", "aligned x equals 1 y equals 2", "\\begin{aligned}x&=1\\\\y&=2\\end{aligned}", [], "Use aligned."],
      [4, "Structures", "norm", "norm v sub 2", "\\lVert v \\rVert_2", ["\\|v\\|_2"], "Use lVert and rVert."],
      [4, "Structures", "set builder", "x in R such that x positive", "\\{x\\in\\mathbb{R}\\mid x>0\\}", [], "Escape braces and use mid."],
      [4, "Structures", "inner product", "inner product u v", "\\langle u,v\\rangle", ["\\langle u, v\\rangle"], "Use angle brackets."],
      [4, "Structures", "tensor product", "V tensor W", "V\\otimes W", ["V \\otimes W"], "Use otimes."],
      [4, "Structures", "direct sum", "V direct sum W", "V\\oplus W", ["V \\oplus W"], "Use oplus."],
      [5, "Advanced Analysis", "Lp norm", "L p norm of f", "\\lVert f\\rVert_{L^p}", ["\\|f\\|_{L^p}"], "Use L^p in the subscript."],
      [5, "Advanced Analysis", "weak convergence", "u n weakly to u", "u_n\\rightharpoonup u", ["u_{n}\\rightharpoonup u"], "Use rightharpoonup."],
      [5, "Advanced Analysis", "sobolev space", "H one zero omega", "H_0^1(\\Omega)", ["H^{1}_{0}(\\Omega)"], "Use subscript and exponent."],
      [5, "Advanced Analysis", "distribution pairing", "pairing T phi", "\\langle T,\\varphi\\rangle", [], "Use angle brackets and varphi."],
      [5, "Topology", "fundamental group", "pi one of X x zero", "\\pi_1(X,x_0)", ["\\pi_{1}(X,x_{0})"], "Use pi with subscript."],
      [5, "Topology", "homology group", "H n of X Z", "H_n(X;\\mathbb{Z})", ["H_{n}(X;\\mathbb{Z})"], "Use semicolon before coefficients."],
      [5, "Geometry", "christoffel symbol", "Gamma i jk", "\\Gamma^i_{jk}", ["\\Gamma^{i}_{jk}"], "Use upper and lower indices."],
      [5, "Geometry", "riemann tensor", "R i j k l", "R^i{}_{jkl}", ["R^{i}{}_{jkl}"], "Use empty braces before lower indices."],
      [6, "Euler Circle", "zeta product", "zeta s euler product", "\\zeta(s)=\\prod_p\\frac{1}{1-p^{-s}}", [], "Use prod over p and a reciprocal fraction."],
      [6, "Euler Circle", "fourier transform", "hat f xi integral", "\\hat f(\\xi)=\\int_{-\\infty}^{\\infty}f(x)e^{-2\\pi i x\\xi}\\,dx", [], "Use hat f, xi, and infinite integral."],
      [6, "Euler Circle", "stokes theorem", "integral boundary M omega", "\\int_{\\partial M}\\omega=\\int_M d\\omega", [], "Use partial M and d omega."],
      [6, "Euler Circle", "yoneda shape", "Nat Hom A dash F", "\\operatorname{Nat}(\\operatorname{Hom}(A,-),F)\\cong F(A)", [], "Use operatorname for Nat and Hom."],
      [6, "Euler Circle", "galois group", "Gal L over K", "\\operatorname{Gal}(L/K)", [], "Use operatorname."],
      [6, "Euler Circle", "spectral sequence", "E two pq", "E_2^{p,q}\\Rightarrow H^{p+q}", ["E^{p,q}_{2}\\Rightarrow H^{p+q}"], "Use both lower and upper indices."]
    ];

    baseTemplates.forEach(([tier, category, title, pretty, answer, aliases, hint]) => {
      add(output, tier, category, title, pretty, answer, aliases, hint);
    });

    const variables = ["x", "y", "z", "t", "u", "v", "w", "n", "k", "m", "r", "s"];
    variables.forEach((name) => {
      add(output, 2, "Algebra", `${name} with subscript i and exponent 2`, `${name}_i^2`, `${name}_i^2`, [`${name}_{i}^{2}`, `${name}^2_i`], "Combine subscript and exponent.");
      add(output, 2, "Algebra", `fraction with ${name}`, `${name}/(${name}^2+1)`, `\\frac{${name}}{${name}^2+1}`, [`\\frac{${name}}{${name}^{2}+1}`], "Use frac and a polynomial denominator.");
      add(output, 3, "Calculus", `partial derivative in ${name}`, `partial u over partial ${name}`, `\\frac{\\partial u}{\\partial ${name}}`, [], "Use partial in both places.");
      add(output, 4, "Structures", `bold ${name}`, `bold ${name}`, `\\mathbf{${name}}`, [], "Use mathbf.");
      add(output, 5, "Advanced Analysis", `weak derivative ${name}`, `D_${name}u`, `D_${name}u`, [`D_{${name}}u`], "Use D with a subscript.");
    });

    const functions = ["f", "g", "h", "u", "v", "\\phi", "\\psi", "\\eta"];
    const domains = ["\\Omega", "M", "X", "Y", "\\mathbb{R}^n", "\\mathbb{C}"];
    functions.forEach((fn, index) => {
      const domain = domains[index % domains.length];
      add(output, 3, "Calculus", `integral of ${fn}`, `integral over ${domain}`, `\\int_${domain} ${fn}\\,d\\mu`, [`\\int_{${domain}}${fn}\\,d\\mu`], "Use an integral over a domain and d mu.");
      add(output, 4, "Structures", `map ${fn}`, `${fn}: X to Y`, `${fn}:X\\to Y`, [`${fn}: X \\to Y`], "Use colon and to.");
      add(output, 5, "Advanced Analysis", `support ${fn}`, `support of ${fn}`, "\\operatorname{supp} " + fn, [], "Use operatorname for supp.");
      add(output, 6, "Euler Circle", `functional ${fn}`, `dual pairing with ${fn}`, `\\langle ${fn},\\varphi\\rangle`, [], "Use pairing brackets.");
    });

    const lowerUpper = [
      ["i=1", "n"],
      ["k=0", "N"],
      ["j\\in J", ""],
      ["p", ""],
      ["0", "\\infty"],
      ["-\\infty", "\\infty"],
      ["a", "b"],
      ["\\partial M", ""]
    ];
    lowerUpper.forEach(([lower, upper], index) => {
      const upperPart = upper ? `^${upper}` : "";
      const upperAlias = upper ? `^{${upper}}` : "";
      add(output, 3, "Series", `sum ${index + 1}`, `sum from ${lower}${upper ? ` to ${upper}` : ""}`, `\\sum_{${lower}}${upperPart}`, [`\\sum_{${lower}}${upperAlias}`], "Use sum with the displayed bounds.");
      add(output, 3, "Series", `product ${index + 1}`, `product from ${lower}${upper ? ` to ${upper}` : ""}`, `\\prod_{${lower}}${upperPart}`, [`\\prod_{${lower}}${upperAlias}`], "Use prod with the displayed bounds.");
      add(output, 4, "Calculus", `integral ${index + 1}`, `integral from ${lower}${upper ? ` to ${upper}` : ""}`, `\\int_{${lower}}${upperPart}`, [`\\int_{${lower}}${upperAlias}`], "Use int with the displayed bounds.");
    });

    const groupLetters = ["G", "H", "K", "N", "R", "S", "V", "W", "A", "B", "C", "D"];
    groupLetters.forEach((letter) => {
      add(output, 4, "Algebraic Structures", `blackboard ${letter}`, `blackboard ${letter}`, `\\mathbb{${letter}}`, [], "Use mathbb.");
      add(output, 4, "Algebraic Structures", `calligraphic ${letter}`, `calligraphic ${letter}`, `\\mathcal{${letter}}`, [], "Use mathcal.");
      add(output, 4, "Algebraic Structures", `fraktur ${letter}`, `fraktur ${letter}`, `\\mathfrak{${letter}}`, [], "Use mathfrak.");
      add(output, 5, "Algebraic Structures", `hom ${letter}`, `Hom(${letter},X)`, `\\operatorname{Hom}(${letter},X)`, [], "Use operatorname Hom.");
      add(output, 5, "Algebraic Structures", `automorphism ${letter}`, `Aut(${letter})`, `\\operatorname{Aut}(${letter})`, [], "Use operatorname Aut.");
    });

    const matrices = [
      ["a", "b", "c", "d"],
      ["1", "0", "0", "1"],
      ["x", "y", "z", "w"],
      ["\\lambda", "0", "0", "\\mu"],
      ["\\cos\\theta", "-\\sin\\theta", "\\sin\\theta", "\\cos\\theta"]
    ];
    matrices.forEach((entry, index) => {
      add(output, 4, "Matrices", `matrix ${index + 1}`, `2 by 2 matrix ${index + 1}`, `\\begin{pmatrix}${entry[0]}&${entry[1]}\\\\${entry[2]}&${entry[3]}\\end{pmatrix}`, [], "Use pmatrix with two rows.");
      add(output, 4, "Matrices", `determinant ${index + 1}`, `2 by 2 determinant ${index + 1}`, `\\begin{vmatrix}${entry[0]}&${entry[1]}\\\\${entry[2]}&${entry[3]}\\end{vmatrix}`, [], "Use vmatrix.");
      add(output, 5, "Matrices", `trace ${index + 1}`, `trace of matrix ${index + 1}`, "\\operatorname{tr} A", [], "Use operatorname tr.");
    });

    const advancedPairs = [
      ["\\alpha", "\\beta"],
      ["\\omega", "\\eta"],
      ["u", "v"],
      ["X", "Y"],
      ["A", "B"],
      ["M", "N"],
      ["p", "q"],
      ["r", "s"],
      ["\\lambda", "\\mu"],
      ["\\sigma", "\\tau"]
    ];
    advancedPairs.forEach(([left, right], index) => {
      add(output, 5, "Geometry", `wedge ${index + 1}`, `${left} wedge ${right}`, `${left}\\wedge ${right}`, [`${left} \\wedge ${right}`], "Use wedge.");
      add(output, 5, "Geometry", `tensor ${index + 1}`, `${left} tensor ${right}`, `${left}\\otimes ${right}`, [`${left} \\otimes ${right}`], "Use otimes.");
      add(output, 5, "Topology", `cohomology ${index + 1}`, `H ${index} of X`, `H^${index}(X;\\mathbb{R})`, [`H^{${index}}(X;\\mathbb{R})`], "Use cohomology notation with coefficients.");
      add(output, 6, "Euler Circle", `commutator ${index + 1}`, `commutator ${left} ${right}`, `[${left},${right}]`, [`[${left}, ${right}]`], "Use square brackets.");
      add(output, 6, "Euler Circle", `Ext ${index + 1}`, `Ext ${index} A B`, `\\operatorname{Ext}^${index}(A,B)`, [`\\operatorname{Ext}^{${index}}(A,B)`], "Use operatorname Ext with exponent.");
    });

    const pdes = [
      ["heat equation", "u_t equals Delta u", "u_t=\\Delta u"],
      ["wave equation", "u_tt equals c squared Delta u", "u_{tt}=c^2\\Delta u"],
      ["laplace equation", "Delta u equals zero", "\\Delta u=0"],
      ["poisson equation", "minus Delta u equals f", "-\\Delta u=f"],
      ["navier stokes fragment", "partial t u plus u dot nabla u", "\\partial_t u+u\\cdot\\nabla u"],
      ["schrodinger fragment", "i partial t psi equals H psi", "i\\partial_t\\psi=H\\psi"],
      ["euler lagrange", "d dx partial L partial y prime", "\\frac{d}{dx}\\frac{\\partial L}{\\partial y'}"]
    ];
    pdes.forEach(([title, pretty, answer]) => {
      add(output, 5, "Differential Equations", title, pretty, answer, [], "Use compact derivative and operator notation.");
      add(output, 6, "Euler Circle", `${title} weak form`, `weak form ${pretty}`, `\\int_\\Omega ${answer}\\,dx`, [`\\int_{\\Omega}${answer}\\,dx`], "Wrap the expression in an integral over Omega.");
    });

    const indices = ["i", "j", "k", "n", "p", "q", "r", "s"];
    const spaces = ["X", "Y", "M", "N", "\\Omega", "\\Sigma", "\\mathbb{R}^n", "\\mathbb{P}^n"];
    indices.forEach((idx, index) => {
      const space = spaces[index % spaces.length];
      add(output, 5, "Measure Theory", `sigma algebra ${idx}`, `sigma algebra on ${space}`, "\\mathcal{B}(" + space + ")", [], "Use mathcal B around the space.");
      add(output, 5, "Measure Theory", `indicator ${idx}`, `indicator of A_${idx}`, "\\mathbf{1}_{A_" + idx + "}", ["\\mathbf{1}_{A_{" + idx + "}}"], "Use bold 1 with a subscript.");
      add(output, 5, "Probability", `conditional expectation ${idx}`, `E X given F_${idx}`, "\\mathbb{E}[X\\mid\\mathcal{F}_" + idx + "]", ["\\mathbb{E}[X\\mid\\mathcal{F}_{" + idx + "}]"], "Use mathbb E and mid.");
      add(output, 5, "Probability", `variance ${idx}`, `Var X_${idx}`, "\\operatorname{Var}(X_" + idx + ")", ["\\operatorname{Var}(X_{" + idx + "})"], "Use operatorname Var.");
      add(output, 6, "Euler Circle", `derived functor ${idx}`, `R ${idx} F of A`, "R^" + idx + "F(A)", ["R^{" + idx + "}F(A)"], "Use a right derived functor exponent.");
      add(output, 6, "Euler Circle", `sheaf cohomology ${idx}`, `H ${idx} X F`, "H^" + idx + "(X,\\mathcal{F})", ["H^{" + idx + "}(X,\\mathcal{F})"], "Use cohomology with a sheaf.");
    });

    const forms = ["\\omega", "\\eta", "\\alpha", "\\beta", "\\gamma", "\\theta"];
    const vectorFields = ["X", "Y", "Z", "V", "W", "\\xi"];
    forms.forEach((form, formIndex) => {
      vectorFields.forEach((field, fieldIndex) => {
        const level = formIndex + fieldIndex > 6 ? 6 : 5;
        add(output, level, "Differential Geometry", `lie derivative ${formIndex}-${fieldIndex}`, `Lie derivative ${field} ${form}`, "\\mathcal{L}_" + field + form, ["\\mathcal{L}_{" + field + "}" + form], "Use calligraphic L with the vector field subscript.");
        add(output, level, "Differential Geometry", `interior product ${formIndex}-${fieldIndex}`, `interior product ${field} ${form}`, "\\iota_" + field + form, ["\\iota_{" + field + "}" + form], "Use iota with a subscript.");
      });
    });

    const algebraObjects = ["A", "B", "C", "R", "S", "M", "N", "V", "W"];
    algebraObjects.forEach((object, index) => {
      add(output, 5, "Commutative Algebra", `localization ${object}`, `${object} localized at p`, object + "_{\\mathfrak{p}}", [], "Use a fraktur p subscript.");
      add(output, 5, "Commutative Algebra", `spectrum ${object}`, `Spec ${object}`, "\\operatorname{Spec} " + object, [], "Use operatorname Spec.");
      add(output, 5, "Commutative Algebra", `projective spectrum ${object}`, `Proj ${object}`, "\\operatorname{Proj} " + object, [], "Use operatorname Proj.");
      add(output, 6, "Euler Circle", `derived tensor ${object}`, `${object} derived tensor B`, object + "\\otimes_A^{\\mathbf{L}}B", [], "Use otimes with a derived superscript.");
      add(output, 6, "Euler Circle", `tor ${object}`, `Tor ${index} A B`, "\\operatorname{Tor}_" + index + "^A(" + object + ",B)", ["\\operatorname{Tor}_{" + index + "}^{A}(" + object + ",B)"], "Use operatorname Tor with lower and upper indices.");
    });

    const theoremFragments = [
      ["bayes", "P A given B", "\\mathbb{P}(A\\mid B)=\\frac{\\mathbb{P}(B\\mid A)\\mathbb{P}(A)}{\\mathbb{P}(B)}"],
      ["cauchy integral", "f z as contour integral", "f(z)=\\frac{1}{2\\pi i}\\int_\\gamma\\frac{f(\\zeta)}{\\zeta-z}\\,d\\zeta"],
      ["green identity", "green first identity", "\\int_\\Omega u\\Delta v\\,dx=-\\int_\\Omega\\nabla u\\cdot\\nabla v\\,dx+\\int_{\\partial\\Omega}u\\frac{\\partial v}{\\partial n}\\,dS"],
      ["riemann roch", "riemann roch curve", "\\ell(D)-\\ell(K-D)=\\deg D+1-g"],
      ["parseval", "parseval identity", "\\sum_{n\\in\\mathbb{Z}}|\\hat f(n)|^2=\\int_0^1|f(x)|^2\\,dx"],
      ["gauss bonnett", "gauss bonnett", "\\int_M K\\,dA=2\\pi\\chi(M)"]
    ];
    theoremFragments.forEach(([title, pretty, answer]) => {
      add(output, 6, "Euler Circle", title, pretty, answer, [], "Type the full theorem fragment.");
    });

    return output;
  }

  return { createProblemBank, LEAGUES, EULER_ACCESS_CODE };
});
