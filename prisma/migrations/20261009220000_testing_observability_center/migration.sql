-- CreateTable
CREATE TABLE IF NOT EXISTS "test_runs" (
    "id" TEXT NOT NULL,
    "suite" TEXT NOT NULL,
    "target_url" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'production',
    "initiated_by" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "duration_ms" INTEGER,
    "total_tests" INTEGER NOT NULL DEFAULT 0,
    "passed_tests" INTEGER NOT NULL DEFAULT 0,
    "failed_tests" INTEGER NOT NULL DEFAULT 0,
    "skipped_tests" INTEGER NOT NULL DEFAULT 0,
    "pass_rate" DOUBLE PRECISION,
    "metadata" JSONB,
    "error_summary" TEXT,

    CONSTRAINT "test_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "test_case_results" (
    "id" TEXT NOT NULL,
    "test_run_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "http_status" INTEGER,
    "endpoint" TEXT,
    "method" TEXT,
    "error_message" TEXT,
    "evidence" JSONB,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_case_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "test_metrics" (
    "id" TEXT NOT NULL,
    "test_run_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "sample_count" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "service_health_checks" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "latency_ms" INTEGER,
    "target_host" TEXT,
    "details" JSONB,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_health_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "test_artifacts" (
    "id" TEXT NOT NULL,
    "test_run_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "artifact_type" TEXT NOT NULL,
    "url_or_path" TEXT NOT NULL,
    "size_bytes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "test_cleanup_tasks" (
    "id" TEXT NOT NULL,
    "test_run_id" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cleaned_at" TIMESTAMP(3),

    CONSTRAINT "test_cleanup_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "test_runs_started_at_idx" ON "test_runs"("started_at");
CREATE INDEX IF NOT EXISTS "test_runs_status_idx" ON "test_runs"("status");
CREATE INDEX IF NOT EXISTS "test_runs_suite_idx" ON "test_runs"("suite");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "test_case_results_test_run_id_idx" ON "test_case_results"("test_run_id");
CREATE INDEX IF NOT EXISTS "test_case_results_status_idx" ON "test_case_results"("status");
CREATE INDEX IF NOT EXISTS "test_case_results_endpoint_idx" ON "test_case_results"("endpoint");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "test_metrics_test_run_id_idx" ON "test_metrics"("test_run_id");
CREATE INDEX IF NOT EXISTS "test_metrics_name_idx" ON "test_metrics"("name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "service_health_checks_service_checked_at_idx" ON "service_health_checks"("service", "checked_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "test_artifacts_test_run_id_idx" ON "test_artifacts"("test_run_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "test_cleanup_tasks_test_run_id_idx" ON "test_cleanup_tasks"("test_run_id");
CREATE INDEX IF NOT EXISTS "test_cleanup_tasks_status_idx" ON "test_cleanup_tasks"("status");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'test_case_results_test_run_id_fkey'
    ) THEN
        ALTER TABLE "test_case_results" ADD CONSTRAINT "test_case_results_test_run_id_fkey" FOREIGN KEY ("test_run_id") REFERENCES "test_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'test_metrics_test_run_id_fkey'
    ) THEN
        ALTER TABLE "test_metrics" ADD CONSTRAINT "test_metrics_test_run_id_fkey" FOREIGN KEY ("test_run_id") REFERENCES "test_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'test_artifacts_test_run_id_fkey'
    ) THEN
        ALTER TABLE "test_artifacts" ADD CONSTRAINT "test_artifacts_test_run_id_fkey" FOREIGN KEY ("test_run_id") REFERENCES "test_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'test_cleanup_tasks_test_run_id_fkey'
    ) THEN
        ALTER TABLE "test_cleanup_tasks" ADD CONSTRAINT "test_cleanup_tasks_test_run_id_fkey" FOREIGN KEY ("test_run_id") REFERENCES "test_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
