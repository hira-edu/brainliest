# Slug-Based Routing System Documentation

## Overview

The Brainliest platform implements a comprehensive slug-based routing system that provides SEO-friendly URLs while maintaining backward compatibility with legacy ID-based routes.

## Architecture

### URL Structure

#### Public Routes
```
/subject/:slug           - Subject detail page
/exam/:slug             - Exam detail page
/subjects               - All subjects listing
/categories/:id/:subId  - Category-based browsing
```

#### Hierarchical Routes
```
/subjects/:subjectSlug/exams/:examSlug
/subjects/:subjectSlug/exams/:examSlug/questions
```

#### Legacy Support (Backward Compatibility)
```
/subject/:id(\d+)       - Redirects to slug-based URL
/exam/:id(\d+)         - Redirects to slug-based URL
```

### API Endpoints

#### Primary Slug Endpoints
```
GET /api/subjects/slug/:slug
GET /api/exams/slug/:slug
GET /api/subjects/slug/:subjectSlug/exams
GET /api/subjects/slug/:subjectSlug/exams/slug/:examSlug
GET /api/subjects/slug/:subjectSlug/exams/slug/:examSlug/questions
```

#### Legacy ID Endpoints (Still Supported)
```
GET /api/subjects/:id
GET /api/exams/:id
```

## Slug Generation

### Algorithm
1. Convert name to lowercase
2. Replace spaces with hyphens
3. Remove special characters (keep alphanumeric and hyphens)
4. Collapse multiple hyphens to single hyphen
5. Trim leading/trailing hyphens
6. Check uniqueness and append number if needed

### Examples
```
"PMP Certification" → "pmp-certification"
"AWS Cloud Practitioner" → "aws-cloud-practitioner"
"CompTIA Security+ (SY0-601)" → "comptia-security-sy0-601"
```

### Uniqueness Handling
If a slug already exists, the system appends a number:
```
"Introduction to Python" → "introduction-to-python"
"Introduction to Python" → "introduction-to-python-2"
```

## Database Schema

### Subjects Table
```sql
ALTER TABLE subjects ADD COLUMN slug VARCHAR(255) UNIQUE;
CREATE INDEX idx_subjects_slug ON subjects(slug);
```

### Exams Table
```sql
ALTER TABLE exams ADD COLUMN slug VARCHAR(255) UNIQUE;
CREATE INDEX idx_exams_slug ON exams(slug);
```

### Questions Table
```sql
ALTER TABLE questions ADD COLUMN slug VARCHAR(255);
CREATE INDEX idx_questions_slug ON questions(slug);
```

## Frontend Implementation

### Navigation Utilities
```typescript
// Central navigation helper
import { getSubjectUrl, getExamUrl, navigateToSubject } from '@/utils/slug-navigation';

// Generate slug-based URL
const subjectUrl = getSubjectUrl(subject); // /subject/pmp-certification

// Navigate with slug preference
navigateToSubject(setLocation, subject);
```

### Routing Configuration
```typescript
// App.tsx routing priority
<Route path="/subject/:slug" component={SubjectSlugPage} />      // Primary
<Route path="/subject/:id(\d+)" component={ExamSelection} />     // Legacy
```

### Component Integration
```typescript
// Subject card navigation
onClick={() => navigateToSubject(setLocation, subject)}
```

## Backend Implementation

### Storage Layer
```typescript
// Auto-generate slugs in CRUD operations
async createSubject(subject: InsertSubject): Promise<Subject> {
  if (!subject.slug && subject.name) {
    subject.slug = await generateSlug(subject.name, validateUniqueness);
  }
  return await db.insert(subjects).values(subject).returning();
}
```

### API Routes
```typescript
// Slug-based lookup
app.get("/api/subjects/slug/:slug", async (req, res) => {
  const subject = await storage.getSubjectBySlug(req.params.slug);
  if (!subject) return res.status(404).json({ message: "Subject not found" });
  res.json(subject);
});
```

## Admin Panel Integration

