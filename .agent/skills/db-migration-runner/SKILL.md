# Skill: DB Migration Runner

## Purpose
This skill guide details how to modify the database schema and run migrations for MeCal using Prisma. It ensures database changes are safe, documented, and do not break existing data or user separation rules.

## Core Rules
- **ORM**: Prisma v5.
- **Database**: PostgreSQL v15.
- **Schema Location**: `server/prisma/schema.prisma`.
- **Constraint**: Never write raw SQL — use Prisma client only.
- **Constraint**: Every user's data is scoped to their `userId` — never query across users.
- **Constraint**: Run migrations before testing schema changes locally.

## Implementation Flow

### 1. Modifying the Schema
- Open `server/prisma/schema.prisma`.
- Make the necessary changes (add models, fields, or relations).
- Always ensure new models for user data include a relation to the `User` model via `userId`.

### 2. Generating and Applying Migrations
- Navigate to the server directory or ensure commands are run in the context of the server folder.
- Run the following command to create and apply a migration for development:
  ```powershell
  npx prisma migrate dev --name <migration_name>
  ```
  Replace `<migration_name>` with a short, descriptive name (e.g., `add_saved_foods_table`).
- This command will:
  1. Generate the migration SQL file.
  2. Apply it to the database.
  3. Regenerate the Prisma client.

### 3. Verifying the Change
- You can use Prisma Studio to visually inspect the database and ensure the schema updated as expected:
  ```powershell
  npx prisma studio
  ```

## Best Practices
- **No Direct Edits**: Never edit generated SQL migration files manually after they are created unless resolving a specific conflict.
- **Data Scoping**: When adding a new table that holds user data, ensure it has a `userId` field with a foreign key constraint to the `User` table to maintain privacy scoping.
- **Backup/Safety**: In a production or staging environment (not applicable for local dev but good practice), migrations should be reviewed before application.

## Reference Files
- `AGENT.md` (Database section)
- `rules/security.md` (For data isolation rules)
