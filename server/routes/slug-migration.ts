/**
 * API endpoints for slug migration management
 * Provides controlled migration execution and status checking
 */

import { Router } from "express";
import { SlugMigrationRunner } from "../migrations/migration-runner";

const router = Router();

/**
 * Run Phase 1 migration
 */
router.post("/migration/phase1", async (req, res) => {
  try {
    console.log("🚀 API: Starting Phase 1 migration...");
    const result = await SlugMigrationRunner.runPhase1();
    
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("❌ API: Phase 1 migration failed:", error);
    res.status(500).json({
      success: false,
      phase: "Phase 1",
      message: "Migration failed",
      details: { error: error.message }
    });
  }
});

/**
 * Rollback Phase 1 migration
 */
router.post("/migration/rollback", async (req, res) => {
  try {
    console.log("🔄 API: Rolling back Phase 1...");
    const result = await SlugMigrationRunner.rollbackPhase1();
    
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("❌ API: Rollback failed:", error);
    res.status(500).json({
      success: false,
      phase: "Rollback",
      message: "Rollback failed",
      details: { error: error.message }
    });
  }
});

/**
 * Check migration status
 */
router.get("/migration/status", async (req, res) => {
  try {
    const status = await SlugMigrationRunner.checkStatus();
    res.json(status);
  } catch (error) {
    console.error("❌ API: Status check failed:", error);
    res.status(500).json({
      phase1Complete: false,
      details: { error: error.message }
    });
  }
});

export { router as slugMigrationRoutes };