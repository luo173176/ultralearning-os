-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DirectPractice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "form" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DirectPractice_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DirectPractice" ("completedAt", "description", "form", "id", "projectId", "startedAt", "status", "title") SELECT "completedAt", "description", "form", "id", "projectId", "startedAt", "status", "title" FROM "DirectPractice";
DROP TABLE "DirectPractice";
ALTER TABLE "new_DirectPractice" RENAME TO "DirectPractice";
CREATE INDEX "DirectPractice_projectId_status_idx" ON "DirectPractice"("projectId", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
