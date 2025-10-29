/*
  Warnings:

  - A unique constraint covering the columns `[apartmentManagementNumber]` on the table `Apartment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[contact]` on the table `Resident` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Apartment_apartmentManagementNumber_key" ON "Apartment"("apartmentManagementNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Resident_contact_key" ON "Resident"("contact");
