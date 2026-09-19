// Describe los campos que Twilio envia en el webhook (form-encoded).
// Nombres en PascalCase porque asi los manda Twilio (From, Body, MessageSid).
export class TwilioWebhookDto {
  From: string; // remitente, formato "whatsapp:+50370000000"
  Body: string; // texto del mensaje
  MessageSid: string; // id unico del mensaje, clave para la idempotencia
}