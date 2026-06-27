-- CreateTable
CREATE TABLE "Counter" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "clicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Counter_pkey" PRIMARY KEY ("id")
);
