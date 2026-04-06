/*
  Warnings:

  - You are about to alter the column `name` on the `menus` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(50)`.
  - You are about to alter the column `email` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(100)`.
  - You are about to alter the column `fullname` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(100)`.

*/
-- AlterTable
ALTER TABLE "discount" ADD COLUMN     "description" TEXT,
ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "menus" ALTER COLUMN "name" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tables" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "taxes" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "fullname" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "updated_at" DROP NOT NULL;
