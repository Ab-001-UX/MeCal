-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
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
