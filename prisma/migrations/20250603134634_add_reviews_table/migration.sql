-- AlterEnum
ALTER TYPE "PropertyStatus" ADD VALUE 'RENT';

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "property_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
