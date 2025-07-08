import csv from 'csv-parser';
import { Readable } from 'stream';
import { CSV_TEMPLATES, CSVTemplate, CSVEntityType } from './csv-templates';
import { DatabaseStorage } from '../storage';

export interface CSVValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
}

export interface CSVProcessResult {
  success: boolean;
  totalRows: number;
  processedRows: number;
  createdCount: number;
  updatedCount: number;
  deletedCount: number;
  errors: CSVValidationError[];
  message: string;
}

export interface CSVExportOptions {
  includeRelationshipNames?: boolean;
  includeMetadata?: boolean;
}

export class CSVService {
  private storage: DatabaseStorage;

  constructor(storage: DatabaseStorage) {
    this.storage = storage;
  }

  // Generate CSV template with headers and sample data
  async generateTemplate(entityType: CSVEntityType): Promise<string> {
    const template = CSV_TEMPLATES[entityType];
    if (!template) {
      throw new Error(`Template not found for entity: ${entityType}`);
    }

    // Create headers with descriptions
    const headers = template.fields.map(field => field.columnName);
    const descriptions = template.fields.map(field => `# ${field.description}`);
    const sampleRow = template.fields.map(field => this.generateSampleValue(field));
    
    // Build CSV content
    let csvContent = '';
    
    // Add field descriptions as comments
    csvContent += descriptions.join('\n') + '\n';
    csvContent += '# Remove these comment lines before uploading\n';
    csvContent += '# Action column: leave blank for create, "update" for edit, "delete" to remove\n\n';
    
    // Add headers
    csvContent += headers.join(',') + '\n';
    
    // Add sample row
    csvContent += sampleRow.join(',') + '\n';

    return csvContent;
  }

  // Export existing data to CSV
  async exportData(entityType: CSVEntityType, options: CSVExportOptions = {}): Promise<string> {
    const template = CSV_TEMPLATES[entityType];
    if (!template) {
      throw new Error(`Template not found for entity: ${entityType}`);
    }

    let data: any[] = [];
    
    // Fetch data based on entity type
    switch (entityType) {
      case 'subjects':
        data = await this.storage.getSubjects();
        break;
      case 'exams':
        data = await this.storage.getExams();
        break;
      case 'questions':
        data = await this.storage.getQuestions();
        break;
      case 'categories':
        data = []; // Categories not implemented yet
        break;
      case 'subcategories':
        data = []; // Subcategories not implemented yet
        break;
      default:
        throw new Error(`Export not implemented for entity: ${entityType}`);
    }

    // Get relationship data if needed
    const relationshipData: { [key: string]: any[] } = {};
    if (options.includeRelationshipNames && template.relationships) {
      for (const [fieldKey, relation] of Object.entries(template.relationships)) {
        switch (relation.table) {
          case 'subjects':
            relationshipData[relation.table] = await this.storage.getSubjects();
            break;
          case 'exams':
            relationshipData[relation.table] = await this.storage.getExams();
            break;
          case 'categories':
            // Categories are hardcoded in the frontend, not stored in database
            relationshipData[relation.table] = [];
            break;
          case 'subcategories':
            // Subcategories are hardcoded in the frontend, not stored in database
            relationshipData[relation.table] = [];
            break;
        }
      }
    }

    // Create headers
    const headers = template.fields
      .filter(field => field.fieldKey !== '_action')
      .map(field => field.columnName);

    // Convert data to CSV rows
    const csvRows = data.map(item => {
      return template.fields
        .filter(field => field.fieldKey !== '_action')
        .map(field => {
          let value = item[field.fieldKey];
          
          // Handle array fields
          if (field.type === 'array' && Array.isArray(value)) {
            if (field.fieldKey === 'options') {
              return `"${value.join('|')}"`;
            } else {
              return `"${value.join(',')}"`;
            }
          }
          
          // Handle boolean fields
          if (field.type === 'boolean') {
            return value ? 'true' : 'false';
          }
          
          // Handle relationship names
          if (options.includeRelationshipNames && template.relationships?.[field.fieldKey]) {
            const relation = template.relationships[field.fieldKey];
            const relatedData = relationshipData[relation.table];
            const relatedItem = relatedData?.find(r => r[relation.valueField] === value);
            if (relatedItem) {
              return `"${relatedItem[relation.displayField]} (ID: ${value})"`;
            }
          }
          
          // Handle text fields with potential commas or quotes
          if (field.type === 'text' && typeof value === 'string') {
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
          }
          
          return value ?? '';
        });
    });

    // Build CSV content
    let csvContent = headers.join(',') + '\n';
    csvContent += csvRows.map(row => row.join(',')).join('\n');

    return csvContent;
  }

