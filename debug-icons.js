// Debug script to check icon mapping

const subjects = [
  "PMP Certification",
  "AWS Certified Solutions Architect", 
  "CompTIA Security+",
  "Cisco CCNA",
  "Microsoft Azure Fundamentals",
  "AP Statistics",
  "Biostatistics", 
  "Business Statistics",
  "Elementary Statistics",
  "Intro to Statistics",
  "Calculus",
  "Linear Algebra",
  "Geometry",
  "Discrete Mathematics",
  "Pre-Calculus",
  "Programming",
  "Data Structures",
  "Web Development",
  "Database Design",
  "Computer Science Fundamentals",
  "Physics",
  "Chemistry", 
  "Biology",
  "Anatomy",
  "Astronomy",
  "Earth Science",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Engineering",
  "Accounting",
  "Economics",
  "Finance",
  "Business Administration",
  "Nursing",
  "Pharmacology",
  "Medical Sciences",
  "Health Sciences",
  "Psychology",
  "History",
  "Philosophy",
  "Sociology",
  "Political Science",
  "English",
  "Writing",
  "HESI",
  "TEAS",
  "GRE",
  "LSAT",
  "TOEFL",
  "GED"
];

// EXACT subject name mapping (case-sensitive)
const exactIconMapping = {
  'PMP Certification': 'pmp',
  'AWS Certified Solutions Architect': 'aws',
  'CompTIA Security+': 'comptia',
  'Cisco CCNA': 'cisco',
  'Microsoft Azure Fundamentals': 'azure',
  'AP Statistics': 'statistics',
  'Biostatistics': 'statistics',
  'Business Statistics': 'statistics',
  'Elementary Statistics': 'statistics',
  'Intro to Statistics': 'statistics',
  'Calculus': 'math',
  'Linear Algebra': 'math',
  'Geometry': 'math',
  'Discrete Mathematics': 'math',
  'Pre-Calculus': 'math',
  'Programming': 'science',
  'Data Structures': 'science',
  'Web Development': 'science',
  'Database Design': 'science',
  'Computer Science Fundamentals': 'science',
  'Physics': 'science',
  'Chemistry': 'science',
  'Biology': 'science',
  'Astronomy': 'science',
  'Earth Science': 'science',
  'Mechanical Engineering': 'engineering',
  'Electrical Engineering': 'engineering',
  'Engineering': 'engineering',
  'Accounting': 'business',
  'Economics': 'business',
  'Finance': 'business',
  'Business Administration': 'business',
  'Nursing': 'medical',
  'Pharmacology': 'medical',
  'Medical Sciences': 'medical',
  'Health Sciences': 'medical',
  'Anatomy': 'medical',
  'HESI': 'medical',
  'TEAS': 'medical',
  'Psychology': 'science',
  'History': 'business',
  'Philosophy': 'business',
  'Sociology': 'science',
  'Political Science': 'science',
  'English': 'business',
  'Writing': 'business',
  'GRE': 'business',
  'LSAT': 'business',
  'TOEFL': 'business',
  'GED': 'business'
};

const availableIcons = [
  'pmp', 'aws', 'comptia', 'cisco', 'azure', 'googlecloud',
  'oracle', 'vmware', 'kubernetes', 'docker', 'math', 'mathematics',
  'statistics', 'science', 'engineering', 'business', 'medical'
];

console.log("=== ICON MAPPING DEBUG ===\n");

subjects.forEach(subject => {
  let mappedIcon = null;
  
  // Check EXACT subject name mapping (case-sensitive)
  if (exactIconMapping[subject]) {
    mappedIcon = exactIconMapping[subject];
  }
  
  const hasIcon = mappedIcon && availableIcons.includes(mappedIcon);
  const status = hasIcon ? "✓" : "✗";
  
  console.log(`${status} ${subject} → ${mappedIcon || 'NO MAPPING'}`);
});

console.log("\n=== SUMMARY ===");
let mappedCount = 0;
let unmappedCount = 0;

subjects.forEach(subject => {
  const mappedIcon = exactIconMapping[subject];
  const hasIcon = mappedIcon && availableIcons.includes(mappedIcon);
  
  if (hasIcon) {
    mappedCount++;
  } else {
    unmappedCount++;
    console.log(`Missing: ${subject}`);
  }
});

console.log(`\nTotal subjects: ${subjects.length}`);
console.log(`✓ Mapped to official icons: ${mappedCount}`);
console.log(`✗ Missing icons: ${unmappedCount}`);