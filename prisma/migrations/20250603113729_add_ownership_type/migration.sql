/*
  Warnings:

  - You are about to drop the column `above_ground_floors` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `access_road` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `additional_sources` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `apartment_condition` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `balcony_area` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `basement_area` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `broker_id` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `building_condition` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `building_permit` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `building_stories_number` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `built_up_area` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `discounted_price` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `equipment_description` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `floor_area` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `garage_area` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `garden_area` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `garden_house_area` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `house_equipment` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `land_area` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `object_condition` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `object_location_type` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `object_type` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `ownership_type` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `pergola_area` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `reconstruction_year_apartment` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `reconstruction_year_building` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `reservation_price` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `secondary_agent` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `terrace_area` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `total_above_ground_floors` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `total_land_area` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `total_object_area` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `total_underground_floors` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `usable_area` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `utilities_on_adjacent_road` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `utilities_on_land` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `video_url` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `virtual_tour` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `workshop_area` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `is_main` on the `property_images` table. All the data in the column will be lost.
  - Added the required column `ownershipType` to the `properties` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "properties" DROP COLUMN "above_ground_floors",
DROP COLUMN "access_road",
DROP COLUMN "additional_sources",
DROP COLUMN "apartment_condition",
DROP COLUMN "balcony_area",
DROP COLUMN "basement_area",
DROP COLUMN "broker_id",
DROP COLUMN "building_condition",
DROP COLUMN "building_permit",
DROP COLUMN "building_stories_number",
DROP COLUMN "built_up_area",
DROP COLUMN "discounted_price",
DROP COLUMN "equipment_description",
DROP COLUMN "floor_area",
DROP COLUMN "garage_area",
DROP COLUMN "garden_area",
DROP COLUMN "garden_house_area",
DROP COLUMN "house_equipment",
DROP COLUMN "land_area",
DROP COLUMN "object_condition",
DROP COLUMN "object_location_type",
DROP COLUMN "object_type",
DROP COLUMN "ownership_type",
DROP COLUMN "pergola_area",
DROP COLUMN "reconstruction_year_apartment",
DROP COLUMN "reconstruction_year_building",
DROP COLUMN "reservation_price",
DROP COLUMN "secondary_agent",
DROP COLUMN "terrace_area",
DROP COLUMN "total_above_ground_floors",
DROP COLUMN "total_land_area",
DROP COLUMN "total_object_area",
DROP COLUMN "total_underground_floors",
DROP COLUMN "usable_area",
DROP COLUMN "utilities_on_adjacent_road",
DROP COLUMN "utilities_on_land",
DROP COLUMN "video_url",
DROP COLUMN "virtual_tour",
DROP COLUMN "workshop_area",
ADD COLUMN     "aboveGroundFloors" TEXT,
ADD COLUMN     "accessRoad" TEXT,
ADD COLUMN     "additionalSources" TEXT,
ADD COLUMN     "apartmentCondition" TEXT,
ADD COLUMN     "balconyArea" TEXT,
ADD COLUMN     "basementArea" TEXT,
ADD COLUMN     "brokerId" TEXT,
ADD COLUMN     "buildingCondition" TEXT,
ADD COLUMN     "buildingPermit" TEXT,
ADD COLUMN     "buildingStoriesNumber" TEXT,
ADD COLUMN     "builtUpArea" TEXT,
ADD COLUMN     "discountedPrice" DECIMAL(10,2),
ADD COLUMN     "equipmentDescription" TEXT,
ADD COLUMN     "floorArea" TEXT,
ADD COLUMN     "garageArea" TEXT,
ADD COLUMN     "gardenArea" TEXT,
ADD COLUMN     "gardenHouseArea" TEXT,
ADD COLUMN     "houseEquipment" TEXT,
ADD COLUMN     "landArea" TEXT,
ADD COLUMN     "objectCondition" TEXT,
ADD COLUMN     "objectLocationType" TEXT,
ADD COLUMN     "objectType" TEXT,
ADD COLUMN     "ownershipType" "OwnershipType" NOT NULL,
ADD COLUMN     "pergolaArea" TEXT,
ADD COLUMN     "reconstructionYearApartment" TEXT,
ADD COLUMN     "reconstructionYearBuilding" TEXT,
ADD COLUMN     "reservationPrice" TEXT,
ADD COLUMN     "secondaryAgent" TEXT,
ADD COLUMN     "terraceArea" TEXT,
ADD COLUMN     "totalAboveGroundFloors" TEXT,
ADD COLUMN     "totalLandArea" TEXT,
ADD COLUMN     "totalObjectArea" TEXT,
ADD COLUMN     "totalUndergroundFloors" TEXT,
ADD COLUMN     "usableArea" TEXT,
ADD COLUMN     "utilitiesOnAdjacentRoad" TEXT,
ADD COLUMN     "utilitiesOnLand" TEXT,
ADD COLUMN     "videoUrl" TEXT,
ADD COLUMN     "virtualTour" TEXT,
ADD COLUMN     "workshopArea" TEXT;

-- AlterTable
ALTER TABLE "property_images" DROP COLUMN "is_main",
ADD COLUMN     "isMain" BOOLEAN NOT NULL DEFAULT false;
