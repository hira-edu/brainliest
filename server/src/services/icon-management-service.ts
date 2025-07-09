/**
 * Database-Driven Icon Management Service
 * Handles dynamic icon mapping and management
 */

// Mock implementation for icon management (schema needs to be created)
const iconData = new Map();
const mappingData = new Map();
import { subjects, exams } from '../../shared/schema';
import { db } from '../storage';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';

export class IconManagementService {
  /**
   * Initialize the icon system with default icons and mappings
   */
  async initializeIconSystem(): Promise<void> {
    console.log('🎨 Initializing database-driven icon system...');
    
    // 1. Seed default icons
    await this.seedDefaultIcons();
    
    // 2. Create automatic subject mappings
    await this.createAutomaticSubjectMappings();
    
    // 3. Create exam mappings
    await this.createAutomaticExamMappings();
    
    console.log('✅ Icon system initialized successfully');
  }

  /**
   * Seed the database with comprehensive icon set
   */
  async seedDefaultIcons(): Promise<void> {
    const defaultIcons: InsertIcon[] = [
      // Academic icons
      {
        id: 'academic',
        name: 'Academic',
        category: 'general',
        description: 'General academic and educational content',
        keywords: ['academic', 'education', 'learning', 'study', 'school'],
        svgContent: this.generateAcademicIconSVG(),
        brandColors: { primary: '#6b7280' },
        variants: ['filled'],
        tags: ['education', 'academic', 'general'],
        isOfficial: false
      },
      {
        id: 'mathematics',
        name: 'Mathematics',
        category: 'mathematics',
        description: 'Mathematical concepts and symbols',
        keywords: ['math', 'mathematics', 'calculus', 'algebra', 'geometry'],
        svgContent: this.generateMathematicsIconSVG(),
        brandColors: { primary: '#8b5cf6' },
        variants: ['filled'],
        tags: ['math', 'education', 'academic'],
        isOfficial: false
      },
      {
        id: 'statistics',
        name: 'Statistics',
        category: 'mathematics',
        description: 'Statistical analysis and data visualization',
        keywords: ['statistics', 'data', 'analysis', 'charts', 'graphs'],
        svgContent: this.generateStatisticsIconSVG(),
        brandColors: { primary: '#059669' },
        variants: ['filled'],
        tags: ['statistics', 'data', 'analysis'],
        isOfficial: false
      },
      // Certification icons
      {
        id: 'aws',
        name: 'Amazon Web Services',
        category: 'certification',
        description: 'AWS cloud platform certification icon',
        keywords: ['aws', 'amazon', 'cloud', 'web services', 'certification'],
        svgContent: this.generateAWSIconSVG(),
        brandColors: { primary: '#ff9900', secondary: '#ffffff' },
        variants: ['filled'],
        tags: ['cloud', 'aws', 'amazon', 'infrastructure'],
        isOfficial: true
      },
      {
        id: 'azure',
        name: 'Microsoft Azure',
        category: 'certification', 
        description: 'Microsoft Azure cloud platform certification icon',
        keywords: ['azure', 'microsoft', 'cloud', 'certification', 'fundamentals'],
        svgContent: this.generateAzureIconSVG(),
        brandColors: { primary: '#0078d4', secondary: '#ffffff' },
        variants: ['filled'],
        tags: ['cloud', 'microsoft', 'azure', 'certification'],
        isOfficial: true
      },
      {
        id: 'comptia',
        name: 'CompTIA',
        category: 'certification',
        description: 'CompTIA IT certification icon',
        keywords: ['comptia', 'security', 'network', 'it', 'certification'],
        svgContent: this.generateCompTIAIconSVG(),
        brandColors: { primary: '#e31837', secondary: '#ffffff' },
        variants: ['filled'],
        tags: ['security', 'networking', 'it', 'technology'],
        isOfficial: true
      },
      {
        id: 'cisco',
        name: 'Cisco',
        category: 'certification',
        description: 'Cisco networking certification icon',
        keywords: ['cisco', 'networking', 'ccna', 'ccnp', 'certification'],
        svgContent: this.generateCiscoIconSVG(),
        brandColors: { primary: '#1ba0d7', secondary: '#ffffff' },
        variants: ['filled'],
        tags: ['networking', 'cisco', 'infrastructure'],
        isOfficial: true
      },
      {
        id: 'pmp',
        name: 'PMP Certification',
        category: 'certification',
        description: 'Project Management Professional certification icon',
        keywords: ['project', 'management', 'professional', 'pmi', 'certification'],
        svgContent: this.generatePMPIconSVG(),
        brandColors: { primary: '#1f4e79', secondary: '#ffffff' },
        variants: ['filled'],
        tags: ['project-management', 'leadership', 'certification'],
        isOfficial: true
      },
      // Subject-specific icons
      {
        id: 'science',
        name: 'Science',
        category: 'science',
        description: 'Natural sciences and laboratory work',
        keywords: ['science', 'physics', 'chemistry', 'biology', 'laboratory'],
        svgContent: this.generateScienceIconSVG(),
        brandColors: { primary: '#dc2626' },
        variants: ['filled'],
        tags: ['science', 'laboratory', 'research'],
        isOfficial: false
      },
      {
        id: 'engineering',
        name: 'Engineering',
        category: 'engineering',
        description: 'Engineering disciplines and mechanical design',
        keywords: ['engineering', 'mechanical', 'electrical', 'design', 'technology'],
        svgContent: this.generateEngineeringIconSVG(),
        brandColors: { primary: '#475569' },
        variants: ['filled'],
        tags: ['engineering', 'design', 'technology'],
        isOfficial: false
      },
      {
        id: 'business',
        name: 'Business',
        category: 'business',
        description: 'Business administration and economics',
        keywords: ['business', 'economics', 'finance', 'accounting', 'management'],
        svgContent: this.generateBusinessIconSVG(),
        brandColors: { primary: '#1f2937' },
        variants: ['filled'],
        tags: ['business', 'economics', 'finance'],
        isOfficial: false
      },
      {
        id: 'medical',
        name: 'Medical',
        category: 'medical',
        description: 'Medical and healthcare sciences',
        keywords: ['medical', 'healthcare', 'nursing', 'medicine', 'health'],
        svgContent: this.generateMedicalIconSVG(),
        brandColors: { primary: '#dc2626' },
        variants: ['filled'],
        tags: ['medical', 'healthcare', 'nursing'],
        isOfficial: false
      },
      {
        id: 'computer-science',
        name: 'Computer Science',
        category: 'technology',
        description: 'Computer science and programming',
        keywords: ['computer', 'science', 'programming', 'software', 'technology'],
        svgContent: this.generateComputerScienceIconSVG(),
        brandColors: { primary: '#1e40af' },
        variants: ['filled'],
        tags: ['computer-science', 'programming', 'technology'],
        isOfficial: false
      },
      {
        id: 'test-prep',
        name: 'Test Preparation',
        category: 'test-prep',
        description: 'Standardized test preparation',
        keywords: ['test', 'preparation', 'exam', 'standardized', 'assessment'],
        svgContent: this.generateTestPrepIconSVG(),
        brandColors: { primary: '#f59e0b' },
        variants: ['filled'],
        tags: ['test', 'preparation', 'assessment'],
        isOfficial: false
      }
    ];

    // Insert icons, handling conflicts
    for (const icon of defaultIcons) {
      try {
        await db.insert(icons)
          .values(icon)
          .onConflictDoUpdate({
            target: icons.id,
            set: {
              name: icon.name,
              description: icon.description,
              keywords: icon.keywords,
              svgContent: icon.svgContent,
              brandColors: icon.brandColors,
              updatedAt: new Date()
            }
          });
        console.log(`   ✅ Seeded icon: ${icon.id}`);
      } catch (error) {
        console.warn(`   ⚠️ Failed to seed icon ${icon.id}:`, error);
      }
    }
  }

