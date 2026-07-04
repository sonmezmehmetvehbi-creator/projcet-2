'use client'
import AdSlot from '@/components/ui/AdSlot'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase'
import {
  BookOpen, FileText, ChevronDown, AlertCircle, Zap, Upload, X, FileUp,
  Calculator, FlaskConical, PenTool, Landmark, Target, Code, Languages,
  Palette, Briefcase, HeartPulse, Brain, Sparkles, ArrowLeft, ArrowRight, Check,
} from 'lucide-react'
import LimitReachedModal from '@/components/ui/LimitReachedModal'
import type { Profile, Grade, OutputType, QuestionType, Difficulty } from '@/types'

const GREEN = 'rgb(34,85,14)'
const MUTED = 'rgb(107,107,88)'
const INK = 'rgb(26,26,20)'

const GRADES: { value: Grade; label: string }[] = [
  { value: 'K-5', label: 'K–5' },
  { value: '6-8', label: '6–8' },
  { value: '9-10', label: '9–10' },
  { value: '11-12', label: '11–12' },
  { value: 'college', label: 'College' },
]

// ── Category → icon ──
const CATEGORIES = [
  { id: 'Mathematics', icon: Calculator },
  { id: 'Science', icon: FlaskConical },
  { id: 'English & Writing', icon: PenTool },
  { id: 'History & Social Studies', icon: Landmark },
  { id: 'Test Prep', icon: Target },
  { id: 'Computer Science', icon: Code },
  { id: 'Languages', icon: Languages },
  { id: 'Arts & Music', icon: Palette },
  { id: 'Business & Economics', icon: Briefcase },
  { id: 'Health & PE', icon: HeartPulse },
  { id: 'Philosophy & Psychology', icon: Brain },
  { id: 'Other', icon: Sparkles },
]

