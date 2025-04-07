import { pgTable, foreignKey, pgPolicy, uuid, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const userApps = pgTable("user_apps", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	containerId: text("container_id").notNull(),
	port: integer().notNull(),
	status: text().default('creating').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	appName: text("app_name").notNull(),
	appUrl: text("app_url"),
	codePath: text("code_path"),
	slug: text(),
	proxyUrl: text("proxy_url"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_apps_user_id_fkey"
		}),
	pgPolicy("Users can view their own apps", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.uid() = user_id)` }),
	pgPolicy("Users can update their own apps", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Users can insert their own apps", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can delete their own apps", { as: "permissive", for: "delete", to: ["public"] }),
	pgPolicy("Users can create their own apps", { as: "permissive", for: "insert", to: ["authenticated"] }),
]);

export const appChatHistory = pgTable("app_chat_history", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	appId: uuid("app_id").notNull(),
	userId: uuid("user_id").notNull(),
	content: text().notNull(),
	role: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	modelUsed: text("model_used"),
	metadata: jsonb(),
	outputTokensUsed: integer("output_tokens_used"),
	inputTokensUsed: integer("input_tokens_used"),
}, (table) => [
	foreignKey({
			columns: [table.appId],
			foreignColumns: [userApps.id],
			name: "app_chat_history_app_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "app_chat_history_user_id_fkey"
		}),
]);
