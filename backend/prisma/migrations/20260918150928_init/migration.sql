-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "telefono" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTO',
    "intencion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "messageSid" TEXT,
    "direccion" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "intencion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'SENT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Case_telefono_idx" ON "Case"("telefono");

-- CreateIndex
CREATE INDEX "Case_estado_idx" ON "Case"("estado");

-- CreateIndex
CREATE INDEX "Case_tipo_idx" ON "Case"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "Message_messageSid_key" ON "Message"("messageSid");

-- CreateIndex
CREATE INDEX "Message_caseId_idx" ON "Message"("caseId");