  // Import CSV data with full CRUD support
  async importData(entityType: CSVEntityType, csvContent: string): Promise<CSVProcessResult> {
    const template = CSV_TEMPLATES[entityType];
    if (!template) {
      throw new Error(`Template not found for entity: ${entityType}`);
    }

    const result: CSVProcessResult = {
      success: false,
      totalRows: 0,
      processedRows: 0,
      createdCount: 0,
      updatedCount: 0,
      deletedCount: 0,
      errors: [],
      message: ''
    };

    try {
      // Parse CSV content
      const rows = await this.parseCSV(csvContent);
      result.totalRows = rows.length;

      // Validate and process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 1;

        try {
          // Validate row
          const validationErrors = this.validateRow(row, template, rowNumber);
          if (validationErrors.length > 0) {
            result.errors.push(...validationErrors);
            continue;
          }

          // Convert CSV row to entity data
          const entityData = this.convertRowToEntity(row, template);
          const action = row._action || (entityData.id ? 'update' : 'create');

          // Perform CRUD operation
          switch (action.toLowerCase()) {
            case 'create':
              await this.createEntity(entityType, entityData);
              result.createdCount++;
              break;
            case 'update':
              if (!entityData.id) {
                result.errors.push({
                  row: rowNumber,
                  field: 'id',
                  value: entityData.id,
                  message: 'ID is required for update operations'
                });
                continue;
              }
              await this.updateEntity(entityType, entityData.id, entityData);
              result.updatedCount++;
              break;
            case 'delete':
              if (!entityData.id) {
                result.errors.push({
                  row: rowNumber,
                  field: 'id',
                  value: entityData.id,
                  message: 'ID is required for delete operations'
                });
                continue;
              }
              await this.deleteEntity(entityType, entityData.id);
              result.deletedCount++;
              break;
            default:
              result.errors.push({
                row: rowNumber,
                field: '_action',
                value: action,
                message: 'Invalid action. Use: create, update, or delete'
              });
              continue;
          }

          result.processedRows++;
        } catch (error: any) {
          result.errors.push({
            row: rowNumber,
            field: 'general',
            value: '',
            message: error.message || 'Unknown error occurred'
          });
        }
      }

      result.success = result.errors.length === 0 || result.processedRows > 0;
      result.message = this.generateResultMessage(result);

    } catch (error: any) {
      result.success = false;
      result.message = `CSV processing failed: ${error.message}`;
    }

