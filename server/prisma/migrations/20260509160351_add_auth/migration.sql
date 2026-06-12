/*
  Warnings:

  - Added the required column `email` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "age" INTEGER,
    "height" REAL,
    "weight" REAL,
    "unitPreference" TEXT NOT NULL DEFAULT 'kg',
    "goal" TEXT,
    "targetDuration" TEXT,
    "country" TEXT,
    "tribe" TEXT,
    "lifestyleType" TEXT,
    "budgetPreference" TEXT,
    "foodAvailability" TEXT,
    "activityLevel" TEXT,
    "waterPreference" TEXT NOT NULL DEFAULT 'sachet',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("activityLevel", "age", "budgetPreference", "country", "createdAt", "foodAvailability", "goal", "height", "id", "lifestyleType", "name", "targetDuration", "tribe", "unitPreference", "updatedAt", "waterPreference", "weight") SELECT "activityLevel", "age", "budgetPreference", "country", "createdAt", "foodAvailability", "goal", "height", "id", "lifestyleType", "name", "targetDuration", "tribe", "unitPreference", "updatedAt", "waterPreference", "weight" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
