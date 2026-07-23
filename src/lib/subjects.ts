// Shared subject → topic taxonomy used by both the Generate flow and the
// Arena game selector. Kept free of React/icon imports so it can be used from
// any client or server module.

export const CATEGORY_IDS = [
  'Mathematics',
  'Science',
  'English & Writing',
  'History & Social Studies',
  'Test Prep',
  'Computer Science',
  'Languages',
  'Arts & Music',
  'Business & Economics',
  'Health & PE',
  'Philosophy & Psychology',
  'Other',
] as const

// ── Category → subjects ──
export const SUBJECTS_BY_CATEGORY: Record<string, string[]> = {
  Mathematics: ['Algebra', 'Geometry', 'Pre-Calculus', 'Calculus AB', 'Calculus BC', 'Statistics', 'Linear Algebra', 'Differential Equations', 'Trigonometry', 'Discrete Math', 'Number Theory'],
  Science: ['Biology', 'Chemistry', 'Physics', 'AP Biology', 'AP Chemistry', 'AP Physics 1', 'AP Physics 2', 'AP Physics C', 'Environmental Science', 'Anatomy', 'Biochemistry', 'Organic Chemistry', 'Astronomy', 'Earth Science'],
  'English & Writing': ['English Literature', 'Essay Writing', 'Creative Writing', 'Grammar', 'Vocabulary', 'AP English Language', 'AP English Literature', 'Reading Comprehension', 'Public Speaking', 'Journalism'],
  'History & Social Studies': ['US History', 'World History', 'AP US History', 'AP World History', 'AP European History', 'Government & Politics', 'AP Government', 'Economics', 'AP Economics', 'Microeconomics', 'Macroeconomics', 'Geography', 'Sociology', 'Psychology', 'AP Psychology'],
  'Test Prep': ['SAT Math', 'SAT Reading & Writing', 'ACT Math', 'ACT English', 'ACT Science', 'ACT Reading', 'GMAT', 'GRE', 'LSAT', 'MCAT', 'TOEFL', 'IELTS', 'GED', 'ASVAB'],
  'Computer Science': ['Introduction to CS', 'Python', 'Java', 'C++', 'JavaScript', 'Data Structures', 'Algorithms', 'AP Computer Science A', 'AP Computer Science Principles', 'Web Development', 'Database Management', 'Machine Learning Basics'],
  Languages: ['Spanish', 'French', 'Mandarin Chinese', 'Arabic', 'German', 'Italian', 'Portuguese', 'Japanese', 'Korean', 'Russian', 'Turkish', 'Hindi', 'Hebrew', 'Latin'],
  'Arts & Music': ['Art History', 'Music Theory', 'AP Art History', 'AP Music Theory', 'Film Studies', 'Theater'],
  'Business & Economics': ['Accounting', 'Finance', 'Marketing', 'Business Management', 'Entrepreneurship', 'Personal Finance', 'Supply Chain'],
  'Health & PE': ['Health Education', 'Nutrition', 'Sports Science', 'Kinesiology', 'First Aid'],
  'Philosophy & Psychology': ['Philosophy', 'Ethics', 'AP Psychology', 'Introduction to Psychology', 'Cognitive Science'],
  Other: [],
}

