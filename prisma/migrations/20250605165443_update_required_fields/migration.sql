-- AlterTable
ALTER TABLE "property_translations" ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "country" DROP NOT NULL,
ALTER COLUMN "beds" DROP NOT NULL,
ALTER COLUMN "baths" DROP NOT NULL,
ALTER COLUMN "size" DROP NOT NULL;
