require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Question = require('../models/Question');
const Test = require('../models/Test');
const Attempt = require('../models/Attempt');
const Resource = require('../models/Resource');
const Job = require('../models/Job');

const runSeed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_mock_test';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB');

    // Clean existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Question.deleteMany({});
    await Test.deleteMany({});
    await Attempt.deleteMany({});
    await Resource.deleteMany({});
    await Job.deleteMany({});
    console.log('[Seed] Existing collections cleared');

    // 1. Create Users
    const adminUser = await User.create({
      name: 'Prasad Chodagiri',
      email: 'chodagiriprasad5@gmail.com',
      password: 'Yashu@1818',
      role: 'admin',
      targetExam: 'Administration & Curricula',
      streakDays: 14,
    });

    const studentUser = await User.create({
      name: 'Alex Rivera (Example Student)',
      email: 'student@universalmock.com',
      password: 'Student@123',
      role: 'user',
      targetExam: 'Computer Science & GATE',
      streakDays: 6,
    });

    console.log('[Seed] Users created: chodagiriprasad5@gmail.com, student@universalmock.com');

    // 2. Create Categories
    const categoriesData = [
      {
        name: 'Computer Science & IT',
        slug: 'computer-science',
        icon: 'Code2',
        description: 'Algorithms, Data Structures, OS, DBMS, Computer Networks, and GATE CS preparation.',
        badgeText: 'Top Choice',
        color: '#4F46E5', // Indigo
        order: 1,
      },
      {
        name: 'Medical & MBBS',
        slug: 'medical-mbbs',
        icon: 'Stethoscope',
        description: 'Clinical anatomy, Pharmacology, Pathology, Biochemistry, and USMLE/PLAB preparation.',
        badgeText: 'High Yield',
        color: '#059669', // Emerald
        order: 2,
      },
      {
        name: 'IIT-JEE (Advanced & Mains)',
        slug: 'iit-jee',
        icon: 'Atom',
        description: 'Advanced Physics, Physical & Organic Chemistry, Calculus, and Coordinate Geometry.',
        badgeText: 'Premier',
        color: '#D97706', // Amber
        order: 3,
      },
      {
        name: 'NEET UG',
        slug: 'neet-ug',
        icon: 'Microscope',
        description: 'Zoology, Botany, Genetics, Human Physiology, and high-frequency NCERT questions.',
        badgeText: 'Bestseller',
        color: '#DC2626', // Red
        order: 4,
      },
      {
        name: 'IELTS Academic',
        slug: 'ielts-academic',
        icon: 'Languages',
        description: 'Reading comprehension, Writing Task 1 & 2 analysis, Listening simulation, and Vocabulary.',
        badgeText: 'Global',
        color: '#7C3AED', // Violet
        order: 5,
      },
      {
        name: 'D-MAT / MBA Aptitude',
        slug: 'd-mat',
        icon: 'Briefcase',
        description: 'Data Interpretation, Quantitative Aptitude, Logical Reasoning, and Verbal Ability.',
        badgeText: 'Fast Track',
        color: '#0891B2', // Cyan
        order: 6,
      },
    ];

    const categories = await Category.insertMany(categoriesData);
    console.log(`[Seed] ${categories.length} Categories created`);

    const csCat = categories[0];
    const medCat = categories[1];
    const iitCat = categories[2];
    const neetCat = categories[3];
    const ieltsCat = categories[4];
    const dmatCat = categories[5];

    // 3. Create Questions (CS, Medical, IIT, NEET, IELTS, D-MAT)
    const questionsData = [
      // CS Questions
      {
        text: 'What is the worst-case time complexity of searching for an element in a balanced Red-Black Tree with n nodes?',
        codeSnippet: '',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        correctOptionIndex: 1,
        explanation: 'A Red-Black Tree has a maximum height of 2 * log2(n + 1). Hence, search, insert, and delete operations all run in guaranteed O(log n) time in the worst case.',
        marks: 4,
        negativeMarks: 1,
        categoryId: csCat._id,
        subject: 'Data Structures',
        topic: 'Binary Search Trees & Balancing',
        difficulty: 'Medium',
        type: 'both',
        practiceMode: 'both',
      },
      {
        text: 'Analyze the output of the following C code snippet:',
        codeSnippet: `#include <stdio.h>
int main() {
    int arr[] = {10, 20, 30, 40, 50};
    int *ptr = arr;
    printf("%d", *(ptr + 2));
    return 0;
}`,
        options: ['10', '20', '30', '40'],
        correctOptionIndex: 2,
        explanation: 'Pointer arithmetic: *(ptr + 2) accesses arr[2]. arr[0]=10, arr[1]=20, arr[2]=30.',
        marks: 4,
        negativeMarks: 1,
        categoryId: csCat._id,
        subject: 'Programming in C',
        topic: 'Pointers and Memory Layout',
        difficulty: 'Easy',
        type: 'both',
        practiceMode: 'both',
      },
      {
        text: 'In relational database design, which normal form eliminates transitive functional dependencies for non-prime attributes?',
        codeSnippet: '',
        options: ['First Normal Form (1NF)', 'Second Normal Form (2NF)', 'Third Normal Form (3NF)', 'Boyce-Codd Normal Form (BCNF)'],
        correctOptionIndex: 2,
        explanation: '3NF requires that a relation is in 2NF and no non-prime attribute is transitively dependent on any candidate key (i.e. X -> Y, Y -> A where X is key, Y is not).',
        marks: 4,
        negativeMarks: 1,
        categoryId: csCat._id,
        subject: 'Database Systems',
        topic: 'Normalization & Functional Dependencies',
        difficulty: 'Medium',
        type: 'both',
        practiceMode: 'both',
      },
      {
        text: 'Which transport layer protocol feature provides flow control in TCP?',
        codeSnippet: '',
        options: ['Sliding Window Protocol with Receive Window (rwnd)', 'Three-way Handshake', 'Cumulative ACKs only', 'Slow Start Exponential Growth'],
        correctOptionIndex: 0,
        explanation: 'TCP flow control prevents sender buffer overrun by using the sliding window mechanism, where the receiver advertises its available buffer capacity via the "rwnd" field.',
        marks: 4,
        negativeMarks: 1,
        categoryId: csCat._id,
        subject: 'Computer Networks',
        topic: 'TCP/IP Transport Layer',
        difficulty: 'Medium',
        type: 'both',
        practiceMode: 'both',
      },
      {
        text: 'In operating systems, which condition is NOT one of Coffman’s four necessary conditions for deadlock?',
        codeSnippet: '',
        options: ['Mutual Exclusion', 'Hold and Wait', 'Preemption allowed', 'Circular Wait'],
        correctOptionIndex: 2,
        explanation: 'The four conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. If preemption is allowed, deadlock cannot occur.',
        marks: 4,
        negativeMarks: 1,
        categoryId: csCat._id,
        subject: 'Operating Systems',
        topic: 'Concurrency & Deadlocks',
        difficulty: 'Easy',
        type: 'both',
        practiceMode: 'both',
      },

      // Medical & MBBS Questions
      {
        text: 'Which cranial nerve is primarily responsible for motor innervation of the muscles of facial expression?',
        codeSnippet: '',
        options: ['Trigeminal Nerve (CN V)', 'Facial Nerve (CN VII)', 'Glossopharyngeal Nerve (CN IX)', 'Vagus Nerve (CN X)'],
        correctOptionIndex: 1,
        explanation: 'Cranial Nerve VII (Facial nerve) supplies all muscles of facial expression, stapedius, stylohyoid, and posterior belly of the digastric.',
        marks: 4,
        negativeMarks: 1,
        categoryId: medCat._id,
        subject: 'Human Anatomy',
        topic: 'Neuroanatomy & Cranial Nerves',
        difficulty: 'Medium',
        type: 'both',
        practiceMode: 'both',
      },
      {
        text: 'A 45-year-old male presents with severe chest discomfort. ECG demonstrates ST-segment elevation in leads II, III, and aVF. Which coronary artery is most likely occluded?',
        codeSnippet: '',
        options: ['Left Anterior Descending (LAD)', 'Left Circumflex Artery (LCx)', 'Right Coronary Artery (RCA)', 'Left Main Coronary Artery'],
        correctOptionIndex: 2,
        explanation: 'Leads II, III, and aVF reflect the inferior wall of the left ventricle, which is supplied by the Right Coronary Artery (RCA) in approximately 85-90% of individuals.',
        marks: 4,
        negativeMarks: 1,
        categoryId: medCat._id,
        subject: 'Cardiology & Clinical Medicine',
        topic: 'Myocardial Infarction & ECG Localization',
        difficulty: 'Hard',
        type: 'both',
        practiceMode: 'both',
      },
      {
        text: 'Which drug is considered the first-line pharmacotherapy for type 2 diabetes mellitus in patients with adequate renal function?',
        codeSnippet: '',
        options: ['Glipizide', 'Metformin', 'Empagliflozin', 'Pioglitazone'],
        correctOptionIndex: 1,
        explanation: 'Metformin, a biguanide, is the globally recommended first-line oral antihyperglycemic agent due to its proven efficacy, safety profile, and weight-neutral effects.',
        marks: 4,
        negativeMarks: 1,
        categoryId: medCat._id,
        subject: 'Pharmacology',
        topic: 'Endocrine Drugs & Diabetes',
        difficulty: 'Easy',
        type: 'both',
        practiceMode: 'both',
      },

      // IIT-JEE Questions
      {
        text: 'A particle moves along the x-axis such that its position is given by x(t) = 3t^3 - 6t^2 + 2. At what time t is the acceleration of the particle equal to zero?',
        codeSnippet: '',
        options: ['t = 1/3 s', 't = 2/3 s', 't = 1 s', 't = 4/3 s'],
        correctOptionIndex: 1,
        explanation: 'v(t) = dx/dt = 9t^2 - 12t. a(t) = dv/dt = 18t - 12. Setting a(t) = 0 gives 18t = 12, so t = 12/18 = 2/3 seconds.',
        marks: 4,
        negativeMarks: 1,
        categoryId: iitCat._id,
        subject: 'Physics',
        topic: 'Kinematics & Calculus in Motion',
        difficulty: 'Medium',
        type: 'both',
        practiceMode: 'both',
      },
      {
        text: 'Which of the following organic compounds will give a positive iodoform test upon reaction with I2 and NaOH?',
        codeSnippet: '',
        options: ['Methanol', 'Ethanol', 'Propan-1-ol', 'Benzophenone'],
        correctOptionIndex: 1,
        explanation: 'The iodoform test is given by compounds having a CH3-C=O group or CH3-CH(OH)- group. Ethanol (CH3CH2OH) oxidizes to ethanal and yields yellow CHI3 precipitate.',
        marks: 4,
        negativeMarks: 1,
        categoryId: iitCat._id,
        subject: 'Chemistry',
        topic: 'Organic Chemistry & Carbonyl Compounds',
        difficulty: 'Medium',
        type: 'both',
        practiceMode: 'both',
      },

      // NEET UG Questions
      {
        text: 'During aerobic cellular respiration, where does oxidative phosphorylation and the electron transport chain occur in eukaryotic cells?',
        codeSnippet: '',
        options: ['Mitochondrial Matrix', 'Inner Mitochondrial Membrane', 'Outer Mitochondrial Membrane', 'Cytosol'],
        correctOptionIndex: 1,
        explanation: 'The electron transport chain complexes and ATP synthase are embedded within the cristae of the inner mitochondrial membrane.',
        marks: 4,
        negativeMarks: 1,
        categoryId: neetCat._id,
        subject: 'Biology',
        topic: 'Cellular Respiration & Bioenergetics',
        difficulty: 'Easy',
        type: 'both',
        practiceMode: 'both',
      },
      {
        text: 'In Mendel’s dihybrid cross between homozygous round yellow (RRYY) and wrinkled green (rryy) seeds, what is the phenotypic ratio in the F2 generation?',
        codeSnippet: '',
        options: ['3:1', '9:3:3:1', '1:2:1', '9:7'],
        correctOptionIndex: 1,
        explanation: 'Mendel’s law of independent assortment yields a classic 9:3:3:1 phenotypic ratio (9 Round Yellow, 3 Round Green, 3 Wrinkled Yellow, 1 Wrinkled Green).',
        marks: 4,
        negativeMarks: 1,
        categoryId: neetCat._id,
        subject: 'Genetics',
        topic: 'Mendelian Genetics & Inheritance',
        difficulty: 'Easy',
        type: 'both',
        practiceMode: 'both',
      },

      // IELTS Academic
      {
        text: 'Identify the synonym that best maintains an academic tone to replace the underlined colloquial word: "The researcher *got* crucial data from archival records."',
        codeSnippet: '',
        options: ['snagged', 'retrieved', 'bagged', 'picked up'],
        correctOptionIndex: 1,
        explanation: '"Retrieved" or "acquired" represents the standard scholarly register in academic writing for obtaining records or documentation.',
        marks: 1,
        negativeMarks: 0,
        categoryId: ieltsCat._id,
        subject: 'Academic English',
        topic: 'Lexical Resource & Academic Collocations',
        difficulty: 'Easy',
        type: 'both',
        practiceMode: 'both',
      },

      // D-MAT / Aptitude
      {
        text: 'A sum of money doubles itself in 5 years at simple interest. In how many years will it become 4 times itself at the same rate?',
        codeSnippet: '',
        options: ['10 years', '12 years', '15 years', '20 years'],
        correctOptionIndex: 2,
        explanation: 'SI = P in 5 yrs, so Rate R = (100 * P) / (P * 5) = 20% per year. To become 4 times, SI must be 3P. Time = (100 * 3P) / (P * 20) = 15 years.',
        marks: 4,
        negativeMarks: 1,
        categoryId: dmatCat._id,
        subject: 'Quantitative Aptitude',
        topic: 'Simple & Compound Interest',
        difficulty: 'Medium',
        type: 'both',
        practiceMode: 'both',
      },
    ];

    const questions = await Question.insertMany(questionsData);
    console.log(`[Seed] ${questions.length} Questions seeded`);

    // 4. Create Mock Tests
    const csQuestions = questions.filter(q => q.categoryId.toString() === csCat._id.toString());
    const medQuestions = questions.filter(q => q.categoryId.toString() === medCat._id.toString());
    const iitQuestions = questions.filter(q => q.categoryId.toString() === iitCat._id.toString());
    const neetQuestions = questions.filter(q => q.categoryId.toString() === neetCat._id.toString());
    const ieltsQuestions = questions.filter(q => q.categoryId.toString() === ieltsCat._id.toString());
    const dmatQuestions = questions.filter(q => q.categoryId.toString() === dmatCat._id.toString());

    const testsData = [
      {
        title: 'GATE CS Full Mock Simulator 2026',
        description: 'Comprehensive timed simulation encompassing Algorithms, OS, DBMS, Computer Networks, and Discrete Mathematics.',
        instructions: '1. This examination comprises multiple choice questions.\n2. +4 marks for every correct answer; -1 mark for every incorrect answer.\n3. Do not switch browser tabs once full-screen mode begins.',
        tags: ['trending', 'more complex', 'high yield'],
        categoryId: csCat._id,
        type: 'mock',
        difficulty: 'Hard',
        timing: { enabled: true, mode: 'overall', duration: 25 },
        questions: csQuestions.map(q => q._id),
        totalMarks: csQuestions.length * 4,
        passingMarks: Math.round(csQuestions.length * 4 * 0.4),
        status: 'published',
        createdBy: adminUser._id,
        attemptCount: 38,
        averageScore: 14.5,
      },
      {
        title: 'Data Structures & System Design Sprint',
        description: 'High-speed technical screening mock focused on trees, graphs, pointer mechanics, and scaling principles.',
        instructions: '1. Fast-paced sprint exam.\n2. Standard marking scheme applies.\n3. Manage time efficiently across all tree and pointer problems.',
        tags: ['trending', 'speed sprint'],
        categoryId: csCat._id,
        type: 'mock',
        difficulty: 'Medium',
        timing: { enabled: true, mode: 'overall', duration: 15 },
        questions: csQuestions.slice(0, 3).map(q => q._id),
        totalMarks: 12,
        passingMarks: 6,
        status: 'published',
        createdBy: adminUser._id,
        attemptCount: 22,
        averageScore: 8.8,
      },
      {
        title: 'Clinical Diagnostics & Pharmacology Grand Mock',
        description: 'Case-vignette style questions testing cardiology, cranial nerve lesions, and clinical antimicrobial therapies.',
        instructions: '1. Read clinical patient vignettes thoroughly before selecting.\n2. ECG localization questions carry negative marking.',
        tags: ['more complex', 'clinical case'],
        categoryId: medCat._id,
        type: 'mock',
        difficulty: 'Hard',
        timing: { enabled: true, mode: 'overall', duration: 30 },
        questions: medQuestions.map(q => q._id),
        totalMarks: medQuestions.length * 4,
        passingMarks: 8,
        status: 'published',
        createdBy: adminUser._id,
        attemptCount: 19,
        averageScore: 9.2,
      },
      {
        title: 'IIT-JEE Physics & Physical Chemistry Speed Test',
        description: 'Advanced calculus motion problems, reaction kinetics, and iodoform/carbonyl chemistry for top percentile seekers.',
        instructions: '1. Pure JEE Advanced pattern simulation.\n2. Verify algebraic calculations before finalizing your choices.',
        tags: ['trending', 'more complex', 'premier'],
        categoryId: iitCat._id,
        type: 'mock',
        difficulty: 'Hard',
        timing: { enabled: true, mode: 'overall', duration: 20 },
        questions: iitQuestions.map(q => q._id),
        totalMarks: iitQuestions.length * 4,
        passingMarks: 4,
        status: 'published',
        createdBy: adminUser._id,
        attemptCount: 31,
        averageScore: 5.5,
      },
      {
        title: 'NEET Biology Rapid Fire NCERT Drill',
        description: 'Pure NCERT line-by-line questions covering cellular bioenergetics, mitochondrial enzymes, and dihybrid inheritance.',
        instructions: '1. Focus on direct NCERT statements and exceptions.\n2. Time management is crucial for medical entrance percentiles.',
        tags: ['high yield', 'NCERT line-by-line'],
        categoryId: neetCat._id,
        type: 'mock',
        difficulty: 'Medium',
        timing: { enabled: true, mode: 'overall', duration: 15 },
        questions: neetQuestions.map(q => q._id),
        totalMarks: neetQuestions.length * 4,
        passingMarks: 4,
        status: 'published',
        createdBy: adminUser._id,
        attemptCount: 45,
        averageScore: 6.8,
      },
      {
        title: 'IELTS Academic Reading & Lexical Band Booster',
        description: 'Academic register assessment, contextual synonym identification, and speed reading comprehension.',
        instructions: '1. Untimed diagnostic assessment for lexical register and academic collocations.',
        tags: ['band 8+', 'vocabulary'],
        categoryId: ieltsCat._id,
        type: 'mock',
        difficulty: 'Easy',
        timing: { enabled: false, mode: 'none', duration: 0 },
        questions: ieltsQuestions.map(q => q._id),
        totalMarks: 5,
        passingMarks: 3,
        status: 'published',
        createdBy: adminUser._id,
        attemptCount: 14,
        averageScore: 4.2,
      },
      {
        title: 'D-MAT Quantitative Aptitude Diagnostic',
        description: 'Speed math, interest calculations, ratios, and time-and-work problem solving for prospective MBA candidates.',
        instructions: '1. Rough sheets may be utilized for multi-step arithmetic.',
        tags: ['speed math', 'popular'],
        categoryId: dmatCat._id,
        type: 'mock',
        difficulty: 'Medium',
        timing: { enabled: true, mode: 'overall', duration: 20 },
        questions: dmatQuestions.map(q => q._id),
        totalMarks: dmatQuestions.length * 4,
        passingMarks: 4,
        status: 'published',
        createdBy: adminUser._id,
        attemptCount: 17,
        averageScore: 4.0,
      },
    ];

    const tests = await Test.insertMany(testsData);
    console.log(`[Seed] ${tests.length} Mock Tests created`);

    // 5. Create Realistic Past Attempts for studentUser
    const gateTest = tests[0];
    const pastAttempt1 = await Attempt.create({
      userId: studentUser._id,
      testId: gateTest._id,
      answers: [
        { questionId: csQuestions[0]._id, selectedOption: 1, isCorrect: true, marksAwarded: 4, timeSpent: 45 },
        { questionId: csQuestions[1]._id, selectedOption: 2, isCorrect: true, marksAwarded: 4, timeSpent: 30 },
        { questionId: csQuestions[2]._id, selectedOption: 1, isCorrect: false, marksAwarded: -1, timeSpent: 85 }, // incorrect
        { questionId: csQuestions[3]._id, selectedOption: 0, isCorrect: true, marksAwarded: 4, timeSpent: 55 },
        { questionId: csQuestions[4]._id, selectedOption: 2, isCorrect: true, marksAwarded: 4, timeSpent: 40 },
      ],
      score: 15,
      totalMarks: 20,
      accuracyPercentage: 80,
      correctCount: 4,
      incorrectCount: 1,
      unansweredCount: 0,
      timeSpentSeconds: 255,
      startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 255 * 1000),
      status: 'completed',
      aiReview: {
        weakAreas: ['Database Systems: Normalization & Functional Dependencies (0% accuracy)'],
        suggestedTopics: ['Transitive dependencies & BCNF criteria review', 'Lossless decomposition drills'],
        summaryText: 'Impressive accuracy on operating systems and pointer arithmetic! Your single bottleneck occurred during relational decomposition. Reviewing Armstrong’s axioms will cement full-percentile readiness.',
        recommendedResources: ['Database Normalization & BCNF Cheat Sheet', 'GATE CS High Yield Notes'],
        generatedAt: new Date(),
      },
    });

    const pastAttempt2 = await Attempt.create({
      userId: studentUser._id,
      testId: tests[1]._id,
      answers: [
        { questionId: csQuestions[0]._id, selectedOption: 1, isCorrect: true, marksAwarded: 4, timeSpent: 50 },
        { questionId: csQuestions[1]._id, selectedOption: 2, isCorrect: true, marksAwarded: 4, timeSpent: 35 },
        { questionId: csQuestions[2]._id, selectedOption: 2, isCorrect: true, marksAwarded: 4, timeSpent: 65 },
      ],
      score: 12,
      totalMarks: 12,
      accuracyPercentage: 100,
      correctCount: 3,
      incorrectCount: 0,
      unansweredCount: 0,
      timeSpentSeconds: 150,
      startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 150 * 1000),
      status: 'completed',
      aiReview: {
        weakAreas: ['Timed speed optimization under 30s'],
        suggestedTopics: ['Graph traversal variants', 'Memory hierarchy caching'],
        summaryText: 'Flawless 100% score on this sprint! You completed all questions well within time. Maintain this consistency by taking multi-subject comprehensive mocks.',
        recommendedResources: ['Advanced Data Structures Cheat Sheet'],
        generatedAt: new Date(),
      },
    });

    console.log('[Seed] Seeded past student attempts');

    // 6. Create Resources (PDFs, Notes, Videos)
    const resourcesData = [
      {
        title: 'Complete GATE CS Algorithms & Data Structures Formula Sheet',
        type: 'pdf',
        categoryId: csCat._id,
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        description: 'Comprehensive 45-page compilation of time complexities, recurrences, graph algorithms, and dynamic programming patterns.',
        tags: ['Algorithms', 'Gate CS', 'Data Structures', 'Cheat Sheet'],
        author: 'Prof. Arvind Kumar, IIT Bombay',
        fileSize: '4.2 MB',
        downloadsCount: 384,
        isPublished: true,
      },
      {
        title: 'Mastering Database Normalization & BCNF Decomposition',
        type: 'note',
        categoryId: csCat._id,
        fileUrl: '',
        description: 'Step-by-step breakdown of functional dependency canonical covers, candidate key determination, and 3NF vs BCNF tests.',
        tags: ['DBMS', 'Normalization', 'SQL', 'Theory'],
        author: 'Editorial Faculty',
        fileSize: '1.1 MB',
        downloadsCount: 245,
        isPublished: true,
      },
      {
        title: 'High-Yield ECG & Inferior MI Diagnosis Masterclass',
        type: 'video',
        categoryId: medCat._id,
        videoUrl: 'https://www.youtube.com/watch?v=kwlhoxp3_sQ',
        description: '15-minute video walkthrough of 12-lead ECG changes, reciprocal depressions, and clinical management in emergency settings.',
        tags: ['Cardiology', 'ECG', 'MBBS', 'Clinical'],
        author: 'Dr. Neha Verma, MD',
        duration: '18 mins',
        downloadsCount: 512,
        isPublished: true,
      },
      {
        title: 'IIT-JEE Rotational Dynamics & Kinematics Problem Solver',
        type: 'pdf',
        categoryId: iitCat._id,
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        description: 'Crucial derivations, moment of inertia tables, angular momentum conservation, and rolling without slipping problems.',
        tags: ['Physics', 'IIT JEE', 'Mechanics'],
        author: 'K. S. Verma',
        fileSize: '5.8 MB',
        downloadsCount: 620,
        isPublished: true,
      },
      {
        title: 'NEET Human Physiology High-Yield Flowcharts',
        type: 'pdf',
        categoryId: neetCat._id,
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        description: 'Visual color-coded mindmaps for cardiac cycle, endocrine hormones, nephron counter-current multiplier, and neural synapses.',
        tags: ['Biology', 'NEET', 'Physiology', 'NCERT'],
        author: 'Dr. Ananya Ray',
        fileSize: '8.4 MB',
        downloadsCount: 789,
        isPublished: true,
      },
      {
        title: 'IELTS Academic Writing Task 2 Band 9 Essay Templates',
        type: 'note',
        categoryId: ieltsCat._id,
        fileUrl: '',
        description: 'Proven paragraph structures for Agree/Disagree, Discuss Both Views, and Problem-Solution essay prompts with academic collocations.',
        tags: ['IELTS', 'Writing', 'Band 9', 'Vocabulary'],
        author: 'British Council Certified Trainer',
        fileSize: '950 KB',
        downloadsCount: 940,
        isPublished: true,
      },
    ];

    const resources = await Resource.insertMany(resourcesData);
    console.log(`[Seed] ${resources.length} Resources seeded`);

    // Bookmark some resources for studentUser
    studentUser.savedResources = [resources[0]._id, resources[1]._id];
    await studentUser.save();

    // 7. Create Jobs Board Postings
    const jobsData = [
      {
        title: 'Junior Software Engineer (Backend / Distributed Systems)',
        company: 'CloudScale Labs',
        location: 'Bengaluru / Hybrid',
        category: 'Computer Science & IT',
        type: 'Full-time',
        experienceLevel: 'Fresher',
        salaryRange: '₹12 - ₹18 LPA',
        description: 'Join our infrastructure team designing real-time telemetry and API services. Candidates with strong data structures and competitive programming/GATE scores preferred.',
        requirements: [
          'Proficiency in Go, Java, or Node.js',
          'Firm grasp of relational databases and caching systems',
          'Good problem-solving demonstrated through competitive coding or top GATE percentile',
        ],
        tags: ['Go', 'Node.js', 'Distributed Systems', 'PostgreSQL'],
        applyLink: 'https://example.com/apply/cloudscale-backend',
        isActive: true,
      },
      {
        title: 'Medical Officer / Resident Physician',
        company: 'Apollo Multi-Speciality Hospitals',
        location: 'New Delhi / On-site',
        category: 'Medical & MBBS',
        type: 'Full-time',
        experienceLevel: 'Entry Level',
        salaryRange: '₹14 - ₹20 LPA',
        description: 'Immediate opening for clinical resident physicians in emergency and inpatient acute care wards. Candidates must possess valid medical registration.',
        requirements: [
          'MBBS with completed compulsory rotatory internship',
          'Valid Medical Council registration',
          'ACLS/BLS certification is an advantage',
        ],
        tags: ['MBBS', 'Emergency Medicine', 'Hospital', 'Clinical'],
        applyLink: 'https://example.com/apply/apollo-resident',
        isActive: true,
      },
      {
        title: 'R&D Mechanical / CAD Simulation Intern',
        company: 'HyperDynamics Aerospace',
        location: 'Hyderabad / On-site',
        category: 'IIT-JEE (Advanced & Mains)',
        type: 'Internship',
        experienceLevel: 'Fresher',
        salaryRange: '₹40,000 / month',
        description: 'Work alongside premier IIT alumni on aerodynamic structural analysis and thermal simulation models.',
        requirements: [
          'Pursuing or completed B.Tech/B.E. in Mechanical/Aerospace',
          'Solid foundation in applied physics, statics, and fluid mechanics',
          'Familiarity with ANSYS or SolidWorks',
        ],
        tags: ['Physics', 'CAD', 'Simulation', 'Aerospace'],
        applyLink: 'https://example.com/apply/hyperdynamics-intern',
        isActive: true,
      },
      {
        title: 'Junior Research Fellow - Molecular Genetics',
        company: 'National BioSciences Institute',
        location: 'Pune / On-site',
        category: 'NEET UG',
        type: 'Full-time',
        experienceLevel: 'Entry Level',
        salaryRange: '₹35,000 / month + HRA',
        description: 'Assist in genomic sequencing and CRISPR-Cas9 targeted mutation assays in our biosafety level 2 facility.',
        requirements: [
          'B.Sc / M.Sc in Biotechnology, Genetics, or Life Sciences',
          'Hands-on experience with PCR and gel electrophoresis',
        ],
        tags: ['Genetics', 'Biotech', 'Research', 'Lab'],
        applyLink: 'https://example.com/apply/genetics-fellow',
        isActive: true,
      },
      {
        title: 'International Admissions & IELTS Counselor',
        company: 'GlobalEdu Pathways',
        location: 'Remote / Anywhere',
        category: 'IELTS Academic',
        type: 'Full-time',
        experienceLevel: 'Entry Level',
        salaryRange: '₹6 - ₹9 LPA',
        description: 'Guide aspiring postgraduate applicants through statement of purpose reviews, university selections, and IELTS target scores.',
        requirements: [
          'Demonstrated IELTS score of Band 8.0+ or native English fluency',
          'Exceptional written and oral communication',
        ],
        tags: ['IELTS', 'Admissions', 'Counseling', 'Remote'],
        applyLink: 'https://example.com/apply/globaledu-counselor',
        isActive: true,
      },
      {
        title: 'Management Associate Trainee (Analytics & Strategy)',
        company: 'Vanguard Growth Partners',
        location: 'Mumbai / Hybrid',
        category: 'D-MAT / MBA Aptitude',
        type: 'Full-time',
        experienceLevel: 'Entry Level',
        salaryRange: '₹10 - ₹15 LPA',
        description: 'Fast-track corporate strategy rotation for candidates demonstrating high quantitative aptitude and analytical clarity.',
        requirements: [
          'Degree in Business, Economics, Mathematics, or Engineering',
          'High percentile in CAT / D-MAT / GMAT',
          'Advanced Excel and presentation skills',
        ],
        tags: ['Strategy', 'Finance', 'Analytics', 'Consulting'],
        applyLink: 'https://example.com/apply/vanguard-trainee',
        isActive: true,
      },
    ];

    const jobs = await Job.insertMany(jobsData);
    console.log(`[Seed] ${jobs.length} Job Postings created`);

    // Bookmark one job for studentUser
    studentUser.savedJobs = [jobs[0]._id];
    await studentUser.save();

    console.log('----------------------------------------------------');
    console.log('✅ SEED COMPLETED SUCCESSFULLY!');
    console.log('Admin account: admin@universalmock.com / Admin@123');
    console.log('Student account: student@universalmock.com / Student@123');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error during seeding:', error);
    process.exit(1);
  }
};

runSeed();
