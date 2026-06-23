-- Add unique constraint on Conversation (remoteJid, instance) to prevent duplicate conversations per WhatsApp instance.
CREATE UNIQUE INDEX "Conversation_remoteJid_instance_key" ON "Conversation"("remoteJid", "instance");
