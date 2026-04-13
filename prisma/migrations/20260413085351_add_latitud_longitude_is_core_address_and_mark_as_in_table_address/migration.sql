-- AlterTable
ALTER TABLE "address" ADD COLUMN     "is_core_address" BOOLEAN DEFAULT false,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "mark_as" TEXT;
