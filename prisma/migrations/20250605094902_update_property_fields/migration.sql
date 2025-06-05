/*
  Warnings:

  - The `aboveGroundFloors` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `balconyArea` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `basementArea` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `buildingStoriesNumber` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `builtUpArea` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `floorArea` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `garageArea` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `gardenArea` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `gardenHouseArea` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `landArea` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `pergolaArea` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `reconstructionYearApartment` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `reconstructionYearBuilding` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `terraceArea` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `totalAboveGroundFloors` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `totalLandArea` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `totalObjectArea` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `totalUndergroundFloors` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `usableArea` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `workshopArea` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `size` on the `properties` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `beds` on the `properties` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `baths` on the `properties` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "properties" DROP COLUMN "size",
ADD COLUMN     "size" INTEGER NOT NULL,
DROP COLUMN "beds",
ADD COLUMN     "beds" INTEGER NOT NULL,
DROP COLUMN "baths",
ADD COLUMN     "baths" INTEGER NOT NULL,
DROP COLUMN "aboveGroundFloors",
ADD COLUMN     "aboveGroundFloors" INTEGER,
DROP COLUMN "balconyArea",
ADD COLUMN     "balconyArea" DECIMAL(10,2),
DROP COLUMN "basementArea",
ADD COLUMN     "basementArea" DECIMAL(10,2),
DROP COLUMN "buildingStoriesNumber",
ADD COLUMN     "buildingStoriesNumber" INTEGER,
DROP COLUMN "builtUpArea",
ADD COLUMN     "builtUpArea" DECIMAL(10,2),
DROP COLUMN "floorArea",
ADD COLUMN     "floorArea" DECIMAL(10,2),
DROP COLUMN "garageArea",
ADD COLUMN     "garageArea" DECIMAL(10,2),
DROP COLUMN "gardenArea",
ADD COLUMN     "gardenArea" DECIMAL(10,2),
DROP COLUMN "gardenHouseArea",
ADD COLUMN     "gardenHouseArea" DECIMAL(10,2),
DROP COLUMN "landArea",
ADD COLUMN     "landArea" DECIMAL(10,2),
DROP COLUMN "pergolaArea",
ADD COLUMN     "pergolaArea" DECIMAL(10,2),
DROP COLUMN "reconstructionYearApartment",
ADD COLUMN     "reconstructionYearApartment" INTEGER,
DROP COLUMN "reconstructionYearBuilding",
ADD COLUMN     "reconstructionYearBuilding" INTEGER,
DROP COLUMN "terraceArea",
ADD COLUMN     "terraceArea" DECIMAL(10,2),
DROP COLUMN "totalAboveGroundFloors",
ADD COLUMN     "totalAboveGroundFloors" INTEGER,
DROP COLUMN "totalLandArea",
ADD COLUMN     "totalLandArea" DECIMAL(10,2),
DROP COLUMN "totalObjectArea",
ADD COLUMN     "totalObjectArea" DECIMAL(10,2),
DROP COLUMN "totalUndergroundFloors",
ADD COLUMN     "totalUndergroundFloors" INTEGER,
DROP COLUMN "usableArea",
ADD COLUMN     "usableArea" DECIMAL(10,2),
DROP COLUMN "workshopArea",
ADD COLUMN     "workshopArea" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "property_translations" (
    "id" SERIAL NOT NULL,
    "property_id" INTEGER NOT NULL,
    "language" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "beds" TEXT NOT NULL,
    "baths" TEXT NOT NULL,
    "buildingCondition" TEXT,
    "apartmentCondition" TEXT,
    "objectType" TEXT,
    "objectLocationType" TEXT,
    "houseEquipment" TEXT,
    "accessRoad" TEXT,
    "objectCondition" TEXT,
    "equipmentDescription" TEXT,
    "additionalSources" TEXT,
    "buildingPermit" TEXT,
    "buildability" TEXT,
    "utilitiesOnLand" TEXT,
    "utilitiesOnAdjacentRoad" TEXT,
    "payments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "property_translations_property_id_language_key" ON "property_translations"("property_id", "language");

-- AddForeignKey
ALTER TABLE "property_translations" ADD CONSTRAINT "property_translations_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
