-- CreateTable
CREATE TABLE "Booking" (
    "id" SERIAL NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "technology" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "location" TEXT,
    "costPerDay" DOUBLE PRECISION NOT NULL,
    "outlinePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);
