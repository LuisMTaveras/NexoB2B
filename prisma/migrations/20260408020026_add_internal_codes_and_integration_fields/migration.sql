/*
  Warnings:

  - A unique constraint covering the columns `[companyId,externalId]` on the table `AccountReceivable` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,internalCode]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[integrationId,resource]` on the table `IntegrationMapping` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,internalCode]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "internalCode" TEXT;

-- AlterTable
ALTER TABLE "Integration" ADD COLUMN     "headers" JSONB,
ADD COLUMN     "testEndpoint" TEXT;

-- AlterTable
ALTER TABLE "IntegrationMapping" ADD COLUMN     "paginationConfig" JSONB;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "internalCode" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "internalCode" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "internalCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AccountReceivable_companyId_externalId_key" ON "AccountReceivable"("companyId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_companyId_internalCode_key" ON "Customer"("companyId", "internalCode");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationMapping_integrationId_resource_key" ON "IntegrationMapping"("integrationId", "resource");

-- CreateIndex
CREATE UNIQUE INDEX "Product_companyId_internalCode_key" ON "Product"("companyId", "internalCode");
