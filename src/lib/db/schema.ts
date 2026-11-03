import { mysqlTable, timestamp, varchar, text, int, boolean, index } from "drizzle-orm/mysql-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

export const userProfiles = mysqlTable("user_profile", {
  userId: varchar("user_id", { length: 36 }).primaryKey().references(() => user.id, { onDelete: "cascade" }),
  displayName: varchar("display_name", { length: 60 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const userPreferences = mysqlTable("user_preference", {
  userId: varchar("user_id", { length: 36 }).primaryKey().references(() => user.id, { onDelete: "cascade" }),
  learningGoal: varchar("learning_goal", { length: 64 }).default("Build a steady practice habit").notNull(),
  theme: varchar("theme", { length: 16 }).default("dark").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const problemSubmissions = mysqlTable(
  "problem_submission",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    problemSlug: varchar("problem_slug", { length: 128 }).notNull(),
    language: varchar("language", { length: 32 }).default("cpp17").notNull(),
    sourceCode: text("source_code").notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    passedCount: int("passed_count").default(0).notNull(),
    totalCount: int("total_count").default(0).notNull(),
    isSampleRun: boolean("is_sample_run").default(true).notNull(),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (table) => [
    index("problem_submission_user_problem_idx").on(table.userId, table.problemSlug),
    index("problem_submission_user_created_idx").on(table.userId, table.createdAt),
  ],
);
