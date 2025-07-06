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

const iconMapping = {
  'pmp certification': 'pmp',
  'aws certified solutions architect': 'aws',
  'aws cloud practitioner': 'aws',
  'aws': 'aws',
  'comptia security+': 'comptia',
  'comptia': 'comptia',
  'cisco ccna': 'cisco',
  'cisco': 'cisco',
  'microsoft azure fundamentals': 'azure',
  'azure fundamentals': 'azure',
  'azure': 'azure',
  'google cloud platform': 'googlecloud',
  'google cloud': 'googlecloud',
  'gcp': 'googlecloud',
  'oracle': 'oracle',
  'vmware': 'vmware',
  'kubernetes': 'kubernetes',
  'docker': 'docker',
  'mathematics': 'math',
  'statistics': 'statistics',
  'ap statistics': 'statistics',
  'biostatistics': 'statistics',
  'business statistics': 'statistics',
  'elementary statistics': 'statistics',
  'intro to statistics': 'statistics',
  'science': 'science',
  'biology': 'science',
  'chemistry': 'science',
  'physics': 'science',
  'engineering': 'engineering',
  'mechanical engineering': 'engineering',
  'electrical engineering': 'engineering',
  'business': 'business',
  'business administration': 'business',
  'accounting': 'business',
  'economics': 'business',
  'finance': 'business',
  'medical': 'medical',
  'nursing': 'medical',
  'health sciences': 'medical',
  'medical sciences': 'medical',
  'pharmacology': 'medical'
};

const availableIcons = [
  'pmp', 'aws', 'comptia', 'cisco', 'azure', 'googlecloud',
  'oracle', 'vmware', 'kubernetes', 'docker', 'math', 'mathematics',
  'statistics', 'science', 'engineering', 'business', 'medical'
];

console.log("=== ICON MAPPING DEBUG ===\n");

subjects.forEach(subject => {
  const name = subject.toLowerCase();
  let mappedIcon = null;
  
  // Check direct mapping first
  if (iconMapping[name]) {
    mappedIcon = iconMapping[name];
  } else {
    // Check if subject name contains any of our certification keywords
    for (const [keyword, iconKey] of Object.entries(iconMapping)) {
      if (name.includes(keyword)) {
        mappedIcon = iconKey;
        break;
      }
    }
  }
  
  // Fallback: try direct match with normalized name
  if (!mappedIcon) {
    const normalizedName = name.replace(/[^a-z0-9]/g, '');
    if (availableIcons.includes(normalizedName)) {
      mappedIcon = normalizedName;
    }
  }
  
  const hasIcon = mappedIcon && availableIcons.includes(mappedIcon);
  const status = hasIcon ? "✓" : "✗";
  
  console.log(`${status} ${subject} → ${mappedIcon || 'NO MAPPING'}`);
});

console.log("\n=== MISSING ICONS ===");
subjects.forEach(subject => {
  const name = subject.toLowerCase();
  let mappedIcon = null;
  
  if (iconMapping[name]) {
    mappedIcon = iconMapping[name];
  } else {
    for (const [keyword, iconKey] of Object.entries(iconMapping)) {
      if (name.includes(keyword)) {
        mappedIcon = iconKey;
        break;
      }
    }
  }
  
  const hasIcon = mappedIcon && availableIcons.includes(mappedIcon);
  if (!hasIcon) {
    console.log(`MISSING: ${subject}`);
  }
});