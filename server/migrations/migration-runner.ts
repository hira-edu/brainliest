/**
 * Migration Runner for Slug System Implementation
 * Orchestrates the phased migration approach
 */

import { migrateAddSlugColumns, rollbackSlugColumns } from "./001-add-slug-columns";
import { populateExistingSlugs, validateSlugPopulation } from "./002-populate-slugs";

export interface MigrationResult {
  success: boolean;
  phase: string;
  message: string;
  details?: any;
}

export class SlugMigrationRunner {
  
  /**
   * Run Phase 1: Add slug columns and populate existing data
   */
  static async runPhase1(): Promise<MigrationResult> {
    console.log("🚀 Starting Slug Migration Phase 1...");
    
    try {
      // Step 1: Add slug columns
      await migrateAddSlugColumns();
      
      // Step 2: Populate existing slugs
      await populateExistingSlugs();
      
      // Step 3: Validate migration
      const validation = await validateSlugPopulation();
      
      if (!validation.valid) {
        return {
          success: false,
          phase: "Phase 1",
          message: "Slug population validation failed",
          details: validation.report
        };
      }
      
      console.log("🎉 Phase 1 completed successfully!");
      
      return {
        success: true,
        phase: "Phase 1",
        message: "Successfully added slug columns and populated existing data",
        details: validation.report
      };
      
    } catch (error) {
      console.error("❌ Phase 1 failed:", error);
      
      return {
        success: false,
        phase: "Phase 1",
        message: `Phase 1 failed: ${error.message}`,
        details: { error: error.stack }
      };
    }
  }
  
  /**
   * Rollback Phase 1: Remove slug columns
   */
  static async rollbackPhase1(): Promise<MigrationResult> {
    console.log("🔄 Rolling back Slug Migration Phase 1...");
    
    try {
      await rollbackSlugColumns();
      
      return {
        success: true,
        phase: "Phase 1 Rollback",
        message: "Successfully rolled back Phase 1 changes"
      };
      
    } catch (error) {
      console.error("❌ Phase 1 rollback failed:", error);
      
      return {
        success: false,
        phase: "Phase 1 Rollback",
        message: `Rollback failed: ${error.message}`,
        details: { error: error.stack }
      };
    }
  }
  
  /**
   * Check migration status
   */
  static async checkStatus(): Promise<{ phase1Complete: boolean; details: any }> {
    try {
      const validation = await validateSlugPopulation();
      
      return {
        phase1Complete: validation.valid,
        details: validation.report
      };
      
    } catch (error) {
      return {
        phase1Complete: false,
        details: { error: error.message }
      };
    }
  }
}

// CLI interface for running migrations
if (require.main === module) {
  const command = process.argv[2];
  
  async function runCommand() {
    switch (command) {
      case 'phase1':
        const result = await SlugMigrationRunner.runPhase1();
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.success ? 0 : 1);
        break;
        
      case 'rollback':
        const rollbackResult = await SlugMigrationRunner.rollbackPhase1();
        console.log(JSON.stringify(rollbackResult, null, 2));
        process.exit(rollbackResult.success ? 0 : 1);
        break;
        
      case 'status':
        const status = await SlugMigrationRunner.checkStatus();
        console.log(JSON.stringify(status, null, 2));
        break;
        
      default:
        console.log("Usage: tsx migration-runner.ts [phase1|rollback|status]");
        process.exit(1);
    }
  }
  
  runCommand().catch(console.error);
}