// ── Subject → topics ──
const CALC_AB = ['Limits and Continuity', 'Derivatives', 'Chain Rule', 'Implicit Differentiation', 'Related Rates', 'Optimization', 'Riemann Sums', 'Definite Integrals', 'Fundamental Theorem of Calculus', 'U-Substitution', 'Area Between Curves', 'Volumes of Revolution', 'Differential Equations']
const BIOLOGY = ['Cell Structure', 'Mitosis & Meiosis', 'DNA & RNA', 'Protein Synthesis', 'Genetics & Heredity', 'Natural Selection', 'Ecosystems', 'Photosynthesis', 'Cellular Respiration', 'Human Body Systems', 'Evolution', 'Classification']
const CHEMISTRY = ['Atomic Structure', 'Periodic Table', 'Chemical Bonding', 'Stoichiometry', 'Chemical Reactions', 'Acids & Bases', 'Thermochemistry', 'Gas Laws', 'Solutions & Molarity', 'Equilibrium', 'Redox Reactions', 'Electrochemistry']
const PHYSICS = ['Kinematics', "Newton's Laws", 'Forces', 'Work & Energy', 'Momentum', 'Circular Motion', 'Gravitation', 'Waves', 'Sound', 'Optics', 'Electricity', 'Magnetism', 'Thermodynamics']
const US_HISTORY = ['Colonial America', 'American Revolution', 'The Constitution', 'Civil War', 'Reconstruction', 'Industrial Revolution', 'World War I', 'Great Depression', 'World War II', 'Civil Rights Movement', 'Cold War', 'Modern America']
const WORLD_HISTORY = ['Ancient Civilizations', 'Classical Empires', 'The Middle Ages', 'The Renaissance', 'Age of Exploration', 'Enlightenment', 'Industrial Revolution', 'World Wars', 'Cold War', 'Decolonization', 'Globalization']
const ECONOMICS = ['Supply & Demand', 'Elasticity', 'Market Structures', 'GDP', 'Inflation', 'Unemployment', 'Fiscal Policy', 'Monetary Policy', 'International Trade', 'Economic Systems']
const PSYCHOLOGY = ['Research Methods', 'Biological Bases of Behavior', 'Sensation & Perception', 'Learning', 'Memory', 'Cognition', 'Motivation & Emotion', 'Developmental Psychology', 'Personality', 'Psychological Disorders', 'Social Psychology']
const GOVERNMENT = ['The Constitution', 'Federalism', 'Branches of Government', 'Congress', 'The Presidency', 'The Judiciary', 'Civil Liberties', 'Civil Rights', 'Political Parties', 'Elections', 'Public Policy']
const SAT_MATH = ['Heart of Algebra', 'Problem Solving & Data Analysis', 'Passport to Advanced Math', 'Additional Topics', 'Linear Equations', 'Quadratics', 'Statistics', 'Geometry', 'Trigonometry']
const JAVA = ['Variables & Data Types', 'Control Flow', 'Methods', 'Arrays', 'Classes & Objects', 'Inheritance', 'Polymorphism', 'Interfaces', 'Exception Handling', 'Collections']
const ART_HISTORY = ['Prehistoric Art', 'Ancient Art', 'Renaissance', 'Baroque', 'Impressionism', 'Modern Art', 'Contemporary Art', 'Art Movements', 'Famous Artists', 'Analyzing Artworks']
const MUSIC_THEORY = ['Notes & Rhythm', 'Scales', 'Key Signatures', 'Intervals', 'Chords', 'Chord Progressions', 'Harmony', 'Melody', 'Time Signatures', 'Sight Reading']
const LANGUAGE_TOPICS = ['Vocabulary', 'Grammar Basics', 'Verb Conjugation', 'Present Tense', 'Past Tense', 'Future Tense', 'Sentence Structure', 'Reading Comprehension', 'Listening Practice', 'Common Phrases', 'Numbers & Dates', 'Pronunciation', 'Everyday Conversation', 'Culture']
const DEFAULT_TOPICS = ['Fundamentals', 'Key Concepts', 'Core Principles', 'Common Problem Types', 'Practice Problems', 'Advanced Topics', 'Real-World Applications', 'Review & Test Prep']

