/**
 * Gera payload padrão BACEN EMV QRCPS (Pix Copia e Cola / QR Code Estático com valor)
 * com cálculo real de CRC16-CCITT (polinômio 0x1021).
 */

function formatTLV(id: string, value: string): string {
  const len = String(value.length).padStart(2, '0');
  return `${id}${len}${value}`;
}

function sanitizeAscii(text: string, maxLength: number): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
    .slice(0, maxLength);
}

function formatPixKeyForEmv(rawKey: string): string {
  const trimmed = rawKey.trim();
  // Chave celular brasileira (ex: 68999442700 -> +5568999442700)
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 11 && !trimmed.includes('@') && !trimmed.includes('-')) {
    return `+55${digits}`;
  }
  if (digits.length === 13 && digits.startsWith('55') && !trimmed.startsWith('+')) {
    return `+${digits}`;
  }
  return trimmed;
}

function computeCrc16Ccitt(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i += 1) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j += 1) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface PixPayloadParams {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  txid?: string;
}

export function generatePixCopiaECola({
  pixKey,
  merchantName,
  merchantCity,
  amount,
  txid = 'QUIOSKDAPRETA',
}: PixPayloadParams): string {
  const normalizedKey = formatPixKeyForEmv(pixKey);
  const cleanName = sanitizeAscii(merchantName, 25) || 'QUIOSK DA PRETA';
  const cleanCity = sanitizeAscii(merchantCity, 15) || 'RIO BRANCO';
  const cleanTxid =
    txid.replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***';

  const merchantAccountInfo = [
    formatTLV('00', 'br.gov.bcb.pix'),
    formatTLV('01', normalizedKey),
  ].join('');

  const additionalDataField = formatTLV('05', cleanTxid);

  const segments = [
    formatTLV('00', '01'), // Payload Format Indicator
    formatTLV('26', merchantAccountInfo), // Merchant Account Information (PIX)
    formatTLV('52', '0000'), // Merchant Category Code
    formatTLV('53', '986'), // Currency BRL (986)
  ];

  if (Number.isFinite(amount) && amount > 0) {
    segments.push(formatTLV('54', amount.toFixed(2)));
  }

  segments.push(
    formatTLV('58', 'BR'), // Country Code
    formatTLV('59', cleanName), // Merchant Name
    formatTLV('60', cleanCity), // Merchant City
    formatTLV('62', additionalDataField), // Additional Data (TXID)
    '6304' // CRC16 header
  );

  const partialPayload = segments.join('');
  const crc = computeCrc16Ccitt(partialPayload);
  return `${partialPayload}${crc}`;
}
