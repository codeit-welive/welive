/*
  Warnings:

  - You are about to drop the column `address` on the `Apartment` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Apartment` table. All the data in the column will be lost.
  - You are about to drop the column `officeNumber` on the `Apartment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[apartmentName]` on the table `Apartment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `apartmentAddress` to the `Apartment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `apartmentName` to the `Apartment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Apartment_name_key";

-- AlterTable
ALTER TABLE "Apartment" DROP COLUMN "address",
DROP COLUMN "name",
DROP COLUMN "officeNumber",
ADD COLUMN     "apartmentAddress" TEXT NOT NULL,
ADD COLUMN     "apartmentManagementNumber" TEXT,
ADD COLUMN     "apartmentName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "status" "PollStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "Apartment_apartmentName_key" ON "Apartment"("apartmentName");
