import * as XLSX from 'xlsx';
import {
  ConvenioBillingCycle,
  ConvenioCompany,
  ConvenioDueAlert,
  MarmitexPaymentStatus,
  MarmitexPickup,
} from '../types';
import { RESTAURANT_INFO } from '../data/menuData';
import { formatCurrency } from './helpers';

export const DEFAULT_MARMITEX_UNIT_PRICE = 19.9;

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function maskCnpj(value: string): string {
  const d = onlyDigits(value).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  }
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

export function maskCpf(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

export function maskPhoneBR(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

export function isValidCpf(raw: string): boolean {
  const cpf = onlyDigits(raw);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(cpf[i]) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev >= 10) rev = 0;
  if (rev !== Number(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(cpf[i]) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev >= 10) rev = 0;
  return rev === Number(cpf[10]);
}

export function isValidCnpj(raw: string): boolean {
  const cnpj = onlyDigits(raw);
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const calcDigit = (sliceLen: number) => {
    const weights =
      sliceLen === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < sliceLen; i++) {
      sum += Number(cnpj[i]) * weights[i];
    }
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  return (
    calcDigit(12) === Number(cnpj[12]) && calcDigit(13) === Number(cnpj[13])
  );
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function toLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function toLocalDateTimeInputString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '—';
  const datePart = dateStr.slice(0, 10);
  const parts = datePart.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function formatDateTimeBR(dateTimeStr: string): string {
  if (!dateTimeStr) return '—';
  const datePart = formatDateBR(dateTimeStr.slice(0, 10));
  const timePart = dateTimeStr.length >= 16 ? dateTimeStr.slice(11, 16) : '';
  return timePart ? `${datePart} ${timePart}` : datePart;
}

export function computeInvoiceDueDate(
  pickupDateStr: string,
  billingCycle: ConvenioBillingCycle,
  dueDay: number
): string {
  const dateOnly = pickupDateStr.slice(0, 10);
  const [yStr, mStr, dStr] = dateOnly.split('-');
  const year = Number(yStr) || new Date().getFullYear();
  const monthIdx = (Number(mStr) || 1) - 1;
  const day = Number(dStr) || 1;
  const clampedDueDay = Math.min(28, Math.max(1, Math.round(dueDay || 10)));

  if (billingCycle === 'quinzenal') {
    if (day <= 15) {
      // Primeira quinzena vence no dia 20 do mesmo mês
      const d = new Date(year, monthIdx, Math.max(16, Math.min(28, clampedDueDay + 5)));
      return toLocalDateString(d);
    }
    // Segunda quinzena vence no dia configurado do mês seguinte
    const nextMonth = new Date(year, monthIdx + 1, clampedDueDay);
    return toLocalDateString(nextMonth);
  }

  // Mensal: se a retirada ocorrer até o dia do vencimento, cai no próximo mês para fechamento mensal justo
  const nextMonthDate = new Date(year, monthIdx + 1, clampedDueDay);
  return toLocalDateString(nextMonthDate);
}

export function computeDaysUntilDue(dueDateStr: string): number {
  const todayStr = toLocalDateString(new Date());
  const todayMs = new Date(`${todayStr}T00:00:00`).getTime();
  const dueMs = new Date(`${dueDateStr.slice(0, 10)}T00:00:00`).getTime();
  if (Number.isNaN(dueMs)) return 0;
  return Math.round((dueMs - todayMs) / (1000 * 60 * 60 * 24));
}

export function resolveEffectivePaymentStatus(
  pickup: Pick<MarmitexPickup, 'paymentStatus' | 'dueDate'>
): MarmitexPaymentStatus {
  if (pickup.paymentStatus === 'pago') return 'pago';
  const diff = computeDaysUntilDue(pickup.dueDate);
  if (diff < 0) return 'vencido';
  return 'pendente';
}

export function computeDueAlerts(
  companies: ConvenioCompany[],
  pickups: MarmitexPickup[]
): ConvenioDueAlert[] {
  const byCompanyDue = new Map<
    string,
    {
      company: ConvenioCompany;
      dueDate: string;
      daysRemaining: number;
      pendingQty: number;
      pendingAmount: number;
      pickupIds: string[];
    }
  >();

  for (const p of pickups) {
    const eff = resolveEffectivePaymentStatus(p);
    if (eff === 'pago') continue;

    const comp = companies.find((c) => c.id === p.companyId);
    if (!comp) continue;

    const daysRemaining = computeDaysUntilDue(p.dueDate);
    if (daysRemaining > 3) continue; // Alerta quando faltar até 3 dias, hoje ou vencido

    const mapKey = `${comp.id}::${p.dueDate}`;
    const existing = byCompanyDue.get(mapKey) || {
      company: comp,
      dueDate: p.dueDate,
      daysRemaining,
      pendingQty: 0,
      pendingAmount: 0,
      pickupIds: [],
    };
    existing.pendingQty += p.quantity;
    existing.pendingAmount += p.totalAmount;
    existing.pickupIds.push(p.id);
    byCompanyDue.set(mapKey, existing);
  }

  return Array.from(byCompanyDue.values())
    .map((item) => {
      let alertLevel: ConvenioDueAlert['alertLevel'] = 'em_3_dias';
      if (item.daysRemaining < 0) alertLevel = 'vencido';
      else if (item.daysRemaining === 0) alertLevel = 'hoje';
      else if (item.daysRemaining <= 2) alertLevel = 'em_2_dias';

      return {
        companyId: item.company.id,
        companyName: item.company.companyName,
        companyCnpj: item.company.cnpj,
        phone: item.company.phone,
        email: item.company.email,
        dueDate: item.dueDate,
        daysRemaining: item.daysRemaining,
        alertLevel,
        pendingQty: item.pendingQty,
        pendingAmount: Number(item.pendingAmount.toFixed(2)),
        pickupIds: item.pickupIds,
      };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export function buildInvoiceNotificationMessage(params: {
  companyName: string;
  cnpj: string;
  periodLabel: string;
  totalQty: number;
  totalAmount: number;
  dueDate: string;
}): string {
  return [
    `*${RESTAURANT_INFO.name} · Fatura Convênio Corporativo (Marmitex)*`,
    `Olá, equipe *${params.companyName}* (CNPJ: ${params.cnpj})!`,
    ``,
    `Segue o resumo do fechamento de retiradas de marmitex:`,
    `• *Período:* ${params.periodLabel}`,
    `• *Quantidade Total:* ${params.totalQty} marmitex`,
    `• *Valor Total da Fatura:* ${formatCurrency(params.totalAmount)}`,
    `• *Data de Vencimento:* ${formatDateBR(params.dueDate)}`,
    ``,
    `*Dados para Pagamento (Pix):*`,
    `• Chave Pix (Celular): ${RESTAURANT_INFO.pixKey}`,
    `• Favorecido: ${RESTAURANT_INFO.pixBeneficiary}`,
    ``,
    `Qualquer dúvida estamos à disposição pelo WhatsApp ${RESTAURANT_INFO.phone}. Obrigado pela parceria!`,
  ].join('\n');
}

export function exportConveniosCsv(
  pickups: MarmitexPickup[],
  filename = 'convenios-marmitex-relatorio.csv'
): void {
  const header = [
    'Data da Retirada',
    'Empresa Vinculada',
    'CNPJ',
    'Responsavel pela Retirada',
    'CPF do Responsavel',
    'Quantidade Diaria',
    'Valor Unitario (R$)',
    'Valor Total do Dia (R$)',
    'Vencimento da Fatura',
    'Status do Pagamento',
    'Observacao / Comprovante',
  ];

  const totalQty = pickups.reduce((acc, p) => acc + p.quantity, 0);
  const totalAmount = pickups.reduce((acc, p) => acc + p.totalAmount, 0);

  const statusLabel = (s: MarmitexPaymentStatus) =>
    s === 'pago' ? 'Pago' : s === 'vencido' ? 'Vencido' : 'Pendente';

  const rows = pickups.map((p) => {
    const effStatus = resolveEffectivePaymentStatus(p);
    return [
      formatDateTimeBR(p.pickupDateTime),
      p.companyName,
      p.companyCnpj,
      p.pickedUpByName,
      p.pickedUpByCpf,
      p.quantity,
      p.unitPrice.toFixed(2).replace('.', ','),
      p.totalAmount.toFixed(2).replace('.', ','),
      formatDateBR(p.dueDate),
      statusLabel(effStatus),
      p.receiptNote || '',
    ];
  });

  rows.push([
    'TOTAL GERAL DO PERÍODO',
    `${pickups.length} lançamento(s)`,
    '',
    '',
    '',
    totalQty,
    '',
    totalAmount.toFixed(2).replace('.', ','),
    '',
    '',
    '',
  ]);

  const escapeCsv = (val: string | number) => {
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const csv =
    '\uFEFF' +
    [header, ...rows].map((row) => row.map(escapeCsv).join(';')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportConveniosXlsx(
  pickups: MarmitexPickup[],
  filename = 'convenios-marmitex-relatorio.xlsx'
): void {
  const statusLabel = (s: MarmitexPaymentStatus) =>
    s === 'pago' ? 'Pago' : s === 'vencido' ? 'Vencido' : 'Pendente';

  const totalQty = pickups.reduce((acc, p) => acc + p.quantity, 0);
  const totalAmount = pickups.reduce((acc, p) => acc + p.totalAmount, 0);

  const aoa: (string | number)[][] = [
    [
      'Data da Retirada',
      'Empresa Vinculada',
      'CNPJ',
      'Responsável pela Retirada',
      'CPF do Responsável',
      'Quantidade Diária',
      'Valor Unitário (R$)',
      'Valor Total do Dia (R$)',
      'Data de Vencimento da Fatura',
      'Status do Pagamento',
      'Comprovante / Observação',
    ],
    ...pickups.map((p) => {
      const eff = resolveEffectivePaymentStatus(p);
      return [
        formatDateTimeBR(p.pickupDateTime),
        p.companyName,
        p.companyCnpj,
        p.pickedUpByName,
        p.pickedUpByCpf,
        p.quantity,
        Number(p.unitPrice.toFixed(2)),
        Number(p.totalAmount.toFixed(2)),
        formatDateBR(p.dueDate),
        statusLabel(eff),
        p.receiptNote || '',
      ];
    }),
    [
      'TOTAL DO PERÍODO',
      `${pickups.length} registro(s)`,
      '',
      '',
      '',
      totalQty,
      '',
      Number(totalAmount.toFixed(2)),
      '',
      '',
      '',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [
    { wch: 18 },
    { wch: 28 },
    { wch: 20 },
    { wch: 24 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 20 },
    { wch: 22 },
    { wch: 16 },
    { wch: 26 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Convenios Marmitex');
  XLSX.writeFile(wb, filename);
}