export const TOPICS_BY_SUBJECT: Record<string, string[]> = {
  // Mathematics
  Algebra: ['Linear Equations', 'Systems of Equations', 'Quadratic Equations', 'Polynomials', 'Factoring', 'Inequalities', 'Functions', 'Exponents & Radicals', 'Rational Expressions', 'Absolute Value', 'Sequences & Series', 'Word Problems'],
  Geometry: ['Angles & Lines', 'Triangles', 'Congruence & Similarity', 'Circles', 'Polygons', 'Area & Perimeter', 'Surface Area & Volume', 'Coordinate Geometry', 'Transformations', 'Pythagorean Theorem', 'Proofs', 'Trigonometric Ratios'],
  'Pre-Calculus': ['Functions & Graphs', 'Polynomial Functions', 'Rational Functions', 'Exponential & Logarithmic Functions', 'Trigonometric Functions', 'Trig Identities', 'Unit Circle', 'Sequences & Series', 'Vectors', 'Polar Coordinates', 'Conic Sections', 'Intro to Limits'],
  'Calculus AB': CALC_AB,
  'Calculus BC': [...CALC_AB, 'Integration by Parts', 'Partial Fractions', 'Improper Integrals', 'Parametric Equations', 'Polar Calculus', 'Infinite Series', 'Taylor & Maclaurin Series', 'Convergence Tests'],
  Statistics: ['Descriptive Statistics', 'Probability', 'Distributions', 'Normal Distribution', 'Sampling', 'Confidence Intervals', 'Hypothesis Testing', 'Regression', 'Correlation', 'Chi-Square Tests', 'Binomial Distribution'],
  'Linear Algebra': ['Vectors', 'Matrices', 'Matrix Operations', 'Determinants', 'Systems of Linear Equations', 'Vector Spaces', 'Linear Transformations', 'Eigenvalues & Eigenvectors', 'Dot & Cross Product', 'Orthogonality', 'Rank & Nullity'],
  'Differential Equations': ['First-Order ODEs', 'Separable Equations', 'Linear ODEs', 'Exact Equations', 'Second-Order ODEs', 'Homogeneous Equations', 'Laplace Transforms', 'Systems of ODEs', 'Series Solutions'],
  Trigonometry: ['Unit Circle', 'Trig Ratios', 'Trig Identities', 'Graphing Trig Functions', 'Inverse Trig', 'Law of Sines', 'Law of Cosines', 'Solving Triangles', 'Radians & Degrees', 'Trig Equations'],
  'Discrete Math': ['Logic', 'Set Theory', 'Proofs', 'Combinatorics', 'Permutations & Combinations', 'Graph Theory', 'Recursion', 'Number Theory', 'Relations & Functions', 'Boolean Algebra'],
  'Number Theory': ['Divisibility', 'Prime Numbers', 'GCD & LCM', 'Modular Arithmetic', 'Congruences', 'Diophantine Equations', "Fermat's Little Theorem", 'Number Bases'],
  // Science
  Biology: BIOLOGY,
  Chemistry: CHEMISTRY,
  Physics: PHYSICS,
  'AP Biology': [...BIOLOGY, 'Enzymes', 'Membrane Transport', 'Signal Transduction', 'Gene Expression', 'Biotechnology'],
  'AP Chemistry': [...CHEMISTRY, 'Kinetics', 'Reaction Mechanisms', 'Buffers', 'Titration', 'Entropy & Free Energy'],
  'AP Physics 1': ['Kinematics', 'Dynamics', 'Circular Motion', 'Energy', 'Momentum', 'Simple Harmonic Motion', 'Torque & Rotational Motion', 'Waves', 'Electric Charge & Force'],
  'AP Physics 2': ['Fluids', 'Thermodynamics', 'Electric Fields', 'Electric Potential', 'Circuits', 'Magnetism', 'Electromagnetic Induction', 'Optics', 'Modern Physics'],
  'AP Physics C': ['Kinematics', "Newton's Laws", 'Work & Energy', 'Momentum', 'Rotational Dynamics', 'Oscillations', 'Gravitation', 'Electrostatics', "Gauss's Law", 'Circuits', 'Magnetic Fields', "Faraday's Law"],
  'Environmental Science': ['Ecosystems', 'Biodiversity', 'Population Dynamics', 'Energy Resources', 'Pollution', 'Climate Change', 'Water Resources', 'Soil & Agriculture', 'Conservation', 'Sustainability'],
  Anatomy: ['Skeletal System', 'Muscular System', 'Nervous System', 'Cardiovascular System', 'Respiratory System', 'Digestive System', 'Endocrine System', 'Immune System', 'Urinary System', 'Reproductive System'],
  Biochemistry: ['Amino Acids', 'Proteins', 'Enzymes', 'Carbohydrates', 'Lipids', 'Nucleic Acids', 'Metabolism', 'Glycolysis', 'Krebs Cycle', 'Oxidative Phosphorylation'],
  'Organic Chemistry': ['Nomenclature', 'Alkanes & Alkenes', 'Functional Groups', 'Stereochemistry', 'Reaction Mechanisms', 'Substitution Reactions', 'Elimination Reactions', 'Alcohols & Ethers', 'Aromatic Compounds', 'Carbonyl Chemistry'],
  Astronomy: ['The Solar System', 'Stars', 'Galaxies', 'The Universe', 'Black Holes', 'Planetary Motion', 'Telescopes', 'Cosmology', 'Life Cycle of Stars', 'Light & Spectra'],
  'Earth Science': ['Plate Tectonics', 'Rocks & Minerals', 'The Rock Cycle', 'Weather & Climate', 'The Atmosphere', 'Oceans', 'Earthquakes & Volcanoes', 'Erosion & Weathering', "Earth's Layers", 'Natural Resources'],
  // English
  'English Literature': ['Literary Devices', 'Theme Analysis', 'Character Analysis', 'Poetry Analysis', 'Shakespeare', 'Novels', 'Short Stories', 'Symbolism', 'Narrative Structure', 'Literary Movements'],
  'Essay Writing': ['Thesis Statements', 'Essay Structure', 'Argumentative Essays', 'Persuasive Writing', 'Expository Essays', 'Introductions & Conclusions', 'Body Paragraphs', 'Transitions', 'Evidence & Citations', 'Revision'],
  'Creative Writing': ['Character Development', 'Plot Structure', 'Dialogue', 'Setting & Description', 'Point of View', "Show Don't Tell", 'Poetry', 'Short Fiction', 'World Building', 'Voice & Style'],
  Grammar: ['Parts of Speech', 'Sentence Structure', 'Punctuation', 'Subject-Verb Agreement', 'Verb Tenses', 'Pronouns', 'Modifiers', 'Clauses', 'Common Errors', 'Active vs Passive Voice'],
  Vocabulary: ['Root Words', 'Prefixes & Suffixes', 'Context Clues', 'Synonyms & Antonyms', 'Academic Vocabulary', 'SAT/ACT Words', 'Idioms', 'Connotation', 'Word Usage'],
  'AP English Language': ['Rhetorical Analysis', 'Argument', 'Synthesis', 'Ethos Pathos Logos', 'Tone & Diction', 'Rhetorical Devices', 'Claims & Evidence', 'Style Analysis'],
  'AP English Literature': ['Prose Analysis', 'Poetry Analysis', 'Literary Argument', 'Theme', 'Characterization', 'Figurative Language', 'Structure', 'Close Reading'],
  'Reading Comprehension': ['Main Idea', 'Supporting Details', 'Inference', "Author's Purpose", 'Tone', 'Text Structure', 'Vocabulary in Context', 'Summarizing', 'Comparing Texts'],
  'Public Speaking': ['Speech Structure', 'Persuasive Speaking', 'Delivery & Body Language', 'Audience Analysis', 'Overcoming Anxiety', 'Visual Aids', 'Rhetoric', 'Impromptu Speaking'],
  Journalism: ['News Writing', 'The Inverted Pyramid', 'Interviewing', 'Headlines', 'Ethics', 'Editing', 'Feature Writing', 'Fact-Checking'],
  // History & Social Studies
  'US History': US_HISTORY,
  'World History': WORLD_HISTORY,
  'AP US History': US_HISTORY,
  'AP World History': WORLD_HISTORY,
  'AP European History': ['Renaissance', 'Reformation', 'Age of Absolutism', 'Scientific Revolution', 'Enlightenment', 'French Revolution', 'Napoleon', 'Industrial Revolution', 'Nationalism', 'World Wars', 'Cold War'],
  'Government & Politics': GOVERNMENT,
  'AP Government': GOVERNMENT,
  Economics: ECONOMICS,
  'AP Economics': ECONOMICS,
  Microeconomics: ['Supply & Demand', 'Elasticity', 'Consumer Choice', 'Production & Costs', 'Perfect Competition', 'Monopoly', 'Oligopoly', 'Market Failure', 'Factor Markets'],
  Macroeconomics: ['GDP', 'Inflation', 'Unemployment', 'Aggregate Demand & Supply', 'Fiscal Policy', 'Monetary Policy', 'Money & Banking', 'Economic Growth', 'International Trade & Finance'],
  Geography: ['Physical Geography', 'Human Geography', 'Maps & Cartography', 'Climate & Biomes', 'Population', 'Urbanization', 'Migration', 'Economic Geography', 'Political Geography'],
  Sociology: ['Culture', 'Socialization', 'Social Structure', 'Deviance', 'Social Stratification', 'Race & Ethnicity', 'Gender', 'Family', 'Social Institutions', 'Social Change'],
  Psychology: PSYCHOLOGY,
  'AP Psychology': PSYCHOLOGY,
  // Test Prep
  'SAT Math': SAT_MATH,
  'SAT Reading & Writing': ['Command of Evidence', 'Words in Context', 'Expression of Ideas', 'Standard English Conventions', 'Reading Comprehension', 'Grammar', 'Rhetoric', 'Data Interpretation'],
  'ACT Math': ['Pre-Algebra', 'Elementary Algebra', 'Intermediate Algebra', 'Coordinate Geometry', 'Plane Geometry', 'Trigonometry', 'Statistics & Probability'],
  'ACT English': ['Grammar & Usage', 'Punctuation', 'Sentence Structure', 'Organization', 'Style', 'Rhetorical Skills'],
  'ACT Science': ['Data Representation', 'Research Summaries', 'Conflicting Viewpoints', 'Graph Analysis', 'Experimental Design'],
  'ACT Reading': ['Prose Fiction', 'Social Science', 'Humanities', 'Natural Science', 'Main Idea', 'Detail Questions'],
  GMAT: ['Quantitative Reasoning', 'Verbal Reasoning', 'Data Sufficiency', 'Problem Solving', 'Critical Reasoning', 'Reading Comprehension', 'Sentence Correction', 'Integrated Reasoning'],
  GRE: ['Verbal Reasoning', 'Quantitative Reasoning', 'Analytical Writing', 'Text Completion', 'Sentence Equivalence', 'Reading Comprehension', 'Data Analysis', 'Algebra & Geometry'],
  LSAT: ['Logical Reasoning', 'Analytical Reasoning', 'Reading Comprehension', 'Logic Games', 'Argument Analysis'],
  MCAT: ['Biology', 'Biochemistry', 'General Chemistry', 'Organic Chemistry', 'Physics', 'Psychology', 'Sociology', 'Critical Analysis'],
  TOEFL: ['Reading', 'Listening', 'Speaking', 'Writing', 'Academic Vocabulary', 'Note-Taking'],
  IELTS: ['Reading', 'Listening', 'Speaking', 'Writing', 'Academic Vocabulary'],
  GED: ['Math', 'Reasoning Through Language Arts', 'Science', 'Social Studies'],
  ASVAB: ['Arithmetic Reasoning', 'Word Knowledge', 'Paragraph Comprehension', 'Mathematics Knowledge', 'General Science', 'Mechanical Comprehension', 'Electronics Information'],
  // CS
  'Introduction to CS': ['Variables & Data Types', 'Control Flow', 'Loops', 'Functions', 'Arrays', 'Basic Algorithms', 'Debugging', 'Pseudocode', 'Boolean Logic'],
  Python: ['Variables & Data Types', 'Lists & Dictionaries', 'Loops', 'Functions', 'Conditionals', 'String Manipulation', 'File I/O', 'Classes & Objects', 'Error Handling', 'Modules & Libraries'],
  Java: JAVA,
  'C++': ['Variables & Data Types', 'Control Flow', 'Functions', 'Pointers', 'Arrays', 'Classes & Objects', 'Inheritance', 'Templates', 'Memory Management', 'STL'],
  JavaScript: ['Variables & Data Types', 'Functions', 'Arrays & Objects', 'DOM Manipulation', 'Events', 'Async & Promises', 'ES6 Features', 'Closures', 'Loops', 'Error Handling'],
  'Data Structures': ['Arrays', 'Linked Lists', 'Stacks', 'Queues', 'Hash Tables', 'Trees', 'Binary Search Trees', 'Heaps', 'Graphs', 'Tries'],
  Algorithms: ['Sorting Algorithms', 'Searching Algorithms', 'Recursion', 'Dynamic Programming', 'Greedy Algorithms', 'Graph Algorithms', 'Big O Notation', 'Divide & Conquer', 'Backtracking'],
  'AP Computer Science A': JAVA,
  'AP Computer Science Principles': ['Digital Information', 'The Internet', 'Programming', 'Algorithms', 'Data & Analysis', 'Cybersecurity', 'Impact of Computing', 'Abstraction'],
  'Web Development': ['HTML', 'CSS', 'JavaScript', 'Responsive Design', 'The DOM', 'APIs & Fetch', 'Flexbox & Grid', 'Forms', 'Accessibility', 'Version Control'],
  'Database Management': ['SQL Basics', 'SELECT Queries', 'Joins', 'Normalization', 'Keys & Relationships', 'Indexes', 'Transactions', 'Aggregation', 'Database Design'],
  'Machine Learning Basics': ['Supervised Learning', 'Unsupervised Learning', 'Linear Regression', 'Classification', 'Neural Networks', 'Training & Testing', 'Overfitting', 'Feature Engineering', 'Model Evaluation'],
  // Arts & Music
  'Art History': ART_HISTORY,
  'AP Art History': ART_HISTORY,
  'Music Theory': MUSIC_THEORY,
  'AP Music Theory': MUSIC_THEORY,
  'Film Studies': ['Film Analysis', 'Cinematography', 'Editing', 'Mise-en-scène', 'Genre', 'Directors', 'Film History', 'Narrative Techniques', 'Sound Design'],
  Theater: ['Acting Techniques', 'Stagecraft', 'Playwriting', 'Theater History', 'Directing', 'Character Analysis', 'Improvisation', 'Set Design'],
  // Business
  Accounting: ['The Accounting Equation', 'Journal Entries', 'Financial Statements', 'Balance Sheet', 'Income Statement', 'Debits & Credits', 'Depreciation', 'Inventory', 'Cash Flow'],
  Finance: ['Time Value of Money', 'Financial Statements', 'Risk & Return', 'Valuation', 'Interest Rates', 'Investments', 'Capital Budgeting', 'Financial Markets'],
  Marketing: ['The Marketing Mix', 'Market Research', 'Consumer Behavior', 'Branding', 'Segmentation', 'Digital Marketing', 'Advertising', 'Pricing Strategy'],
  'Business Management': ['Management Functions', 'Leadership', 'Organizational Structure', 'Motivation', 'Decision Making', 'Strategic Planning', 'Human Resources', 'Operations'],
  Entrepreneurship: ['Business Ideas', 'Business Plans', 'Market Validation', 'Funding', 'Startups', 'Marketing', 'Financial Basics', 'Scaling'],
  'Personal Finance': ['Budgeting', 'Saving', 'Credit & Debt', 'Investing Basics', 'Taxes', 'Banking', 'Insurance', 'Retirement Planning'],
  'Supply Chain': ['Logistics', 'Inventory Management', 'Procurement', 'Operations', 'Distribution', 'Demand Forecasting', 'Supply Chain Strategy'],
  // Health & PE
  'Health Education': ['Nutrition', 'Mental Health', 'Physical Fitness', 'Disease Prevention', 'Substance Abuse', 'Human Body Systems', 'First Aid Basics', 'Wellness'],
  Nutrition: ['Macronutrients', 'Micronutrients', 'Vitamins & Minerals', 'Healthy Eating', 'Calories & Energy', 'Digestion', 'Diet Planning', 'Food Labels'],
  'Sports Science': ['Exercise Physiology', 'Biomechanics', 'Training Principles', 'Muscle Function', 'Energy Systems', 'Nutrition for Athletes', 'Injury Prevention'],
  Kinesiology: ['Anatomy of Movement', 'Muscles & Joints', 'Biomechanics', 'Motor Control', 'Exercise Physiology', 'Posture & Gait'],
  'First Aid': ['CPR', 'Wound Care', 'Choking', 'Burns', 'Fractures', 'Shock', 'Emergency Response', 'Common Injuries'],
  // Philosophy & Psychology
  Philosophy: ['Logic', 'Ethics', 'Metaphysics', 'Epistemology', 'Ancient Philosophy', 'Modern Philosophy', 'Political Philosophy', 'Existentialism', 'Philosophy of Mind'],
  Ethics: ['Ethical Theories', 'Utilitarianism', 'Deontology', 'Virtue Ethics', 'Moral Dilemmas', 'Applied Ethics', 'Justice', 'Rights & Duties'],
  'Introduction to Psychology': PSYCHOLOGY,
  'Cognitive Science': ['Perception', 'Attention', 'Memory', 'Language', 'Problem Solving', 'Decision Making', 'Consciousness', 'Learning', 'Neural Basis of Cognition'],
}

const LANGUAGE_SET = new Set(SUBJECTS_BY_CATEGORY['Languages'])

export function getTopics(subject: string): string[] {
  if (TOPICS_BY_SUBJECT[subject]) return TOPICS_BY_SUBJECT[subject]
  if (LANGUAGE_SET.has(subject)) return LANGUAGE_TOPICS
  return DEFAULT_TOPICS
}