### Slug Management Component
```typescript
import { SlugManagement } from '@/features/admin/components/slug-management';

<SlugManagement
  currentSlug={subject.slug}
  resourceName="Subject"
  onSlugChange={handleSlugUpdate}
  onValidateSlug={validateSlugUniqueness}
/>
```

### Hierarchical Selector
```typescript
import { HierarchicalSelector } from '@/features/admin/components/hierarchical-selector';

<HierarchicalSelector
  selectedSubjectId={subjectId}
  selectedExamId={examId}
  onSubjectChange={handleSubjectChange}
  onExamChange={handleExamChange}
  showExams={true}
/>
```

## SEO Benefits

### URL Structure
- **Old**: `/subject/123` (not descriptive)
- **New**: `/subject/pmp-certification` (descriptive, keyword-rich)

### Search Engine Optimization
- Keywords in URLs improve search rankings
- Descriptive URLs increase click-through rates
- Better social media sharing appearance
- Improved user experience and memorability

### Meta Tags Integration
```html
<meta property="og:url" content="https://brainliest.com/subject/pmp-certification" />
<link rel="canonical" href="https://brainliest.com/subject/pmp-certification" />
```

## Migration Process

### Phase 1: Database Schema
1. Add slug columns to all tables
2. Create unique indexes
3. Populate existing records with generated slugs

### Phase 2: Backend API
1. Add slug-based lookup methods
2. Implement hierarchical routing
3. Maintain backward compatibility

### Phase 3: Frontend Refactoring
1. Update all navigation components
2. Implement slug-first routing
3. Add centralized navigation utilities

### Phase 4: Admin Enhancement
1. Build slug management components
2. Add hierarchical selectors
3. Integrate validation and editing

### Phase 5: QA and Cutover
1. Comprehensive testing
2. Documentation updates
3. Legacy route cleanup

## Performance Considerations

### Database Optimization
- Unique indexes on slug columns for fast lookups
- Query performance comparable to ID-based queries
- Proper foreign key relationships maintained

### Caching Strategy
- Slug-based API responses cached
- Navigation state preserved across route changes
- Minimal impact on application performance

## Error Handling

### Invalid Slugs
```typescript
// 404 handling for non-existent slugs
if (!subject) {
  return res.status(404).json({ message: "Subject not found" });
}
```

### Validation Errors
```typescript
// Slug uniqueness validation
if (existingSlug.length > 0) {
  throw new Error(`Slug "${slug}" is already in use`);
}
```

## Monitoring and Analytics

### Tracking Metrics
- Slug-based URL usage vs. legacy ID URLs
- 404 error rates for invalid slugs
- Page load performance with slug routing
- SEO ranking improvements

### Health Checks
- Database slug integrity checks
- Broken link monitoring
- Sitemap generation verification

## Best Practices

### For Developers
1. Always use centralized navigation utilities
2. Prefer slug-based URLs in all new code
3. Test both slug and ID routes during development
4. Validate slug uniqueness in admin operations

### For Content Managers
1. Use descriptive names for subjects and exams
2. Avoid special characters in names
3. Review generated slugs before publishing
4. Use admin slug override sparingly

### For SEO
1. Keep slugs concise but descriptive
2. Include target keywords naturally
3. Avoid frequent slug changes after publication
4. Monitor search rankings after slug updates

## Troubleshooting

### Common Issues
1. **Slug conflicts**: Use admin panel to override conflicting slugs
2. **Invalid characters**: System automatically sanitizes inputs
3. **Legacy redirects**: Ensure proper routing configuration
4. **Database inconsistency**: Run slug regeneration scripts

### Debug Tools
```bash
# Check slug generation
curl /api/subjects/slug/test-slug

# Verify database integrity
SELECT * FROM subjects WHERE slug IS NULL;

# Monitor performance
EXPLAIN ANALYZE SELECT * FROM subjects WHERE slug = 'pmp-certification';
```

## Future Enhancements

### Planned Improvements
- Multi-language slug support
- Custom slug patterns for different content types
- Advanced slug analytics and optimization
- Automatic slug suggestions based on SEO best practices

### Scalability Considerations
- Slug generation at scale
- Distributed slug validation
- Performance optimization for large datasets
- Advanced caching strategies