    return result;
  }

  private async parseCSV(csvContent: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const rows: any[] = [];
      const stream = Readable.from([csvContent]);
      
      stream
        .pipe(csv())
        .on('data', (row) => {
          // Skip comment lines
          if (!Object.keys(row)[0]?.startsWith('#')) {
            rows.push(row);
          }
        })
        .on('end', () => resolve(rows))
        .on('error', reject);
    });
  }

  private validateRow(row: any, template: CSVTemplate, rowNumber: number): CSVValidationError[] {
    const errors: CSVValidationError[] = [];

    for (const field of template.fields) {
      const value = row[field.columnName];
      
      // Check required fields
      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push({
          row: rowNumber,
          field: field.fieldKey,
          value: value,
          message: `${field.columnName} is required`
        });
        continue;
      }

      // Skip validation for empty optional fields
      if (!value && !field.required) continue;

      // Type validation
      switch (field.type) {
        case 'number':
          if (value && isNaN(Number(value))) {
            errors.push({
              row: rowNumber,
              field: field.fieldKey,
              value: value,
              message: `${field.columnName} must be a number`
            });
          }
          break;
        case 'boolean':
          if (value && !['true', 'false', '1', '0'].includes(value.toLowerCase())) {
            errors.push({
              row: rowNumber,
              field: field.fieldKey,
              value: value,
              message: `${field.columnName} must be true or false`
            });
          }
          break;
        case 'select':
          if (value && field.options && !field.options.includes(value)) {
            errors.push({
              row: rowNumber,
              field: field.fieldKey,
              value: value,
              message: `${field.columnName} must be one of: ${field.options.join(', ')}`
            });
          }
          break;
      }

      // Validation rules
      if (field.validation && value) {
        if (field.validation.min !== undefined && value.length < field.validation.min) {
          errors.push({
            row: rowNumber,
            field: field.fieldKey,
            value: value,
            message: `${field.columnName} must be at least ${field.validation.min} characters`
          });
        }
        if (field.validation.max !== undefined && value.length > field.validation.max) {
          errors.push({
            row: rowNumber,
            field: field.fieldKey,
            value: value,
            message: `${field.columnName} must be no more than ${field.validation.max} characters`
          });
        }
      }
    }

    return errors;
  }

  private convertRowToEntity(row: any, template: CSVTemplate): any {
    const entity: any = {};

    for (const field of template.fields) {
      if (field.fieldKey === '_action') continue;
      
      const value = row[field.columnName];
      if (value === undefined || value === null || value === '') {
        continue;
      }

      switch (field.type) {
        case 'number':
          entity[field.fieldKey] = Number(value);
          break;
        case 'boolean':
          entity[field.fieldKey] = ['true', '1'].includes(value.toLowerCase());
          break;
        case 'array':
          if (field.fieldKey === 'options') {
            entity[field.fieldKey] = value.split('|').map((s: string) => s.trim());
          } else if (field.fieldKey === 'correctAnswers') {
            entity[field.fieldKey] = value.split(',').map((s: string) => Number(s.trim()));
          } else {
            entity[field.fieldKey] = value.split(',').map((s: string) => s.trim());
          }
          break;
        default:
          entity[field.fieldKey] = value;
      }
    }

    return entity;
  }

  private async createEntity(entityType: CSVEntityType, data: any): Promise<void> {
    switch (entityType) {
      case 'subjects':
        await this.storage.createSubject(data);
        break;
      case 'exams':
        await this.storage.createExam(data);
        break;
      case 'questions':
        await this.storage.createQuestion(data);
        break;
      case 'categories':
        throw new Error('Category management not implemented yet');
      case 'subcategories':
        throw new Error('Subcategory management not implemented yet');
      default:
        throw new Error(`Create not implemented for entity: ${entityType}`);
    }
  }

  private async updateEntity(entityType: CSVEntityType, id: number, data: any): Promise<void> {
    switch (entityType) {
      case 'subjects':
        await this.storage.updateSubject(id, data);
        break;
      case 'exams':
        await this.storage.updateExam(id, data);
        break;
      case 'questions':
        await this.storage.updateQuestion(id, data);
        break;
      case 'categories':
        throw new Error('Category management not implemented yet');
      case 'subcategories':
        throw new Error('Subcategory management not implemented yet');
      default:
        throw new Error(`Update not implemented for entity: ${entityType}`);
    }
  }

  private async deleteEntity(entityType: CSVEntityType, id: number): Promise<void> {
    switch (entityType) {
      case 'subjects':
        await this.storage.deleteSubject(id);
        break;
      case 'exams':
        await this.storage.deleteExam(id);
        break;
      case 'questions':
        await this.storage.deleteQuestion(id);
        break;
      case 'categories':
        throw new Error('Category management not implemented yet');
      case 'subcategories':
        throw new Error('Subcategory management not implemented yet');
      default:
        throw new Error(`Delete not implemented for entity: ${entityType}`);
    }
  }

  private generateSampleValue(field: any): string {
    switch (field.type) {
      case 'number':
        if (field.fieldKey === 'id') return '';
        return field.fieldKey.includes('Order') ? '1' : '1';
      case 'boolean':
        return 'true';
      case 'select':
        return field.options ? field.options[0] : '';
      case 'array':
        if (field.fieldKey === 'options') {
          return '"Option A|Option B|Option C|Option D"';
        } else if (field.fieldKey === 'correctAnswers') {
          return '"0,2"';
        }
        return '"item1,item2"';
      case 'text':
        if (field.fieldKey === 'name') return 'Sample Name';
        if (field.fieldKey === 'title') return 'Sample Title';
        if (field.fieldKey === 'description') return 'Sample description';
        if (field.fieldKey === 'text') return 'Sample question text?';
        if (field.fieldKey === 'explanation') return 'Sample explanation';
        if (field.fieldKey === 'icon') return 'fas fa-certificate';
        return 'Sample text';
      default:
        return '';
    }
  }

  private generateResultMessage(result: CSVProcessResult): string {
    if (!result.success && result.processedRows === 0) {
      return `Import failed: ${result.errors.length} validation errors occurred`;
    }

    const parts = [];
    if (result.createdCount > 0) parts.push(`${result.createdCount} created`);
    if (result.updatedCount > 0) parts.push(`${result.updatedCount} updated`);
    if (result.deletedCount > 0) parts.push(`${result.deletedCount} deleted`);

    let message = `Import completed: ${parts.join(', ')}`;
    if (result.errors.length > 0) {
      message += ` (${result.errors.length} errors)`;
    }

    return message;
  }
}