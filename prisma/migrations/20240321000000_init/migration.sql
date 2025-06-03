-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('ACTIVE', 'SOLD');

-- CreateEnum
CREATE TYPE "OwnershipType" AS ENUM ('RENT', 'OWNERSHIP');

-- CreateTable
CREATE TABLE "properties" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'ACTIVE',
    "ownership_type" "OwnershipType" NOT NULL,
    "description" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "virtual_tour" TEXT,
    "video_url" TEXT,
    "size" TEXT NOT NULL,
    "beds" TEXT NOT NULL,
    "baths" TEXT NOT NULL,
    "layout" TEXT,
    "files" JSONB DEFAULT '[]',
    "price" DECIMAL(10,2) NOT NULL,
    "discounted_price" DECIMAL(10,2),
    "building_stories_number" TEXT,
    "building_condition" TEXT,
    "apartment_condition" TEXT,
    "above_ground_floors" TEXT,
    "reconstruction_year_apartment" TEXT,
    "reconstruction_year_building" TEXT,
    "total_above_ground_floors" TEXT,
    "total_underground_floors" TEXT,
    "floor_area" TEXT,
    "built_up_area" TEXT,
    "garden_house_area" TEXT,
    "terrace_area" TEXT,
    "total_land_area" TEXT,
    "garden_area" TEXT,
    "garage_area" TEXT,
    "balcony_area" TEXT,
    "pergola_area" TEXT,
    "basement_area" TEXT,
    "workshop_area" TEXT,
    "total_object_area" TEXT,
    "usable_area" TEXT,
    "land_area" TEXT,
    "object_type" TEXT,
    "object_location_type" TEXT,
    "house_equipment" TEXT,
    "access_road" TEXT,
    "object_condition" TEXT,
    "reservation_price" TEXT,
    "equipment_description" TEXT,
    "additional_sources" TEXT,
    "building_permit" TEXT,
    "buildability" TEXT,
    "utilities_on_land" TEXT,
    "utilities_on_adjacent_road" TEXT,
    "payments" TEXT,
    "broker_id" TEXT,
    "secondary_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_images" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "is_main" BOOLEAN NOT NULL DEFAULT false,
    "property_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_floorplans" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "property_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_floorplans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- Add initial categories with placeholder S3 URLs
INSERT INTO "categories" ("name", "slug", "image", "created_at", "updated_at") VALUES
    ('Flats', 'flats', 'https://realitypuchyr-estate-photos.s3.eu-central-1.amazonaws.com/categories/flats.jpg', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Houses', 'houses', 'https://realitypuchyr-estate-photos.s3.eu-central-1.amazonaws.com/categories/houses.jpg', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Cottages', 'cottages', 'https://realitypuchyr-estate-photos.s3.eu-central-1.amazonaws.com/categories/cottages.jpg', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Land', 'land', 'https://realitypuchyr-estate-photos.s3.eu-central-1.amazonaws.com/categories/land.jpg', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Projects', 'projects', 'https://realitypuchyr-estate-photos.s3.eu-central-1.amazonaws.com/categories/projects.jpg', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Villas', 'villas', 'https://realitypuchyr-estate-photos.s3.eu-central-1.amazonaws.com/categories/villas.jpg', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add category_id column to properties table
ALTER TABLE "properties" ADD COLUMN "category_id" INTEGER NOT NULL;

-- Add foreign key constraints
ALTER TABLE "properties" ADD CONSTRAINT "properties_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "property_images" ADD CONSTRAINT "property_images_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "property_floorplans" ADD CONSTRAINT "property_floorplans_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE; 