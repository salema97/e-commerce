-- Add WhatsApp opt-out flag to User
ALTER TABLE "User" ADD COLUMN "whatsappOptOut" BOOLEAN NOT NULL DEFAULT false;