// ── Category → subjects ──
const SUBJECTS_BY_CATEGORY: Record<string, string[]> = {
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

const TOPICS_BY_SUBJECT: Record<string, string[]> = {
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

function getTopics(subject: string): string[] {
  if (TOPICS_BY_SUBJECT[subject]) return TOPICS_BY_SUBJECT[subject]
  if (LANGUAGE_SET.has(subject)) return LANGUAGE_TOPICS
  return DEFAULT_TOPICS
}

const STEP_LABELS = ['Category', 'Subject', 'Topic', 'Options', 'Generate']
const CUSTOM = '__custom__'

export default function GeneratePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [subject, setSubject] = useState('')
  const [grade, setGrade] = useState<Grade>('9-10')
  const [topic, setTopic] = useState('')
  const [focus, setFocus] = useState('')
  const [outputType, setOutputType] = useState<OutputType>('questions')
  const [questionCount, setQuestionCount] = useState(10)
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(['mc'])
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [usage, setUsage] = useState({ questions: 0, worksheets: 0 })
  const [limitModal, setLimitModal] = useState<{ open: boolean; bonus: number }>({ open: false, bonus: 0 })
  const [genBan, setGenBan] = useState<{ reason?: string } | null>(null)
  const [bans, setBans] = useState({ generation: false, tutoring: false, support: false })

  // Multi-step wizard state.
  const [step, setStep] = useState(1)
  const [maxStep, setMaxStep] = useState(1)
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd')
  const [category, setCategory] = useState('')
  const [topicChoice, setTopicChoice] = useState('') // selected topic pill/dropdown value ('' or CUSTOM or a topic)

  const [useUpload, setUseUpload] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedText, setUploadedText] = useState('')
  const [uploadParsing, setUploadParsing] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)
      fetch('/api/user/bans').then(r => r.json()).then(setBans).catch(() => {})
      const today = new Date().toISOString().split('T')[0]
      const { data: usageData } = await supabase.from('daily_usage').select('questions, worksheets').eq('user_id', user.id).eq('date', today).single()
      if (usageData) setUsage(usageData)
    }
    load()
  }, [])

  const bonusGenerations = (profile as any)?.bonus_generations ?? 0
  const atLimit = !profile?.is_premium && bonusGenerations <= 0 && (
    (outputType === 'questions' && usage.questions >= 2) ||
    (outputType === 'worksheet' && usage.worksheets >= 2)
  )

  // ── Step navigation ──
  function goTo(next: number) {
    setDir(next >= step ? 'fwd' : 'back')
    setStep(next)
    setMaxStep(m => Math.max(m, next))
  }

  function selectCategory(cat: string) {
    setCategory(cat)
    setSubject('')
    setTopic('')
    setTopicChoice('')
    if (cat === 'Other') setSubject('')
    goTo(2)
  }
  function selectSubject(subj: string) {
    setSubject(subj)
    setTopic('')
    setTopicChoice('')
    goTo(3)
  }

  function setQType(mode: 'mc' | 'fr' | 'mixed') {
    setQuestionTypes(mode === 'mixed' ? ['mc', 'fr'] : [mode])
  }
  const qtMode: 'mc' | 'fr' | 'mixed' =
    questionTypes.includes('mc') && questionTypes.includes('fr') ? 'mixed' : (questionTypes[0] as 'mc' | 'fr') ?? 'mc'

  async function extractPPTXClientSide(file: File): Promise<string> {
    const JSZip = (await import('jszip')).default
    const buffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(buffer)
    const texts: string[] = []

    const slideFiles = Object.keys(zip.files)
      .filter(name => name.match(/^ppt\/slides\/slide\d+\.xml$/))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] ?? '0')
        const numB = parseInt(b.match(/\d+/)?.[0] ?? '0')
        return numA - numB
      })

    for (const slideFile of slideFiles) {
      const content = await zip.files[slideFile].async('text')
      const matches = content.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) ?? []
      const slideText = matches
        .map((m: string) => m.replace(/<[^>]+>/g, '').trim())
        .filter((t: string) => t.length > 0)
        .join(' ')
      if (slideText.trim().length > 5) {
        const slideNum = slideFile.match(/\d+/)?.[0]
        texts.push(`[Slide ${slideNum}] ${slideText.trim()}`)
      }
    }

    if (texts.length === 0) {
      throw new Error('Could not extract text from this PowerPoint. Make sure it contains text (not just images).')
    }

    return texts.join('\n\n')
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File must be under 20MB')
      return
    }

    setUploadedFile(file)
    setUploadError('')
    setUploadParsing(true)

    try {
      const fileName = file.name.toLowerCase()
      let extractedText = ''

      if (fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) {
        extractedText = await extractPPTXClientSide(file)
      } else if (fileName.endsWith('.txt')) {
        extractedText = await file.text()
      } else {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/parse-upload', { method: 'POST', body: formData })
        const text = await res.text()
        let data: any
        try { data = JSON.parse(text) } catch { throw new Error('Server error reading file. Please try again.') }
        if (!res.ok) throw new Error(data.error || 'Failed to parse file')
        extractedText = data.text
      }

      if (!extractedText || extractedText.trim().length < 30) {
        throw new Error('Could not extract enough text from this file.')
      }

      setUploadedText(extractedText.slice(0, 12000))

      if (!topic) {
        const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
        setTopic(name)
        setTopicChoice(CUSTOM)
      }
    } catch (err: any) {
      setUploadError(err.message)
      setUploadedFile(null)
    }
    setUploadParsing(false)
  }

  function removeUpload() {
    setUploadedFile(null)
    setUploadedText('')
    setUploadError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !topic.trim()) { setError('Please fill in all required fields.'); return }
    if (useUpload && !uploadedText) { setError('Please upload a file or disable the upload option.'); return }
    if (atLimit) { setError('You have reached your daily limit. Upgrade to Premium for unlimited generations.'); return }
    setError('')
    setLoading(true)

    const minWait = profile?.is_premium ? 15000 : 30000

    try {
      const [data] = await Promise.all([
        fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject, grade, topic, focus, outputType,
            questionCount, questionTypes, difficulty,
            uploadedText: useUpload ? uploadedText : undefined,
          }),
        }).then(res => res.json()),
        new Promise(resolve => setTimeout(resolve, minWait)),
      ])

      if (data.limitReached) {
        setLimitModal({ open: true, bonus: data.bonusRemaining ?? 0 })
        setLoading(false)
        return
      }
      if (data.error === 'generation_banned') {
        setGenBan({ reason: data.reason })
        setLoading(false)
        return
      }
      if (data.error) throw new Error(data.error)
      router.refresh()
      if (outputType === 'questions') router.push(`/questions/${data.sessionId}`)
      else router.push(`/worksheet/${data.sessionId}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (loading) return <LoadingScreen outputType={outputType} isPremium={profile?.is_premium ?? false} />

  if (genBan) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F4F7EC, #EFF5E3)' }}>
      <Navbar profile={profile} bans={bans} />
      <div style={{ paddingTop: '5rem' }}>
        <div style={{ maxWidth: '42rem', margin: '0 auto', padding: '3rem 1.5rem' }}>
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center', border: '1px solid rgba(163,45,45,0.25)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
            <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: 'rgb(163,45,45)', marginBottom: '0.75rem' }}>
              AI generation suspended
            </h1>
            <p style={{ color: MUTED, lineHeight: 1.7 }}>
              Your access to AI generation has been suspended.{genBan.reason ? ` Reason: ${genBan.reason}.` : ''} Contact support to appeal.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const topics = subject ? getTopics(subject) : []
  const difficultyLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
  const summary = outputType === 'questions'
    ? `Generate ${questionCount} ${difficulty} ${subject || 'study'} question${questionCount !== 1 ? 's' : ''}`
    : `Generate a ${difficulty} ${subject || 'study'} worksheet`

  const stepClass = dir === 'back' ? 'slide-from-left' : 'slide-from-right'

  return (
    <div style={{ minHeight: '100vh', position: 'relative', background: 'linear-gradient(135deg, #F4F7EC, #EFF5E3)', overflow: 'hidden' }}>
      <div className="gen-anim-bg" aria-hidden />
      <Navbar profile={profile} bans={bans} />
      <div style={{ paddingTop: '5rem', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>

          {/* Progress indicator */}
          <div className="gen-steps" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            {STEP_LABELS.map((label, i) => {
              const n = i + 1
              const done = n < step
              const active = n === step
              const reachable = n <= maxStep
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                  <button type="button" onClick={() => reachable && goTo(n)} disabled={!reachable}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.6rem', borderRadius: '9999px', border: 'none', background: active ? GREEN : 'transparent', cursor: reachable ? 'pointer' : 'default' }}>
                    <span style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, fontFamily: 'Syne, sans-serif', background: active ? 'white' : done ? GREEN : 'rgba(34,85,14,0.12)', color: active ? GREEN : done ? 'white' : MUTED }}>
                      {done ? <Check style={{ width: '0.75rem', height: '0.75rem' }} /> : n}
                    </span>
                    <span className="step-label" style={{ fontSize: '0.8125rem', fontWeight: active ? 700 : 500, color: active ? 'white' : done ? GREEN : MUTED }}>{label}</span>
                  </button>
                  {n < STEP_LABELS.length && <div style={{ width: '0.75rem', height: '2px', background: 'rgba(34,85,14,0.15)' }} />}
                </div>
              )
            })}
          </div>

          {/* Free usage strip */}
          {!profile?.is_premium && (
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {(['questions', 'worksheet'] as const).map(type => {
                const used = type === 'questions' ? usage.questions : usage.worksheets
                return (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.875rem', borderRadius: '9999px', background: 'white', border: '1px solid rgba(34,85,14,0.12)' }}>
                    <span style={{ fontSize: '0.75rem', color: MUTED, textTransform: 'capitalize' }}>{type}</span>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {[0, 1].map(i => <div key={i} style={{ width: '1.25rem', height: '0.375rem', borderRadius: '9999px', background: i < used ? GREEN : 'rgba(34,85,14,0.15)' }} />)}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{used}/2</span>
                  </div>
                )
              })}
            </div>
          )}

          {error && (
            <div className="alert-error" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
              <div>
                {error}
                {atLimit && <a href="/pricing" style={{ display: 'block', marginTop: '0.25rem', fontWeight: 600, color: GREEN }}>Upgrade to Premium →</a>}
              </div>
            </div>
          )}

          {/* ── STEP CONTAINER ── */}
          <div key={step} className={`gen-step ${stepClass}`}>

            {/* STEP 1 — Category */}
            {step === 1 && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                  <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: INK, marginBottom: '0.375rem' }}>What would you like to study?</h1>
                  <p style={{ color: MUTED }}>Choose a subject area to get started</p>
                </div>
                <div className="cat-grid">
                  {CATEGORIES.map((c, i) => {
                    const selected = category === c.id
                    const Icon = c.icon
                    return (
                      <button key={c.id} type="button" onClick={() => selectCategory(c.id)}
                        className="cat-card" style={{ animationDelay: `${i * 0.05}s`, borderColor: selected ? GREEN : 'rgba(34,85,14,0.12)', background: selected ? GREEN : 'white', color: selected ? 'white' : INK }}>
                        {selected && <span style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}><Check style={{ width: '1rem', height: '1rem', color: 'white' }} /></span>}
                        <Icon style={{ width: '2rem', height: '2rem', color: selected ? 'white' : GREEN, marginBottom: '0.625rem' }} />
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.25, textAlign: 'center' }}>{c.id}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* STEP 2 — Subject */}
            {step === 2 && (
              <div className="card" style={{ padding: '1.75rem' }}>
                <button type="button" onClick={() => goTo(1)} style={backLink}><ArrowLeft style={{ width: '0.875rem', height: '0.875rem' }} /> Category</button>
                <h2 style={stepTitle}>Now pick your subject</h2>
                <p style={{ color: MUTED, fontSize: '0.9375rem', marginBottom: '1.25rem' }}>{category}</p>
                {category === 'Other' ? (
                  <div>
                    <label className="label">Enter your subject</label>
                    <input value={subject} onChange={e => setSubject(e.target.value)} className="input" placeholder="e.g. Marine Biology, Music Production" />
                    <button type="button" disabled={!subject.trim()} onClick={() => goTo(3)} className="btn-primary" style={{ marginTop: '1.25rem', width: '100%', justifyContent: 'center', opacity: subject.trim() ? 1 : 0.5 }}>
                      Continue <ArrowRight style={{ width: '1rem', height: '1rem' }} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
                    {(SUBJECTS_BY_CATEGORY[category] ?? []).map((subj, i) => (
                      <button key={subj} type="button" onClick={() => selectSubject(subj)}
                        className="subj-pill" style={{ animationDelay: `${i * 0.03}s`, borderColor: subject === subj ? GREEN : 'rgba(34,85,14,0.18)', background: subject === subj ? 'rgba(34,85,14,0.08)' : 'white', color: subject === subj ? GREEN : INK, fontWeight: subject === subj ? 700 : 500 }}>
                        {subj}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 3 — Topic */}
            {step === 3 && (
              <div className="card" style={{ padding: '1.75rem' }}>
                <button type="button" onClick={() => goTo(2)} style={backLink}><ArrowLeft style={{ width: '0.875rem', height: '0.875rem' }} /> Subject</button>
                <h2 style={stepTitle}>What topic within {subject}?</h2>

                {topics.length < 10 && topicChoice !== CUSTOM ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem', marginBottom: '1rem' }}>
                    {topics.map((tp, i) => (
                      <button key={tp} type="button" onClick={() => { setTopicChoice(tp); setTopic(tp) }}
                        className="subj-pill" style={{ animationDelay: `${i * 0.03}s`, borderColor: topic === tp ? GREEN : 'rgba(34,85,14,0.18)', background: topic === tp ? 'rgba(34,85,14,0.08)' : 'white', color: topic === tp ? GREEN : INK, fontWeight: topic === tp ? 700 : 500 }}>
                        {tp}
                      </button>
                    ))}
                    <button type="button" onClick={() => { setTopicChoice(CUSTOM); setTopic('') }}
                      className="subj-pill" style={{ borderColor: 'rgba(34,85,14,0.18)', background: 'white', color: MUTED, fontStyle: 'italic' }}>
                      ✏️ Custom topic
                    </button>
                  </div>
                ) : (
                  <div style={{ marginBottom: '1rem' }}>
                    <div className="topic-dropdown" style={{ position: 'relative' }}>
                      <select value={topicChoice} onChange={e => { const v = e.target.value; setTopicChoice(v); setTopic(v === CUSTOM ? '' : v) }}
                        className="input" style={{ appearance: 'none', paddingRight: '2.5rem', cursor: 'pointer' }}>
                        <option value="">Select a topic…</option>
                        {topics.map(tp => <option key={tp} value={tp}>{tp}</option>)}
                        <option value={CUSTOM}>✏️ Other / Custom topic</option>
                      </select>
                      <ChevronDown style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: MUTED, pointerEvents: 'none' }} />
                    </div>
                  </div>
                )}

                {topicChoice === CUSTOM && (
                  <input value={topic} onChange={e => setTopic(e.target.value)} className="input" placeholder="Type your own topic…" style={{ marginBottom: '1rem' }} autoFocus />
                )}

                {/* Upload toggle */}
                <div style={{ padding: '1rem', borderRadius: '0.875rem', background: 'rgba(34,85,14,0.03)', border: '1px solid rgba(34,85,14,0.1)', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: useUpload ? '1rem' : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <FileUp style={{ width: '1.125rem', height: '1.125rem', color: GREEN }} />
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: INK }}>Upload my notes <span style={{ fontWeight: 400, color: MUTED, fontSize: '0.8125rem' }}>(optional)</span></p>
                        <p style={{ fontSize: '0.8125rem', color: MUTED }}>PDF, images, PPTX, DOCX, TXT</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => { setUseUpload(u => !u); removeUpload() }}
                      style={{ width: '2.75rem', height: '1.5rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: useUpload ? GREEN : 'rgba(34,85,14,0.2)', position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: '1.125rem', height: '1.125rem', borderRadius: '50%', background: 'white', position: 'absolute', top: '0.1875rem', transition: 'all 0.2s', left: useUpload ? '1.4375rem' : '0.1875rem', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </button>
                  </div>
                  {useUpload && (
                    <div>
                      {!uploadedFile ? (
                        <div>
                          <div
                            onClick={() => fileRef.current?.click()}
                            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                            onDragEnter={e => { e.preventDefault(); setIsDragging(true) }}
                            onDragLeave={e => { e.preventDefault(); setIsDragging(false) }}
                            onDrop={e => {
                              e.preventDefault(); setIsDragging(false)
                              const file = e.dataTransfer.files?.[0]
                              if (file) { const dt = new DataTransfer(); dt.items.add(file); handleFileUpload({ target: { files: dt.files } } as any) }
                            }}
                            style={{ border: `2px dashed ${isDragging ? GREEN : 'rgba(34,85,14,0.3)'}`, borderRadius: '0.75rem', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: isDragging ? 'rgba(34,85,14,0.04)' : 'white' }}>
                            <Upload style={{ width: '1.5rem', height: '1.5rem', color: isDragging ? GREEN : MUTED, margin: '0 auto 0.5rem' }} />
                            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: INK, marginBottom: '0.25rem' }}>{isDragging ? 'Drop it here!' : 'Drag & drop or click to upload'}</p>
                            <p style={{ fontSize: '0.75rem', color: MUTED }}>PDF, images, PPTX, DOCX, TXT — max 20MB</p>
                          </div>
                          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.pptx,.ppt,.docx,.txt" style={{ display: 'none' }} onChange={handleFileUpload} />
                          {uploadError && <p style={{ fontSize: '0.8125rem', color: 'rgb(163,45,45)', marginTop: '0.5rem' }}>{uploadError}</p>}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'white', border: '1px solid rgba(34,85,14,0.2)' }}>
                          {uploadParsing ? (
                            <>
                              <div style={{ width: '1.25rem', height: '1.25rem', border: '2px solid rgba(34,85,14,0.2)', borderTop: `2px solid ${GREEN}`, borderRadius: '50%', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                              <p style={{ fontSize: '0.875rem', color: MUTED }}>Reading your notes...</p>
                            </>
                          ) : (
                            <>
                              <FileText style={{ width: '1.25rem', height: '1.25rem', color: GREEN, flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploadedFile.name}</p>
                                <p style={{ fontSize: '0.75rem', color: 'rgb(59,109,17)' }}>✓ Notes extracted successfully</p>
                              </div>
                              <button type="button" onClick={removeUpload} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: MUTED, padding: '0.25rem', display: 'flex' }}>
                                <X style={{ width: '1rem', height: '1rem' }} />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button type="button" disabled={!topic.trim()} onClick={() => goTo(4)} className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: topic.trim() ? 1 : 0.5 }}>
                  Continue <ArrowRight style={{ width: '1rem', height: '1rem' }} />
                </button>
              </div>
            )}

            {/* STEP 4 — Options */}
            {step === 4 && (
              <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <button type="button" onClick={() => goTo(3)} style={backLink}><ArrowLeft style={{ width: '0.875rem', height: '0.875rem' }} /> Topic</button>
                <h2 style={{ ...stepTitle, marginBottom: 0 }}>Customize your {outputType === 'questions' ? 'questions' : 'worksheet'}</h2>

                {/* Output type */}
                <div>
                  <label className="label">Output type</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {([
                      { value: 'questions', icon: BookOpen, label: 'Questions', desc: 'MC & free response' },
                      { value: 'worksheet', icon: FileText, label: 'Worksheet', desc: 'Visual study sheet' },
                    ] as const).map(opt => (
                      <button key={opt.value} type="button" onClick={() => setOutputType(opt.value)}
                        style={{ padding: '1rem', borderRadius: '0.75rem', border: `2px solid ${outputType === opt.value ? GREEN : 'rgba(34,85,14,0.15)'}`, background: outputType === opt.value ? 'rgba(34,85,14,0.04)' : 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                        <opt.icon style={{ width: '1.25rem', height: '1.25rem', color: outputType === opt.value ? GREEN : MUTED, marginBottom: '0.5rem' }} />
                        <p style={{ fontWeight: 600, color: INK, fontSize: '0.9375rem' }}>{opt.label}</p>
                        <p style={{ fontSize: '0.8125rem', color: MUTED }}>{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grade pills */}
                <div>
                  <label className="label">Grade level</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {GRADES.map(g => (
                      <button key={g.value} type="button" onClick={() => setGrade(g.value)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '9999px', border: `2px solid ${grade === g.value ? GREEN : 'rgba(34,85,14,0.15)'}`, background: grade === g.value ? GREEN : 'white', color: grade === g.value ? 'white' : INK, fontWeight: grade === g.value ? 700 : 500, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="label">Difficulty</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                    {([
                      { value: 'easy', label: 'Easy', emoji: '🌱', color: 'rgb(34,85,14)' },
                      { value: 'medium', label: 'Medium', emoji: '📚', color: 'rgb(202,138,4)' },
                      { value: 'hard', label: 'Hard', emoji: '🔥', color: 'rgb(217,119,6)' },
                      { value: 'expert', label: 'Expert', emoji: '⚡', color: 'rgb(220,38,38)' },
                    ] as const).map(d => (
                      <button key={d.value} type="button" onClick={() => setDifficulty(d.value)}
                        style={{ padding: '0.75rem 0.5rem', borderRadius: '0.75rem', border: `2px solid ${difficulty === d.value ? d.color : 'rgba(34,85,14,0.15)'}`, background: difficulty === d.value ? `${d.color}12` : 'white', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                        <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{d.emoji}</div>
                        <p style={{ fontWeight: 700, fontSize: '0.8125rem', color: difficulty === d.value ? d.color : INK }}>{d.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question-only options */}
                {outputType === 'questions' && (
                  <>
                    <div>
                      <label className="label">Number of questions</label>
                      <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.5rem', fontWeight: 800, color: GREEN, lineHeight: 1 }}>{questionCount}</span>
                      </div>
                      <input type="range" min={5} max={profile?.is_premium ? 30 : 12} value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))}
                        style={{ width: '100%', accentColor: GREEN, cursor: 'pointer' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: MUTED, marginTop: '0.25rem' }}>
                        <span>5</span>
                        <span>{profile?.is_premium ? '30 (Premium)' : <a href="/pricing" style={{ color: GREEN, fontWeight: 600, textDecoration: 'none' }}>12 — Upgrade for 30 ⚡</a>}</span>
                      </div>
                    </div>
                    <div>
                      <label className="label">Question types</label>
                      <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
                        {([
                          { value: 'mc', label: 'Multiple Choice' },
                          { value: 'fr', label: 'Free Response' },
                          { value: 'mixed', label: 'Mixed' },
                        ] as const).map(qt => (
                          <button key={qt.value} type="button" onClick={() => setQType(qt.value)}
                            style={{ flex: '1 1 30%', minWidth: '100px', padding: '0.625rem 1rem', borderRadius: '0.75rem', border: `2px solid ${qtMode === qt.value ? GREEN : 'rgba(34,85,14,0.15)'}`, background: qtMode === qt.value ? 'rgba(34,85,14,0.06)' : 'white', cursor: 'pointer', fontSize: '0.875rem', fontWeight: qtMode === qt.value ? 700 : 500, color: qtMode === qt.value ? GREEN : MUTED, transition: 'all 0.2s' }}>
                            {qt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Additional focus */}
                <div>
                  <label className="label">Additional focus <span style={{ fontSize: '0.8125rem', fontWeight: 400, color: MUTED }}>(optional)</span></label>
                  <input value={focus} onChange={e => setFocus(e.target.value)} className="input" placeholder="e.g. focus only on word problems" />
                </div>

                <button type="button" onClick={() => goTo(5)} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Review & Generate <ArrowRight style={{ width: '1rem', height: '1rem' }} />
                </button>
              </div>
            )}

            {/* STEP 5 — Generate */}
            {step === 5 && (
              <form onSubmit={handleSubmit} className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                <button type="button" onClick={() => goTo(4)} style={{ ...backLink, margin: '0 auto 1.25rem' }}><ArrowLeft style={{ width: '0.875rem', height: '0.875rem' }} /> Options</button>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✨</div>
                <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: INK, marginBottom: '0.5rem' }}>Ready to generate!</h2>
                <p style={{ color: MUTED, marginBottom: '1.5rem', lineHeight: 1.6 }}>
                  {topic} · {grade === 'college' ? 'College' : grade} · {difficultyLabel}
                  {outputType === 'questions' ? ` · ${qtMode === 'mixed' ? 'Mixed' : qtMode === 'fr' ? 'Free Response' : 'Multiple Choice'}` : ''}
                  {useUpload && uploadedText ? ' · from your notes' : ''}
                </p>

                <button type="submit" disabled={atLimit || uploadParsing} className={`gen-cta ${!atLimit && !uploadParsing ? 'gen-cta-ready' : ''}`}
                  style={{ width: '100%', justifyContent: 'center', padding: '1.1rem', fontSize: '1.0625rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.875rem', border: 'none', cursor: atLimit || uploadParsing ? 'not-allowed' : 'pointer', color: 'white', fontWeight: 700, background: atLimit ? MUTED : `linear-gradient(135deg, ${GREEN}, rgb(59,130,46))` }}>
                  {atLimit ? (
                    <><Zap style={{ width: '1rem', height: '1rem' }} /> Daily limit reached — Upgrade to continue</>
                  ) : uploadParsing ? (
                    'Reading your notes...'
                  ) : (
                    <>{summary}{useUpload && uploadedText ? ' from my notes' : ''} <ArrowRight style={{ width: '1.125rem', height: '1.125rem' }} /></>
                  )}
                </button>
                {atLimit && <a href="/pricing" style={{ display: 'inline-block', marginTop: '1rem', fontWeight: 600, color: GREEN, textDecoration: 'none' }}>Upgrade to Premium →</a>}
              </form>
            )}
          </div>
        </div>
      </div>

      <LimitReachedModal
        open={limitModal.open}
        onClose={() => setLimitModal({ open: false, bonus: 0 })}
        limitLabel="2 free generations"
        bonusRemaining={limitModal.bonus}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideR { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideL { from { opacity: 0; transform: translateX(-28px); } to { opacity: 1; transform: translateX(0); } }
        .slide-from-right { animation: slideR 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        .slide-from-left { animation: slideL 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes catIn { from { opacity: 0; transform: translateY(14px); } }
        @keyframes pillUp { from { opacity: 0; transform: translateY(10px); } }
        @keyframes driftBG { 0% { transform: translate(0,0) scale(1); } 50% { transform: translate(-3%, 2%) scale(1.08); } 100% { transform: translate(0,0) scale(1); } }
        @keyframes ctaPulse { 0%,100% { box-shadow: 0 8px 28px rgba(34,85,14,0.25); } 50% { box-shadow: 0 8px 40px rgba(34,85,14,0.5); } }
        .gen-anim-bg {
          position: fixed; inset: -10%; z-index: 0; pointer-events: none;
          background:
            radial-gradient(40% 40% at 20% 25%, rgba(34,85,14,0.10), transparent 70%),
            radial-gradient(45% 45% at 80% 30%, rgba(59,130,46,0.10), transparent 70%),
            radial-gradient(50% 50% at 55% 85%, rgba(232,160,32,0.08), transparent 70%);
          animation: driftBG 18s ease-in-out infinite;
        }
        .cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .cat-card {
          position: relative; min-height: 120px; display: flex; flex-direction: column;
          align-items: center; justify-content: center; padding: 1rem 0.75rem;
          border-radius: 1rem; border: 2px solid rgba(34,85,14,0.12); cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          animation: catIn 0.4s ease both;
        }
        .cat-card:hover { transform: scale(1.05); border-color: ${GREEN}; box-shadow: 0 10px 28px rgba(34,85,14,0.14); }
        .subj-pill {
          padding: 0.55rem 1rem; border-radius: 9999px; border: 2px solid rgba(34,85,14,0.18);
          font-size: 0.875rem; cursor: pointer; transition: all 0.15s ease; animation: pillUp 0.35s ease both;
        }
        .subj-pill:hover { border-color: ${GREEN}; transform: translateY(-1px); }
        .gen-cta-ready { animation: ctaPulse 2.2s ease-in-out infinite; }
        .gen-cta-ready:hover { transform: translateY(-2px); }
        .gen-cta { transition: transform 0.2s ease; }
        @media (max-width: 640px) {
          .cat-grid { grid-template-columns: repeat(2, 1fr); }
          .gen-steps .step-label { display: none; }
        }
      `}</style>
    </div>
  )
}