  /**
   * Create automatic subject-to-icon mappings based on subject names
   */
  async createAutomaticSubjectMappings(): Promise<void> {
    console.log('🔗 Creating automatic subject-icon mappings...');
    
    const allSubjects = await db.select().from(subjects);
    
    for (const subject of allSubjects) {
      const iconId = this.mapSubjectToIcon(subject.name);
      
      if (iconId) {
        try {
          await db.insert(subjectIconMappings)
            .values({
              subjectSlug: subject.slug,
              iconId,
              priority: 'normal',
              isActive: true
            })
            .onConflictDoNothing();
          
          console.log(`   🔗 Mapped "${subject.name}" -> ${iconId}`);
        } catch (error) {
          console.warn(`   ⚠️ Failed to map ${subject.name}:`, error);
        }
      }
    }
  }

  /**
   * Create automatic exam-to-icon mappings
   */
  async createAutomaticExamMappings(): Promise<void> {
    console.log('📝 Creating automatic exam-icon mappings...');
    
    const allExams = await db.select().from(exams);
    
    for (const exam of allExams) {
      const iconId = this.mapSubjectToIcon(exam.title);
      
      if (iconId) {
        try {
          await db.insert(examIconMappings)
            .values({
              examSlug: exam.slug,
              iconId,
              priority: 'normal',
              isActive: true
            })
            .onConflictDoNothing();
          
          console.log(`   📝 Mapped exam "${exam.title}" -> ${iconId}`);
        } catch (error) {
          console.warn(`   ⚠️ Failed to map exam ${exam.title}:`, error);
        }
      }
    }
  }

