/*
  Warnings:

  - You are about to drop the column `residentStatus` on the `Resident` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Resident" DROP COLUMN "residentStatus",
ADD COLUMN     "residenceStatus" "ResidentStatus" NOT NULL DEFAULT 'RESIDENCE';
