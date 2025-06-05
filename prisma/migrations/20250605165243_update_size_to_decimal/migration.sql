/*
  Warnings:

  - You are about to alter the column `size` on the `properties` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.
  - Changed the type of `size` on the `property_translations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "properties" ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "city" DROP NOT NULL,
ALTER COLUMN "street" DROP NOT NULL,
ALTER COLUMN "country" DROP NOT NULL,
ALTER COLUMN "size" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "beds" DROP NOT NULL,
ALTER COLUMN "baths" DROP NOT NULL;

-- AlterTable
ALTER TABLE "property_translations" DROP COLUMN "size",
ADD COLUMN     "size" DECIMAL(10,2) NOT NULL;