  /**
   * Intelligent subject name to icon mapping
   */
  private mapSubjectToIcon(subjectName: string): string {
    const lowerName = subjectName.toLowerCase();
    
    // Exact matches first
    const exactMappings: Record<string, string> = {
      'pmp certification': 'pmp',
      'aws certified solutions architect': 'aws',
      'aws cloud practitioner': 'aws',
      'microsoft azure fundamentals': 'azure',
      'comptia security+': 'comptia',
      'cisco ccna': 'cisco',
      'mathematics': 'mathematics',
      'statistics': 'statistics',
      'ap statistics': 'statistics',
      'biostatistics': 'statistics',
      'business statistics': 'statistics'
    };

    if (exactMappings[lowerName]) {
      return exactMappings[lowerName];
    }

    // Pattern matching
    if (lowerName.includes('aws') || lowerName.includes('amazon')) return 'aws';
    if (lowerName.includes('azure') || lowerName.includes('microsoft azure')) return 'azure';
    if (lowerName.includes('comptia')) return 'comptia';
    if (lowerName.includes('cisco')) return 'cisco';
    if (lowerName.includes('pmp') || lowerName.includes('project management')) return 'pmp';
    if (lowerName.includes('math') || lowerName.includes('calculus') || lowerName.includes('algebra')) return 'mathematics';
    if (lowerName.includes('stat') || lowerName.includes('data analysis')) return 'statistics';
    if (lowerName.includes('physics') || lowerName.includes('chemistry') || lowerName.includes('biology')) return 'science';
    if (lowerName.includes('computer') || lowerName.includes('programming') || lowerName.includes('software')) return 'computer-science';
    if (lowerName.includes('business') || lowerName.includes('management') || lowerName.includes('finance')) return 'business';
    if (lowerName.includes('engineering') || lowerName.includes('mechanical') || lowerName.includes('electrical')) return 'engineering';
    if (lowerName.includes('medical') || lowerName.includes('nursing') || lowerName.includes('health')) return 'medical';
    if (lowerName.includes('test') || lowerName.includes('prep') || lowerName.includes('gre') || lowerName.includes('lsat')) return 'test-prep';
    
    return 'academic'; // fallback
  }

