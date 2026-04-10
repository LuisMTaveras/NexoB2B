-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('ORDER_ISSUE', 'BILLING', 'TECHNICAL', 'ACCOUNT', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'PENDING_APPROVAL';
ALTER TYPE "OrderStatus" ADD VALUE 'REJECTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TicketStatus" ADD VALUE 'WAITING_ON_CUSTOMER';
ALTER TYPE "TicketStatus" ADD VALUE 'ESCALATED';

-- AlterTable
ALTER TABLE "CustomerUser" ADD COLUMN     "orderLimit" DOUBLE PRECISION,
ADD COLUMN     "requiresApproval" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "rejectedReason" TEXT;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "category" "TicketCategory" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "relatedInvoiceId" TEXT,
ADD COLUMN     "relatedOrderId" TEXT;

-- AlterTable
ALTER TABLE "TicketMessage" ADD COLUMN     "isInternal" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "CustomerUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "InternalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
