/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `blog_translations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `blog_translations` table without a default value. This is not possible if the table is not empty.

*/
-- Drop existing table and recreate with new schema
DROP TABLE IF EXISTS "blog_translations";

-- CreateTable
CREATE TABLE "blog_translations" (
    "id" SERIAL NOT NULL,
    "blog_id" INTEGER NOT NULL,
    "language" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT[] NOT NULL,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "keywords" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blog_translations_blog_id_language_key" ON "blog_translations"("blog_id", "language");

-- CreateIndex
CREATE UNIQUE INDEX "blog_translations_slug_key" ON "blog_translations"("slug");

-- AddForeignKey
ALTER TABLE "blog_translations" ADD CONSTRAINT "blog_translations_blog_id_fkey" FOREIGN KEY ("blog_id") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