  /**
   * Get icon for subject with database lookup
   */
  async getIconForSubject(subjectSlug: string): Promise<Icon | null> {
    try {
      const mapping = await db
        .select({ iconId: subjectIconMappings.iconId })
        .from(subjectIconMappings)
        .where(and(
          eq(subjectIconMappings.subjectSlug, subjectSlug),
          eq(subjectIconMappings.isActive, true)
        ))
        .limit(1);

      if (mapping.length === 0) {
        return await this.getFallbackIcon();
      }

      const icon = await db
        .select()
        .from(icons)
        .where(and(
          eq(icons.id, mapping[0].iconId),
          eq(icons.isActive, true)
        ))
        .limit(1);

      return icon[0] || await this.getFallbackIcon();
    } catch (error) {
      console.error('Error getting icon for subject:', error);
      return await this.getFallbackIcon();
    }
  }

  /**
   * Get fallback academic icon
   */
  async getFallbackIcon(): Promise<Icon | null> {
    try {
      const fallback = await db
        .select()
        .from(icons)
        .where(and(
          eq(icons.id, 'academic'),
          eq(icons.isActive, true)
        ))
        .limit(1);

      return fallback[0] || null;
    } catch (error) {
      console.error('Error getting fallback icon:', error);
      return null;
    }
  }

  /**
   * Track icon usage for analytics
   */
  async trackIconUsage(iconId: string, usageType: string, entityId: string): Promise<void> {
    try {
      await db.insert(iconUsageAnalytics)
        .values({
          iconId,
          usageType,
          entityId,
          viewCount: '1',
          lastUsed: new Date(),
          metadata: {}
        })
        .onConflictDoUpdate({
          target: [iconUsageAnalytics.iconId, iconUsageAnalytics.usageType, iconUsageAnalytics.entityId],
          set: {
            viewCount: sql`${iconUsageAnalytics.viewCount}::int + 1`,
            lastUsed: new Date()
          }
        });
    } catch (error) {
      console.warn('Error tracking icon usage:', error);
    }
  }

  // SVG generation methods for each icon type
  private generateAcademicIconSVG(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="#6b7280">
      <rect width="100" height="100" rx="20" fill="#6b7280"/>
      <path d="M30 35h40v6H30zm0 12h40v6H30zm0 12h30v6H30z" fill="#fff"/>
      <circle cx="75" cy="65" r="8" fill="#fff"/>
    </svg>`;
  }

  private generateMathematicsIconSVG(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="#8b5cf6">
      <rect width="100" height="100" rx="20" fill="#8b5cf6"/>
      <text x="50" y="35" text-anchor="middle" fill="#fff" font-size="16" font-weight="bold">π</text>
      <text x="30" y="55" text-anchor="middle" fill="#fff" font-size="12" font-weight="bold">∫</text>
      <text x="70" y="55" text-anchor="middle" fill="#fff" font-size="12" font-weight="bold">∑</text>
      <text x="50" y="75" text-anchor="middle" fill="#fff" font-size="12" font-weight="bold">√x</text>
    </svg>`;
  }

  private generateStatisticsIconSVG(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="#059669">
      <rect width="100" height="100" rx="20" fill="#059669"/>
      <rect x="15" y="60" width="10" height="20" fill="#fff"/>
      <rect x="30" y="45" width="10" height="35" fill="#fff"/>
      <rect x="45" y="35" width="10" height="45" fill="#fff"/>
      <rect x="60" y="50" width="10" height="30" fill="#fff"/>
      <rect x="75" y="55" width="10" height="25" fill="#fff"/>
    </svg>`;
  }

  private generateAWSIconSVG(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="20" fill="#232F3E"/>
      <path d="M20 40c0-8 6-15 15-15s15 7 15 15-7 15-15 15-15-7-15-15zm30 25c0-8 6-15 15-15s15 7 15 15-7 15-15 15-15-7-15-15z" fill="#FF9900"/>
      <path d="M15 75c20-3 40-3 70 0" stroke="#FF9900" stroke-width="3" fill="none"/>
    </svg>`;
  }

