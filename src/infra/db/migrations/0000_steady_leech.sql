CREATE TABLE "models" (
	"slug" text PRIMARY KEY NOT NULL,
	"id" text NOT NULL,
	"name" text NOT NULL,
	"family" text NOT NULL,
	"license" text NOT NULL,
	"params_b" real DEFAULT 0 NOT NULL,
	"context_len" integer DEFAULT 0 NOT NULL,
	"num_layers" integer DEFAULT 0 NOT NULL,
	"attention_type" text NOT NULL,
	"is_moe" boolean DEFAULT false NOT NULL,
	"modalities" text[] NOT NULL,
	"downloads" integer DEFAULT 0 NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"mmlu" real,
	"last_modified" text,
	"data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "models_downloads_idx" ON "models" USING btree ("downloads");--> statement-breakpoint
CREATE INDEX "models_family_idx" ON "models" USING btree ("family");--> statement-breakpoint
CREATE INDEX "models_attention_idx" ON "models" USING btree ("attention_type");