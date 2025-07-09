import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonical?: string;
  openGraph: {
    title: string;
    description: string;
    type: string;
    url: string;
    image?: string;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    image?: string;
  };
}

export interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export class SEOService {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  async generatePageSEO(content: {
    type: 'question' | 'category' | 'exam' | 'subject' | 'homepage';
    title: string;
    description?: string;
    content?: string;
    url: string;
    category?: string;
    subject?: string;
  }): Promise<SEOMetadata> {
    const prompt = `
Generate comprehensive SEO metadata for a ${content.type} page on an exam preparation platform called "Brainliest".

Content Details:
- Type: ${content.type}
- Title: ${content.title}
- Description: ${content.description || 'N/A'}
- Content: ${content.content || 'N/A'}
- URL: ${content.url}
- Category: ${content.category || 'N/A'}
- Subject: ${content.subject || 'N/A'}

Generate the following in JSON format:
{
  "title": "SEO-optimized page title (max 60 chars, include Brainliest brand)",
  "description": "Compelling meta description (max 160 chars, action-oriented)",
  "keywords": ["array", "of", "relevant", "keywords", "and", "phrases"],
  "openGraph": {
    "title": "Social media optimized title",
    "description": "Social media description",
    "type": "website"
  },
  "twitter": {
    "card": "summary_large_image",
    "title": "Twitter optimized title",
    "description": "Twitter description"
  }
}

Focus on search intent, exam preparation terms, certification keywords, and educational content optimization.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const seoData = JSON.parse(cleanResponse);

      return {
        ...seoData,
        canonical: content.url,
        openGraph: {
          ...seoData.openGraph,
          url: content.url
        }
      };
    } catch (error) {
      console.error('SEO generation error:', error);
      // Fallback metadata
      return this.generateFallbackSEO(content);
    }
  }

  async generateQuestionFAQs(question: {
    text: string;
    options: string[];
    explanation?: string;
    subject: string;
    category: string;
  }): Promise<FAQItem[]> {
    const prompt = `
Based on this exam question, generate 3-5 related FAQ items that users commonly ask about this topic.

Question: ${question.text}
Options: ${question.options.join(', ')}
Explanation: ${question.explanation || 'N/A'}
Subject: ${question.subject}
Category: ${question.category}

Generate FAQ items in JSON format:
[
  {
    "question": "What is...",
    "answer": "Brief, helpful answer..."
  }
]

Focus on:
- Common follow-up questions
- Related concepts users need to understand
- Practical application questions
- Study tips for this topic
- Common mistakes to avoid

Keep answers concise but informative (2-3 sentences each).
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanResponse);
    } catch (error) {
      console.error('FAQ generation error:', error);
      return [];
    }
  }

  generateQuestionStructuredData(question: {
    id: number;
    text: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
    subject: string;
    url: string;
  }, faqs: FAQItem[]): StructuredData[] {
    const structuredData: StructuredData[] = [];

    // QAPage Schema
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'QAPage',
      mainEntity: {
        '@type': 'Question',
        name: question.text,
        text: question.text,
        answerCount: 1,
        acceptedAnswer: {
          '@type': 'Answer',
          text: question.explanation || `The correct answer is: ${question.options[question.correctAnswer]}`,
          author: {
            '@type': 'Organization',
            name: 'Brainliest'
          }
        },
        author: {
          '@type': 'Organization',
          name: 'Brainliest'
        },
        datePublished: new Date().toISOString(),
        url: question.url
      }
    });

    // FAQPage Schema if FAQs exist
    if (faqs.length > 0) {
      structuredData.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer
          }
        }))
      });
    }

    return structuredData;
  }

  generateCategoryStructuredData(category: {
    name: string;
    description: string;
    questionCount: number;
    url: string;
    subjects?: string[];
  }): StructuredData[] {
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: category.name,
        description: category.description,
        url: category.url,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: category.questionCount,
          itemListElement: category.subjects?.map((subject, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: subject
          })) || []
        },
        provider: {
          '@type': 'Organization',
          name: 'Brainliest',
          url: 'https://brainliest.com'
        }
      }
    ];
  }

  generateBreadcrumbStructuredData(breadcrumbs: Array<{
    name: string;
    url: string;
  }>): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    };
  }

  async generateSubjectKeywords(subject: {
    name: string;
    description: string;
    category: string;
  }): Promise<string[]> {
    const prompt = `
Generate a comprehensive list of SEO keywords for this exam preparation subject:

Subject: ${subject.name}
Description: ${subject.description}
Category: ${subject.category}

Return 15-20 keywords/phrases in JSON array format focusing on:
- Primary subject terms
- Certification names
- Exam preparation phrases
- Professional development terms
- Related skills and concepts
- Long-tail search queries

Format: ["keyword1", "keyword2", "keyword phrase", ...]
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanResponse);
    } catch (error) {
      console.error('Keyword generation error:', error);
      return [subject.name, subject.category, 'exam preparation', 'practice questions'];
    }
  }

  private generateFallbackSEO(content: any): SEOMetadata {
    return {
      title: `${content.title} | Brainliest`,
      description: content.description || `Study ${content.title} with practice questions and expert explanations on Brainliest.`,
      keywords: [content.title, content.category, content.subject, 'exam preparation', 'practice questions'].filter(Boolean),
      canonical: content.url,
      openGraph: {
        title: content.title,
        description: content.description || `Study ${content.title} on Brainliest`,
        type: 'website',
        url: content.url
      },
      twitter: {
        card: 'summary_large_image',
        title: content.title,
        description: content.description || `Study ${content.title} on Brainliest`
      }
    };
  }
}

export const seoService = new SEOService();