const backLink: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: 'transparent', border: 'none', cursor: 'pointer', color: MUTED, fontSize: '0.8125rem', fontWeight: 600, padding: 0, marginBottom: '1rem' }
const stepTitle: React.CSSProperties = { fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.375rem', fontWeight: 700, color: INK, marginBottom: '0.75rem' }

function LoadingScreen({ outputType, isPremium }: { outputType: OutputType; isPremium: boolean }) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [triviaIndex, setTriviaIndex] = useState(() => Math.floor(Math.random() * 20))
  const [countdown, setCountdown] = useState(isPremium ? 18 : 30)
  const duration = isPremium ? 18 : 30

  const messages = outputType === 'questions'
    ? ['Reading up on your topic...', 'Writing your first question...', 'Mixing in some tricky ones...', 'Double-checking the answers...', 'Almost ready for you!']
    : ['Opening the textbooks...', 'Sketching out your worksheet...', 'Building the step-by-step guide...', 'Adding visuals and examples...', 'Polishing the final touches...']

  const trivia = [
    { emoji: '🧠', fact: 'Your brain uses about 20% of your body\'s total energy — even though it\'s only 2% of your body weight.' },
    { emoji: '😴', fact: 'Sleeping after studying helps your brain consolidate memories up to 3x more effectively than staying awake.' },
    { emoji: '✏️', fact: 'Writing notes by hand beats typing — the slower pace forces your brain to process and summarize, boosting retention.' },
    { emoji: '🎵', fact: 'Studying with classical or lo-fi music at 60-70 BPM can improve focus by syncing with your brain\'s alpha waves.' },
    { emoji: '🍅', fact: 'The Pomodoro Technique — 25 min study, 5 min break — is scientifically proven to reduce mental fatigue and boost output.' },
    { emoji: '🔁', fact: 'The "spacing effect" shows that studying the same material across multiple days beats cramming it all in one session.' },
    { emoji: '🧪', fact: 'Testing yourself (like with flashcards or practice questions) is 50% more effective for long-term memory than re-reading.' },
    { emoji: '💧', fact: 'Being just 1-2% dehydrated can reduce cognitive performance by up to 10%. Keep water nearby when studying.' },
    { emoji: '🏃', fact: 'Even a 10-minute walk before studying increases blood flow to the brain and can improve focus for up to 2 hours.' },
    { emoji: '🌙', fact: 'The best time to review difficult material is right before bed — your brain actively consolidates it during deep sleep.' },
    { emoji: '📖', fact: 'The average person forgets 70% of new information within 24 hours without review. That\'s why practice questions matter.' },
    { emoji: '🎯', fact: 'Breaking a big topic into smaller chunks ("chunking") helps your brain store information more efficiently.' },
    { emoji: '👁️', fact: 'The human brain processes visual information 60,000 times faster than text — that\'s why diagrams and worksheets work so well.' },
    { emoji: '☕', fact: 'Caffeine improves short-term memory and focus, but only works if you don\'t consume it daily — tolerance builds fast.' },
    { emoji: '🔗', fact: 'Connecting new information to something you already know is the fastest way to make it stick permanently.' },
    { emoji: '😅', fact: 'Mild stress (like a test deadline) can actually sharpen focus — it triggers cortisol which boosts memory formation.' },
    { emoji: '🗣️', fact: 'Explaining a concept out loud as if teaching someone else — the "Feynman Technique" — is one of the most powerful study methods.' },
    { emoji: '📱', fact: 'Just having your phone visible (even face down) reduces working memory capacity by 10%, even if you\'re not using it.' },
    { emoji: '🌿', fact: 'Studying in natural light improves alertness and mood. Students in naturally lit rooms score 20% higher on tests.' },
    { emoji: '🔢', fact: 'The brain can only hold 4-7 pieces of new information in working memory at once — so short study sessions beat long marathons.' },
  ]

  useEffect(() => {
    const interval = setInterval(() => setMessageIndex(i => (i + 1) % messages.length), 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setTriviaIndex(i => (i + 1) % trivia.length), 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isPremium) return
    const interval = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(interval)
  }, [isPremium])

  const currentTrivia = trivia[triviaIndex]

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F4F7EC, #EFF5E3)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '32rem', width: '100%' }}>

        <div className="notebook-breathe" style={{ width: '200px', height: '160px', margin: '0 auto 2rem', position: 'relative' }}>
          <svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
            <rect x="20" y="20" width="160" height="120" rx="8" fill="rgb(34,85,14)" />
            {[35, 50, 65, 80, 95, 110, 125].map((y, i) => (
              <circle key={i} cx="28" cy={y} r="4" fill="rgb(232,160,32)" className="spiral-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
            <rect x="38" y="28" width="134" height="104" rx="4" fill="#FAFAF8" />
            {[
              { y1: 48, y2: 48, cls: 'line-draw-1' },
              { y1: 68, y2: 68, cls: 'line-draw-2' },
              { y1: 88, y2: 88, cls: 'line-draw-3' },
              { y1: 108, y2: 108, cls: 'line-draw-4' },
            ].map((line, i) => (
              <line key={i} x1="48" y1={line.y1} x2="162" y2={line.y2}
                stroke="#C8D8E8" strokeWidth="1.5"
                strokeDasharray="114" className={line.cls} />
            ))}
            <g className="pencil-write">
              <rect x="-18" y="-5" width="36" height="10" rx="2" fill="#F5C842" />
              <polygon points="18,-5 18,5 26,0" fill="#E8A020" />
              <rect x="-22" y="-5" width="6" height="10" rx="1" fill="#F4A0A0" />
              <rect x="-16" y="-5" width="4" height="10" fill="#B0B0B0" />
              <circle cx="22" cy="-3" r="1.5" fill="rgba(180,180,180,0.6)" className="eraser-dust-1" />
              <circle cx="25" cy="1" r="1" fill="rgba(180,180,180,0.5)" className="eraser-dust-2" />
              <circle cx="20" cy="3" r="1.2" fill="rgba(180,180,180,0.4)" className="eraser-dust-3" />
            </g>
          </svg>
        </div>

        <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'rgb(26,26,20)', marginBottom: '0.5rem', minHeight: '1.75rem' }}>
          {messages[messageIndex]}
        </p>
        <p style={{ fontSize: '0.9375rem', color: 'rgb(107,107,88)', marginBottom: '1.75rem' }}>
          {isPremium ? 'Generating your content...' : `Ready in ${countdown} second${countdown !== 1 ? 's' : ''}...`}
        </p>

        <div style={{ width: '100%', height: '6px', background: 'rgba(34,85,14,0.12)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '2rem' }}>
          <div style={{
            height: '100%', borderRadius: '9999px',
            background: 'linear-gradient(90deg, rgb(34,85,14), rgb(74,122,40))',
            animation: `progressFill ${duration}s linear forwards`,
          }} />
        </div>

        <div key={triviaIndex} style={{
          padding: '1.25rem 1.5rem', borderRadius: '1rem',
          background: 'white', border: '1px solid rgba(34,85,14,0.1)',
          boxShadow: '0 4px 16px rgba(34,85,14,0.06)',
          marginBottom: !isPremium ? '1.25rem' : 0,
          animation: 'triviaFade 0.5s ease-in-out',
          textAlign: 'left',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem', flexShrink: 0, marginTop: '0.125rem' }}>{currentTrivia.emoji}</span>
            <div>
              <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgb(34,85,14)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.375rem' }}>
                Did you know?
              </p>
              <p style={{ fontSize: '0.9rem', color: 'rgb(26,26,20)', lineHeight: 1.65 }}>
                {currentTrivia.fact}
              </p>
            </div>
          </div>
        </div>

        {!isPremium && (
          <div style={{ marginTop: '1rem' }}>
            <AdSlot isPremium={false} slot="4455667788" format="horizontal" />
            <p style={{ fontSize: '0.8125rem', color: 'rgb(107,107,88)', marginTop: '0.75rem' }}>
              ⚡ <a href="/pricing" style={{ color: 'rgb(34,85,14)', fontWeight: 600, textDecoration: 'none' }}>Premium members</a> load in half the time
            </p>
          </div>
        )}
      </div>
      <style>{`
        @keyframes progressFill { from { width: 0% } to { width: 100% } }
        @keyframes triviaFade { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
