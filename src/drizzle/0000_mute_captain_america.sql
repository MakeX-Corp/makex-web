-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "user_apps" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"container_id" text NOT NULL,
	"port" integer NOT NULL,
	"status" text DEFAULT 'creating' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"app_name" text NOT NULL,
	"app_url" text,
	"code_path" text,
	"slug" text,
	"proxy_url" text
);
--> statement-breakpoint
ALTER TABLE "user_apps" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_chat_history" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"app_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"model_used" text,
	"metadata" jsonb,
	"output_tokens_used" integer,
	"input_tokens_used" integer
);
--> statement-breakpoint
ALTER TABLE "user_apps" ADD CONSTRAINT "user_apps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_chat_history" ADD CONSTRAINT "app_chat_history_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "public"."user_apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_chat_history" ADD CONSTRAINT "app_chat_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "Users can view their own apps" ON "user_apps" AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));--> statement-breakpoint
CREATE POLICY "Users can update their own apps" ON "user_apps" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can insert their own apps" ON "user_apps" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can delete their own apps" ON "user_apps" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Users can create their own apps" ON "user_apps" AS PERMISSIVE FOR INSERT TO "authenticated";
*/