  private generateAzureIconSVG(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="20" fill="#0078d4"/>
      <path d="M30 25 L50 25 L70 45 L50 75 L30 75 L50 55 Z" fill="#fff"/>
      <path d="M50 25 L70 25 L70 45 L50 45 Z" fill="#b3d9ff"/>
      <path d="M30 55 L50 55 L50 75 L30 75 Z" fill="#b3d9ff"/>
    </svg>`;
  }

  private generateCompTIAIconSVG(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="20" fill="#e31837"/>
      <path d="M20 30h60v8H20zM20 42h60v8H20zM20 54h40v8H20z" fill="#fff"/>
      <circle cx="70" cy="58" r="8" fill="#fff"/>
      <path d="M66 58l3 3 6-6" stroke="#e31837" stroke-width="2" fill="none"/>
    </svg>`;
  }

  private generateCiscoIconSVG(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="20" fill="#1ba0d7"/>
      <rect x="20" y="25" width="8" height="50" fill="#fff"/>
      <rect x="32" y="35" width="8" height="40" fill="#fff"/>
      <rect x="44" y="20" width="8" height="55" fill="#fff"/>
      <rect x="56" y="30" width="8" height="45" fill="#fff"/>
      <rect x="68" y="25" width="8" height="50" fill="#fff"/>
    </svg>`;
  }

  private generatePMPIconSVG(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="20" fill="#1f4e79"/>
      <circle cx="50" cy="50" r="25" stroke="#fff" stroke-width="3" fill="none"/>
      <path d="M40 50l6 6 14-14" stroke="#fff" stroke-width="3" fill="none"/>
      <text x="50" y="85" text-anchor="middle" fill="#fff" font-size="10">PMP</text>
    </svg>`;
  }

  private generateScienceIconSVG(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="20" fill="#dc2626"/>
      <path d="M40 30 L40 45 L25 70 L75 70 L60 45 L60 30 Z" fill="#fff"/>
      <circle cx="35" cy="55" r="3" fill="#dc2626"/>
      <circle cx="50" cy="60" r="2" fill="#dc2626"/>
      <circle cx="65" cy="58" r="2.5" fill="#dc2626"/>
    </svg>`;
  }

  private generateEngineeringIconSVG(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="20" fill="#475569"/>
      <circle cx="35" cy="35" r="12" stroke="#fff" stroke-width="3" fill="none"/>
      <circle cx="65" cy="65" r="12" stroke="#fff" stroke-width="3" fill="none"/>
      <rect x="42" y="42" width="16" height="16" fill="#fff" transform="rotate(45 50 50)"/>
    </svg>`;
  }

  private generateBusinessIconSVG(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="20" fill="#1f2937"/>
      <rect x="20" y="30" width="60" height="40" rx="5" fill="#fff"/>
      <rect x="25" y="20" width="50" height="8" rx="4" fill="#fff"/>
      <rect x="30" y="40" width="15" height="3" fill="#1f2937"/>
      <rect x="30" y="47" width="20" height="3" fill="#1f2937"/>
    </svg>`;
  }

  private generateMedicalIconSVG(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="20" fill="#dc2626"/>
      <rect x="35" y="25" width="30" height="8" fill="#fff"/>
      <rect x="46" y="14" width="8" height="30" fill="#fff"/>
      <rect x="20" y="50" width="60" height="30" rx="5" fill="#fff"/>
    </svg>`;
  }

  private generateComputerScienceIconSVG(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="20" fill="#1e40af"/>
      <rect x="15" y="25" width="70" height="45" rx="5" fill="#fff"/>
      <rect x="20" y="30" width="60" height="25" fill="#1e40af"/>
      <rect x="25" y="35" width="8" height="3" fill="#fff"/>
      <rect x="25" y="40" width="12" height="3" fill="#fff"/>
    </svg>`;
  }

  private generateTestPrepIconSVG(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="20" fill="#f59e0b"/>
      <rect x="25" y="20" width="50" height="60" rx="5" fill="#fff"/>
      <rect x="35" y="30" width="30" height="3" fill="#f59e0b"/>
      <rect x="35" y="40" width="30" height="3" fill="#f59e0b"/>
      <rect x="35" y="50" width="20" height="3" fill="#f59e0b"/>
    </svg>`;
  }
}

export const iconManagementService = new IconManagementService();