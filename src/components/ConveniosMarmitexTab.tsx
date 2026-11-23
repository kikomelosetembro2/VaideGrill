import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  ClipboardCheck,
  BarChart3,
  FileSpreadsheet,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  BellRing,
  MessageCircle,
  Mail,
  Copy,
  Check,
  Download,
  Lock,
  Settings,
  Power,
  X,
  Calendar,
  UserCheck,
  Utensils,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import {
  ConvenioBillingCycle,
  ConvenioCompany,
  ConvenioCompanyStatus,
  ConvenioDueAlert,
  ConveniosConfig,
  MarmitexPickup,
} from '../types';
import { RESTAURANT_INFO } from '../data/menuData';
import { formatCurrency, copyTextToClipboard } from '../utils/helpers';
import {
  DEFAULT_MARMITEX_UNIT_PRICE,
  buildInvoiceNotificationMessage,
  computeDueAlerts,
  computeInvoiceDueDate,
  exportConveniosCsv,
  exportConveniosXlsx,
  formatDateBR,
  formatDateTimeBR,
  isValidCnpj,
  isValidCpf,
  isValidEmail,
  maskCnpj,
  maskCpf,
  maskPhoneBR,
  onlyDigits,
  resolveEffectivePaymentStatus,
  toLocalDateString,
  toLocalDateTimeInputString,
} from '../utils/conveniosHelpers';

export type ConvenioSubTab = 'dashboard' | 'retirada' | 'empresas' | 'relatorios';

interface ConveniosMarmitexTabProps {
  config: ConveniosConfig;
  companies: ConvenioCompany[];
  pickups: MarmitexPickup[];
  dueAlerts: ConvenioDueAlert[];
  subTab: ConvenioSubTab;
  onChangeSubTab: (tab: ConvenioSubTab) => void;
  onReloadConvenios: () => Promise<void>;
}

interface NotifyModalTarget {
  companyName: string;
  cnpj: string;
  phone: string;
  email: string;
  periodLabel: string;
  totalQty: number;
  totalAmount: number;
  dueDate: string;
  message: string;
}

export const ConveniosMarmitexTab: React.FC<ConveniosMarmitexTabProps> = ({
  config,
  companies,
  pickups,
  dueAlerts,
  subTab,
  onChangeSubTab,
  onReloadConvenios,
}) => {
  const unitPrice = config.unitPrice || DEFAULT_MARMITEX_UNIT_PRICE;

  // Global feedback toast inside module
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  // Dashboard chart range: 15 or 30 days
  const [chartDaysRange, setChartDaysRange] = useState<15 | 30>(15);

  // Global unit price editor toggle
  const [isEditingGlobalPrice, setIsEditingGlobalPrice] = useState(false);
  const [globalPriceInput, setGlobalPriceInput] = useState(
    unitPrice.toFixed(2).replace('.', ',')
  );

  useEffect(() => {
    setGlobalPriceInput(unitPrice.toFixed(2).replace('.', ','));
  }, [unitPrice]);

  // ======================== 2. DAILY PICKUP LAUNCH STATE ========================
  const activeCompanies = useMemo(
    () => companies.filter((c) => c.status !== 'inativo'),
    [companies]
  );

  const [pickupCompanyId, setPickupCompanyId] = useState<string>(
    () => activeCompanies[0]?.id || ''
  );
  const selectedPickupCompany = useMemo(
    () => companies.find((c) => c.id === pickupCompanyId) || activeCompanies[0] || null,
    [companies, pickupCompanyId, activeCompanies]
  );

  const [pickedUpByName, setPickedUpByName] = useState<string>(
    () => selectedPickupCompany?.authorizedPersonName || ''
  );
  const [pickedUpByCpf, setPickedUpByCpf] = useState<string>(
    () => selectedPickupCompany?.authorizedPersonCpf || ''
  );
  const [pickupDateTime, setPickupDateTime] = useState<string>(() =>
    toLocalDateTimeInputString()
  );
  const [pickupQty, setPickupQty] = useState<number>(10);
  const [pickupNote, setPickupNote] = useState<string>('');
  const [pickupSubmitting, setPickupSubmitting] = useState(false);

  useEffect(() => {
    if (activeCompanies.length === 0) return;
    const stillValid = activeCompanies.some((c) => c.id === pickupCompanyId);
    if (!pickupCompanyId || !stillValid) {
      const first = activeCompanies[0];
      setPickupCompanyId(first.id);
      setPickedUpByName(first.authorizedPersonName);
      setPickedUpByCpf(first.authorizedPersonCpf);
    }
  }, [activeCompanies, pickupCompanyId]);

  const handleSelectPickupCompany = (compId: string) => {
    setPickupCompanyId(compId);
    const found = companies.find((c) => c.id === compId);
    if (found) {
      setPickedUpByName(found.authorizedPersonName);
      setPickedUpByCpf(found.authorizedPersonCpf);
    }
  };

  // ======================== 1. COMPANY CRUD FORM STATE ========================
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [compName, setCompName] = useState('');
  const [compCnpj, setCompCnpj] = useState('');
  const [compAddress, setCompAddress] = useState('');
  const [compPhone, setCompPhone] = useState('');
  const [compEmail, setCompEmail] = useState('');
  const [compStartDate, setCompStartDate] = useState(() => toLocalDateString());
  const [compBillingCycle, setCompBillingCycle] =
    useState<ConvenioBillingCycle>('mensal');
  const [compDueDay, setCompDueDay] = useState<number>(10);
  const [compAuthName, setCompAuthName] = useState('');
  const [compAuthCpf, setCompAuthCpf] = useState('');
  const [compStatus, setCompStatus] = useState<ConvenioCompanyStatus>('ativo');
  const [compSaving, setCompSaving] = useState(false);

  // ======================== 4. REPORTS & FILTERS STATE ========================
  const [reportCompanyId, setReportCompanyId] = useState<string>('todas');
  const [reportPeriod, setReportPeriod] = useState<
    'diario' | 'semanal' | 'quinzenal' | 'mensal' | 'personalizado'
  >('mensal');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return toLocalDateString(d);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => toLocalDateString());

  // ======================== 5. NOTIFICATION DISPATCH MODAL ========================
  const [notifyTarget, setNotifyTarget] = useState<NotifyModalTarget | null>(null);
  const [notifyCopied, setNotifyCopied] = useState(false);

  // ======================== DASHBOARD METRICS & CHARTS ========================
  const currentMonthPrefix = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const kpis = useMemo(() => {
    let monthMarmitexQty = 0;
    let monthRevenue = 0;
    let totalReceivable = 0;
    let overdueAmount = 0;
    let overdueRecords = 0;

    for (const p of pickups) {
      const eff = resolveEffectivePaymentStatus(p);
      if (p.pickupDateTime.startsWith(currentMonthPrefix)) {
        monthMarmitexQty += p.quantity;
        monthRevenue += p.totalAmount;
      }
      if (eff !== 'pago') {
        totalReceivable += p.totalAmount;
        if (eff === 'vencido') {
          overdueAmount += p.totalAmount;
          overdueRecords += 1;
        }
      }
    }

    return {
      monthMarmitexQty,
      monthRevenue: Number(monthRevenue.toFixed(2)),
      totalReceivable: Number(totalReceivable.toFixed(2)),
      overdueAmount: Number(overdueAmount.toFixed(2)),
      overdueRecords,
    };
  }, [pickups, currentMonthPrefix]);

  const dailyConsumptionChart = useMemo(() => {
    const days: { dateKey: string; label: string; quantidade: number; valor: number }[] = [];
    const today = new Date();
    const map = new Map<string, { qty: number; val: number }>();

    for (const p of pickups) {
      const dk = p.pickupDateTime.slice(0, 10);
      const prev = map.get(dk) || { qty: 0, val: 0 };
      map.set(dk, { qty: prev.qty + p.quantity, val: prev.val + p.totalAmount });
    }

    for (let offset = chartDaysRange - 1; offset >= 0; offset--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
      const key = toLocalDateString(d);
      const label = `${String(d.getDate()).padStart(2, '0')}/${String(
        d.getMonth() + 1
      ).padStart(2, '0')}`;
      const agg = map.get(key) || { qty: 0, val: 0 };
      days.push({
        dateKey: key,
        label,
        quantidade: agg.qty,
        valor: Number(agg.val.toFixed(2)),
      });
    }
    return days;
  }, [pickups, chartDaysRange]);

  const monthlyCompanyRanking = useMemo(() => {
    const map = new Map<
      string,
      { companyId: string; name: string; shortName: string; quantidade: number; valor: number }
    >();

    for (const p of pickups) {
      if (!p.pickupDateTime.startsWith(currentMonthPrefix)) continue;
      const existing = map.get(p.companyId) || {
        companyId: p.companyId,
        name: p.companyName,
        shortName:
          p.companyName.length > 18
            ? `${p.companyName.slice(0, 17).trim()}…`
            : p.companyName,
        quantidade: 0,
        valor: 0,
      };
      existing.quantidade += p.quantity;
      existing.valor = Number((existing.valor + p.totalAmount).toFixed(2));
      map.set(p.companyId, existing);
    }

    return Array.from(map.values()).sort((a, b) => b.quantidade - a.quantidade);
  }, [pickups, currentMonthPrefix]);

  // ======================== REPORTS FILTERED DATA ========================
  const reportDateRange = useMemo(() => {
    const now = new Date();
    const endStr = toLocalDateString(now);

    if (reportPeriod === 'diario') {
      return { start: endStr, end: endStr, label: `Hoje (${formatDateBR(endStr)})` };
    }
    if (reportPeriod === 'semanal') {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      const start = toLocalDateString(s);
      return { start, end: endStr, label: `${formatDateBR(start)} a ${formatDateBR(endStr)}` };
    }
    if (reportPeriod === 'quinzenal') {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
      const start = toLocalDateString(s);
      return { start, end: endStr, label: `${formatDateBR(start)} a ${formatDateBR(endStr)}` };
    }
    if (reportPeriod === 'mensal') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      const start = toLocalDateString(s);
      return { start, end: endStr, label: `${formatDateBR(start)} a ${formatDateBR(endStr)}` };
    }
    return {
      start: customStartDate,
      end: customEndDate,
      label: `${formatDateBR(customStartDate)} a ${formatDateBR(customEndDate)}`,
    };
  }, [reportPeriod, customStartDate, customEndDate]);

  const filteredReportPickups = useMemo(() => {
    return pickups.filter((p) => {
      if (reportCompanyId !== 'todas' && p.companyId !== reportCompanyId) {
        return false;
      }
      const d = p.pickupDateTime.slice(0, 10);
      if (reportDateRange.start && d < reportDateRange.start) return false;
      if (reportDateRange.end && d > reportDateRange.end) return false;
      return true;
    });
  }, [pickups, reportCompanyId, reportDateRange]);

  const reportTotals = useMemo(() => {
    return filteredReportPickups.reduce(
      (acc, p) => ({
        qty: acc.qty + p.quantity,
        amount: Number((acc.amount + p.totalAmount).toFixed(2)),
      }),
      { qty: 0, amount: 0 }
    );
  }, [filteredReportPickups]);

  // ======================== HANDLERS ========================
  const handleSaveGlobalPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const parsed = Number(globalPriceInput.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setFeedback({ type: 'err', text: 'Informe um valor unitário válido acima de R$ 0,00.' });
      return;
    }
    try {
      const res = await fetch('/api/convenios/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitPrice: parsed }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar preço global.');
      await onReloadConvenios();
      setIsEditingGlobalPrice(false);
      setFeedback({
        type: 'ok',
        text: `Valor unitário global atualizado para ${formatCurrency(parsed)}.`,
      });
    } catch {
      setFeedback({ type: 'err', text: 'Erro ao salvar valor unitário global.' });
    }
  };

  const handleSubmitPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const comp = selectedPickupCompany;
    if (!comp) {
      setFeedback({
        type: 'err',
        text: 'Cadastre ou selecione uma empresa conveniada ativa primeiro.',
      });
      return;
    }
    if (!pickedUpByName.trim()) {
      setFeedback({ type: 'err', text: 'Informe o nome completo de quem está retirando.' });
      return;
    }
    if (!isValidCpf(pickedUpByCpf)) {
      setFeedback({
        type: 'err',
        text: 'CPF do responsável pela retirada inválido. Confira os 11 dígitos.',
      });
      return;
    }
    if (!Number.isInteger(pickupQty) || pickupQty < 1) {
      setFeedback({ type: 'err', text: 'A quantidade diária deve ser um número inteiro positivo.' });
      return;
    }

    setPickupSubmitting(true);
    try {
      const computedDue = computeInvoiceDueDate(
        pickupDateTime,
        comp.billingCycle,
        comp.dueDay
      );
      const res = await fetch('/api/convenios/pickups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: comp.id,
          pickedUpByName: pickedUpByName.trim(),
          pickedUpByCpf: pickedUpByCpf.trim(),
          pickupDateTime,
          quantity: pickupQty,
          dueDate: computedDue,
          receiptNote: pickupNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao registrar retirada.');
      }
      await onReloadConvenios();
      setPickupNote('');
      setPickupDateTime(toLocalDateTimeInputString());
      setFeedback({
        type: 'ok',
        text: `Retirada registrada: ${pickupQty} marmitex para ${comp.companyName} (${formatCurrency(
          pickupQty * unitPrice
        )}).`,
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Não foi possível registrar a retirada.',
      });
    } finally {
      setPickupSubmitting(false);
    }
  };

  const openCreateCompany = () => {
    setEditingCompanyId(null);
    setCompName('');
    setCompCnpj('');
    setCompAddress('');
    setCompPhone('');
    setCompEmail('');
    setCompStartDate(toLocalDateString());
    setCompBillingCycle('mensal');
    setCompDueDay(10);
    setCompAuthName('');
    setCompAuthCpf('');
    setCompStatus('ativo');
    setShowCompanyForm(true);
    setFeedback(null);
  };

  const openEditCompany = (c: ConvenioCompany) => {
    setEditingCompanyId(c.id);
    setCompName(c.companyName);
    setCompCnpj(c.cnpj);
    setCompAddress(c.address);
    setCompPhone(c.phone);
    setCompEmail(c.email);
    setCompStartDate(c.contractStartDate);
    setCompBillingCycle(c.billingCycle);
    setCompDueDay(c.dueDay);
    setCompAuthName(c.authorizedPersonName);
    setCompAuthCpf(c.authorizedPersonCpf);
    setCompStatus(c.status);
    setShowCompanyForm(true);
    setFeedback(null);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (compName.trim().length < 3) {
      setFeedback({ type: 'err', text: 'Informe a Razão Social / Nome da Empresa.' });
      return;
    }
    if (!isValidCnpj(compCnpj)) {
      setFeedback({ type: 'err', text: 'CNPJ inválido. Verifique os dígitos informados.' });
      return;
    }
    if (compAddress.trim().length < 5) {
      setFeedback({ type: 'err', text: 'Informe o endereço completo da empresa.' });
      return;
    }
    if (onlyDigits(compPhone).length < 10) {
      setFeedback({ type: 'err', text: 'Informe um telefone / WhatsApp válido com DDD.' });
      return;
    }
    if (!isValidEmail(compEmail)) {
      setFeedback({ type: 'err', text: 'Informe um endereço de e-mail válido.' });
      return;
    }
    if (compAuthName.trim().length < 3) {
      setFeedback({ type: 'err', text: 'Informe o nome completo do responsável pela retirada.' });
      return;
    }
    if (!isValidCpf(compAuthCpf)) {
      setFeedback({ type: 'err', text: 'CPF do responsável inválido. Verifique os dígitos.' });
      return;
    }

    setCompSaving(true);
    try {
      const payload = {
        companyName: compName.trim(),
        cnpj: compCnpj.trim(),
        address: compAddress.trim(),
        phone: compPhone.trim(),
        email: compEmail.trim(),
        contractStartDate: compStartDate,
        billingCycle: compBillingCycle,
        dueDay: compDueDay,
        authorizedPersonName: compAuthName.trim(),
        authorizedPersonCpf: compAuthCpf.trim(),
        status: compStatus,
      };

      const url = editingCompanyId
        ? `/api/convenios/companies/${encodeURIComponent(editingCompanyId)}`
        : '/api/convenios/companies';
      const method = editingCompanyId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar empresa.');
      }
      await onReloadConvenios();
      setShowCompanyForm(false);
      setEditingCompanyId(null);
      setFeedback({
        type: 'ok',
        text: editingCompanyId
          ? 'Dados da empresa conveniada atualizados.'
          : 'Empresa conveniada cadastrada com sucesso!',
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Erro ao salvar empresa.',
      });
    } finally {
      setCompSaving(false);
    }
  };

  const handleToggleCompanyStatus = async (comp: ConvenioCompany) => {
    const nextStatus: ConvenioCompanyStatus =
      comp.status === 'inativo' ? 'ativo' : 'inativo';
    try {
      const res = await fetch(`/api/convenios/companies/${encodeURIComponent(comp.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        await onReloadConvenios();
        setFeedback({
          type: 'ok',
          text: `${comp.companyName} marcada como ${
            nextStatus === 'ativo' ? 'Ativa' : 'Inativa'
          }.`,
        });
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteCompany = async (comp: ConvenioCompany) => {
    try {
      const res = await fetch(
        `/api/convenios/companies/${encodeURIComponent(comp.id)}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        await onReloadConvenios();
        setFeedback({ type: 'ok', text: `Convênio "${comp.companyName}" excluído.` });
      }
    } catch {
      // ignore
    }
  };

  const handleMarkAlertPaid = async (alert: ConvenioDueAlert) => {
    try {
      const res = await fetch(
        `/api/convenios/companies/${encodeURIComponent(alert.companyId)}/mark-paid`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pickupIds: alert.pickupIds }),
        }
      );
      if (res.ok) {
        await onReloadConvenios();
        setFeedback({
          type: 'ok',
          text: `Fatura de ${alert.companyName} (${formatCurrency(
            alert.pendingAmount
          )}) marcada como PAGA!`,
        });
      }
    } catch {
      setFeedback({ type: 'err', text: 'Erro ao quitar fatura.' });
    }
  };

  const handleTogglePickupPaid = async (pickup: MarmitexPickup) => {
    const isCurrentlyPaid = resolveEffectivePaymentStatus(pickup) === 'pago';
    try {
      const res = await fetch(
        `/api/convenios/pickups/${encodeURIComponent(pickup.id)}/pay`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paid: !isCurrentlyPaid }),
        }
      );
      if (res.ok) {
        await onReloadConvenios();
      }
    } catch {
      // ignore
    }
  };

  const handleDeletePickup = async (id: string) => {
    try {
      const res = await fetch(`/api/convenios/pickups/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await onReloadConvenios();
        setFeedback({ type: 'ok', text: 'Lançamento de retirada removido.' });
      }
    } catch {
      // ignore
    }
  };

  const openNotifyForAlert = (alert: ConvenioDueAlert) => {
    const message = buildInvoiceNotificationMessage({
      companyName: alert.companyName,
      cnpj: alert.companyCnpj,
      periodLabel: `Vencimento ${formatDateBR(alert.dueDate)}`,
      totalQty: alert.pendingQty,
      totalAmount: alert.pendingAmount,
      dueDate: alert.dueDate,
    });
    setNotifyCopied(false);
    setNotifyTarget({
      companyName: alert.companyName,
      cnpj: alert.companyCnpj,
      phone: alert.phone,
      email: alert.email,
      periodLabel: `Fatura venc. ${formatDateBR(alert.dueDate)}`,
      totalQty: alert.pendingQty,
      totalAmount: alert.pendingAmount,
      dueDate: alert.dueDate,
      message,
    });
  };

  const openNotifyFromReport = () => {
    const targetCompany =
      reportCompanyId !== 'todas'
        ? companies.find((c) => c.id === reportCompanyId)
        : companies.find((c) => c.id === filteredReportPickups[0]?.companyId);

    const openItems = filteredReportPickups.filter(
      (p) => resolveEffectivePaymentStatus(p) !== 'pago'
    );
    const itemsToSum = openItems.length > 0 ? openItems : filteredReportPickups;

    if (!targetCompany || itemsToSum.length === 0) {
      setFeedback({
        type: 'err',
        text: 'Selecione uma empresa específica com lançamentos no período para enviar a notificação.',
      });
      return;
    }

    const qty = itemsToSum.reduce((acc, p) => acc + p.quantity, 0);
    const amt = itemsToSum.reduce((acc, p) => acc + p.totalAmount, 0);
    const dueDate = itemsToSum[0].dueDate;

    const message = buildInvoiceNotificationMessage({
      companyName: targetCompany.companyName,
      cnpj: targetCompany.cnpj,
      periodLabel: reportDateRange.label,
      totalQty: qty,
      totalAmount: amt,
      dueDate,
    });

    setNotifyCopied(false);
    setNotifyTarget({
      companyName: targetCompany.companyName,
      cnpj: targetCompany.cnpj,
      phone: targetCompany.phone,
      email: targetCompany.email,
      periodLabel: reportDateRange.label,
      totalQty: qty,
      totalAmount: amt,
      dueDate,
      message,
    });
  };

  const statusBadgeForCompany = (status: ConvenioCompanyStatus) => {
    if (status === 'ativo') {
      return (
        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-extrabold">
          Ativo
        </span>
      );
    }
    if (status === 'fatura_atraso') {
      return (
        <span className="px-2 py-0.5 rounded bg-red-100 text-[#8A0000] border border-[#8A0000] text-[11px] font-extrabold">
          Fatura em Atraso
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded bg-neutral-200 text-neutral-700 border border-neutral-300 text-[11px] font-extrabold">
        Inativo
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Module Header + Sub-tabs */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-lg text-[#111111]">
              Convênios Corporativos (Marmitex) · Vendas a Prazo
            </h3>
            <span className="px-2.5 py-0.5 rounded bg-[#111111] text-[#D4A017] text-[11px] font-extrabold tabular-nums">
              Valor Fixo: {formatCurrency(unitPrice)} / un.
            </span>
          </div>
          <p className="text-xs text-neutral-600 mt-0.5">
            Gestão de contratos empresariais, retiradas diárias no balcão, faturamento a prazo e alertas de vencimento.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            {
              id: 'dashboard' as ConvenioSubTab,
              label: `Dashboard & Alertas${dueAlerts.length > 0 ? ` (${dueAlerts.length})` : ''}`,
              icon: BarChart3,
            },
            {
              id: 'retirada' as ConvenioSubTab,
              label: 'Lançar Retirada Diária',
              icon: ClipboardCheck,
            },
            {
              id: 'empresas' as ConvenioSubTab,
              label: `Empresas (${companies.length})`,
              icon: Building2,
            },
            {
              id: 'relatorios' as ConvenioSubTab,
              label: 'Relatórios & Planilhas',
              icon: FileSpreadsheet,
            },
          ].map((st) => {
            const Icon = st.icon;
            const active = subTab === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => onChangeSubTab(st.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#111111] text-[#D4A017] border-[#111111]'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:border-[#111111]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
              : 'bg-red-50 border-[#8A0000] text-[#8A0000]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ======================== SUB-TAB 1: DASHBOARD & ALERTAS ======================== */}
      {subTab === 'dashboard' && (
        <div className="space-y-6">
          {/* 4 KPI Cards (Mês Atual) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500">
                Marmitex Entregues (Mês Atual)
              </p>
              <p className="text-2xl font-black text-[#111111] mt-1 tabular-nums">
                {kpis.monthMarmitexQty} un.
              </p>
              <p className="text-[11px] text-neutral-600 mt-0.5">
                {activeCompanies.length} empresa(s) ativa(s) no convênio
              </p>
            </div>

            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500">
                Faturamento Acumulado (Mês)
              </p>
              <p className="text-2xl font-black text-[#111111] mt-1 tabular-nums">
                {formatCurrency(kpis.monthRevenue)}
              </p>
              <p className="text-[11px] text-neutral-600 mt-0.5 tabular-nums">
                Base unitária: {formatCurrency(unitPrice)}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[#D4A017] bg-amber-50/70">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-700">
                Total a Receber (Em Aberto)
              </p>
              <p className="text-2xl font-black text-[#111111] mt-1 tabular-nums">
                {formatCurrency(kpis.totalReceivable)}
              </p>
              <p className="text-[11px] text-neutral-700 font-semibold mt-0.5">
                Faturas pendentes e a vencer
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border-2 ${
                kpis.overdueAmount > 0
                  ? 'border-[#8A0000] bg-red-50'
                  : 'border-neutral-200 bg-neutral-50'
              }`}
            >
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#8A0000]">
                Faturas Vencidas / Em Atraso
              </p>
              <p className="text-2xl font-black text-[#8A0000] mt-1 tabular-nums">
                {formatCurrency(kpis.overdueAmount)}
              </p>
              <p className="text-[11px] font-bold text-[#8A0000] mt-0.5 tabular-nums">
                {kpis.overdueRecords} lançamento(s) em atraso
              </p>
            </div>
          </div>

          {/* Painel de Alertas de Vencimento */}
          <div className="border border-neutral-200 rounded-xl p-4 sm:p-5 bg-white space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-[#8A0000]" />
                <div>
                  <h4 className="font-black text-sm text-[#111111]">
                    Painel de Alertas de Vencimento de Faturas
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Empresas com vencimento próximo (até 3 dias), vencendo hoje ou em atraso.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onChangeSubTab('retirada')}
                className="bg-[#8A0000] hover:bg-[#6E0000] text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#D4A017]" />
                <span>Lançar Retirada Hoje</span>
              </button>
            </div>

            {dueAlerts.length === 0 ? (
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  Nenhuma fatura vencida ou com vencimento nos próximos 3 dias no momento.
                </span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {dueAlerts.map((al) => {
                  const badge =
                    al.alertLevel === 'vencido'
                      ? {
                          cls: 'bg-[#8A0000] text-white',
                          txt: `Em atraso há ${Math.abs(al.daysRemaining)} dia(s)`,
                        }
                      : al.alertLevel === 'hoje'
                      ? {
                          cls: 'bg-[#D4A017] text-[#111111]',
                          txt: 'Vence Hoje!',
                        }
                      : {
                          cls: 'bg-[#111111] text-[#D4A017]',
                          txt: `Vence em ${al.daysRemaining} dia(s)`,
                        };

                  return (
                    <div
                      key={`${al.companyId}_${al.dueDate}`}
                      className={`p-3.5 rounded-xl border flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
                        al.alertLevel === 'vencido'
                          ? 'bg-red-50/80 border-[#8A0000]'
                          : al.alertLevel === 'hoje'
                          ? 'bg-amber-50 border-[#D4A017]'
                          : 'bg-neutral-50 border-neutral-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${badge.cls}`}
                          >
                            {badge.txt}
                          </span>
                          <span className="font-extrabold text-sm text-[#111111]">
                            {al.companyName}
                          </span>
                          <span className="text-[11px] text-neutral-500 tabular-nums">
                            CNPJ: {al.companyCnpj}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-700 font-semibold tabular-nums">
                          Vencimento: <strong>{formatDateBR(al.dueDate)}</strong> ·{' '}
                          {al.pendingQty} marmitex em aberto · Total:{' '}
                          <strong className="text-[#8A0000]">
                            {formatCurrency(al.pendingAmount)}
                          </strong>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => openNotifyForAlert(al)}
                          className="px-3 py-2 rounded-lg border border-[#111111] bg-white hover:bg-neutral-100 text-[#111111] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-[#8A0000]" />
                          <span>Enviar Cobrança</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMarkAlertPaid(al)}
                          className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Marcar como Pago</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2 Gráficos Recharts: Consumo Diário (15/30 dias) + Ranking Empresas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Consumo Diário de Marmitex */}
            <div className="border border-neutral-200 rounded-xl p-4 sm:p-5 bg-white space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-black text-sm text-[#111111]">
                    Consumo Diário de Marmitex
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Unidades retiradas nos últimos {chartDaysRange} dias
                  </p>
                </div>
                <div className="inline-flex rounded-lg border border-neutral-300 bg-neutral-50 p-0.5">
                  {[15, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setChartDaysRange(d as 15 | 30)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                        chartDaysRange === d
                          ? 'bg-[#8A0000] text-white'
                          : 'text-neutral-700'
                      }`}
                    >
                      {d} dias
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full h-[270px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dailyConsumptionChart}
                    margin={{ top: 8, right: 8, left: -12, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#111111' }}
                      tickLine={false}
                      axisLine={{ stroke: '#D4D4D8' }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fontWeight: 600, fill: '#52525B' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#D4D4D8',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                      formatter={(val, name) =>
                        name === 'quantidade'
                          ? [`${val ?? 0} marmitex`, 'Quantidade']
                          : [formatCurrency(Number(val ?? 0)), 'Valor']
                      }
                    />
                    <Bar
                      dataKey="quantidade"
                      name="quantidade"
                      fill="#8A0000"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={22}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ranking das Empresas que Mais Consomem no Mês */}
            <div className="border border-neutral-200 rounded-xl p-4 sm:p-5 bg-white space-y-4">
              <div>
                <h4 className="font-black text-sm text-[#111111]">
                  Ranking das Empresas · Mês Atual
                </h4>
                <p className="text-[11px] text-neutral-500">
                  Comparativo de volume de marmitex consumidas por parceiro
                </p>
              </div>

              {monthlyCompanyRanking.length === 0 ? (
                <div className="h-[270px] flex items-center justify-center text-xs text-neutral-500 bg-neutral-50 rounded-lg border border-neutral-200">
                  Nenhum consumo registrado no mês atual.
                </div>
              ) : (
                <div className="w-full h-[270px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyCompanyRanking}
                      layout="vertical"
                      margin={{ top: 4, right: 20, left: 10, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10, fontWeight: 600, fill: '#52525B' }}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="shortName"
                        width={130}
                        tick={{ fontSize: 11, fontWeight: 700, fill: '#111111' }}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#D4D4D8',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                        formatter={(val) => [`${val ?? 0} marmitex`, 'Consumo no Mês']}
                      />
                      <Bar dataKey="quantidade" radius={[0, 6, 6, 0]} maxBarSize={28}>
                        {monthlyCompanyRanking.map((_, idx) => (
                          <Cell
                            key={idx}
                            fill={idx === 0 ? '#8A0000' : idx === 1 ? '#D4A017' : '#111111'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================== SUB-TAB 2: LANÇAMENTO DIÁRIO DE RETIRADA ======================== */}
      {subTab === 'retirada' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Quick Operational Form */}
          <form
            onSubmit={handleSubmitPickup}
            className="lg:col-span-5 border border-neutral-200 rounded-xl p-5 bg-neutral-50 space-y-4 h-fit"
          >
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-[#8A0000]" />
                <div>
                  <h4 className="font-black text-sm text-[#111111]">
                    Registro Rápido de Retirada Diária
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Lançamento ágil no balcão / cozinha
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setGlobalPriceInput(unitPrice.toFixed(2).replace('.', ','));
                  setIsEditingGlobalPrice((prev) => !prev);
                }}
                className="p-1.5 rounded-lg border border-neutral-300 bg-white text-neutral-600 hover:text-[#111111] cursor-pointer"
                title="Alterar preço unitário global do convênio"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {isEditingGlobalPrice && (
              <div className="p-3 rounded-lg bg-amber-50 border border-[#D4A017] space-y-2">
                <p className="text-[11px] font-extrabold text-[#111111]">
                  Variável Global · Valor Unitário da Marmitex (R$)
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={globalPriceInput}
                    onChange={(e) => setGlobalPriceInput(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-neutral-300 rounded text-xs font-bold tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={handleSaveGlobalPrice}
                    className="px-3 py-1.5 bg-[#111111] text-[#D4A017] rounded text-xs font-bold cursor-pointer"
                  >
                    Salvar Valor
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">
                Empresa Conveniada (Ativas) *
              </label>
              {activeCompanies.length === 0 ? (
                <div className="p-3 rounded-lg bg-white border border-[#8A0000] text-xs text-[#8A0000] font-bold">
                  Nenhuma empresa ativa cadastrada. Cadastre na aba "Empresas".
                </div>
              ) : (
                <select
                  value={selectedPickupCompany?.id || ''}
                  onChange={(e) => handleSelectPickupCompany(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-neutral-300 rounded-lg text-xs font-bold text-[#111111]"
                >
                  {activeCompanies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} ({c.cnpj})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Responsável pela Retirada *
                </label>
                <input
                  type="text"
                  required
                  value={pickedUpByName}
                  onChange={(e) => setPickedUpByName(e.target.value)}
                  placeholder="Nome do colaborador"
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs text-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  CPF do Responsável *
                </label>
                <input
                  type="text"
                  required
                  value={pickedUpByCpf}
                  onChange={(e) => setPickedUpByCpf(maskCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs text-[#111111] tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Data e Hora da Retirada *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={pickupDateTime}
                  onChange={(e) => setPickupDateTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs text-[#111111] tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Quantidade Diária *
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPickupQty((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-lg border border-neutral-300 bg-white font-black text-sm hover:border-[#111111] cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={pickupQty}
                    onChange={(e) =>
                      setPickupQty(Math.max(1, Math.round(Number(e.target.value) || 1)))
                    }
                    className="flex-1 text-center py-2 bg-white border border-neutral-300 rounded-lg text-sm font-black text-[#111111] tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={() => setPickupQty((q) => q + 1)}
                    className="w-9 h-9 rounded-lg border border-neutral-300 bg-white font-black text-sm hover:border-[#111111] cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-white border border-neutral-300">
              <div>
                <p className="text-[11px] font-bold text-neutral-500 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#D4A017]" />
                  <span>Valor Unitário Fixo</span>
                </p>
                <p className="text-base font-black text-[#111111] tabular-nums mt-0.5">
                  {formatCurrency(unitPrice)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold text-neutral-500">
                  Subtotal Automático
                </p>
                <p className="text-lg font-black text-[#8A0000] tabular-nums mt-0.5">
                  {formatCurrency(pickupQty * unitPrice)}
                </p>
              </div>
              {selectedPickupCompany && (
                <div className="col-span-2 pt-2 border-t border-neutral-200 text-[11px] text-neutral-600 flex items-center justify-between">
                  <span>Previsão de Vencimento da Fatura:</span>
                  <strong className="text-[#111111] tabular-nums">
                    {formatDateBR(
                      computeInvoiceDueDate(
                        pickupDateTime,
                        selectedPickupCompany.billingCycle,
                        selectedPickupCompany.dueDay
                      )
                    )}
                  </strong>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">
                Comprovante / Assinatura Digital / Observação (Opcional)
              </label>
              <input
                type="text"
                value={pickupNote}
                onChange={(e) => setPickupNote(e.target.value)}
                placeholder="Ex: Cód. 402 · Assinado por Marcos no balcão"
                className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs text-[#111111]"
              />
            </div>

            <button
              type="submit"
              disabled={pickupSubmitting || activeCompanies.length === 0}
              className="w-full bg-[#8A0000] hover:bg-[#6E0000] disabled:opacity-60 text-white font-extrabold py-3 px-4 rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4 text-[#D4A017]" />
              <span>
                {pickupSubmitting
                  ? 'Registrando...'
                  : `Confirmar Retirada (${pickupQty} un. · ${formatCurrency(
                      pickupQty * unitPrice
                    )})`}
              </span>
            </button>
          </form>

          {/* Recent Pickups Feed */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-sm text-[#111111]">
                Últimos Lançamentos de Retirada ({pickups.length})
              </h4>
              <button
                type="button"
                onClick={() => onChangeSubTab('relatorios')}
                className="text-xs font-bold text-[#8A0000] hover:underline cursor-pointer"
              >
                Ver Relatório Completo &rarr;
              </button>
            </div>

            <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-200 max-h-[540px] overflow-y-auto bg-white">
              {pickups.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500">
                  Nenhuma retirada diária registrada ainda.
                </div>
              ) : (
                pickups.map((p) => {
                  const eff = resolveEffectivePaymentStatus(p);
                  return (
                    <div
                      key={p.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-black text-[#111111]">
                            {p.companyName}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              eff === 'pago'
                                ? 'bg-emerald-100 text-emerald-800'
                                : eff === 'vencido'
                                ? 'bg-red-100 text-[#8A0000]'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {eff === 'pago' ? 'Pago' : eff === 'vencido' ? 'Vencido' : 'Pendente'}
                          </span>
                        </div>
                        <p className="text-neutral-600">
                          Retirado em{' '}
                          <strong className="tabular-nums">
                            {formatDateTimeBR(p.pickupDateTime)}
                          </strong>{' '}
                          por <strong>{p.pickedUpByName}</strong> (CPF {p.pickedUpByCpf})
                        </p>
                        <p className="text-neutral-500 text-[11px] tabular-nums">
                          Vencimento: {formatDateBR(p.dueDate)}
                          {p.receiptNote ? ` · Obs: ${p.receiptNote}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right mr-2">
                          <p className="font-black text-sm text-[#8A0000] tabular-nums">
                            {formatCurrency(p.totalAmount)}
                          </p>
                          <p className="text-[11px] font-bold text-neutral-600 tabular-nums">
                            {p.quantity} × {formatCurrency(p.unitPrice)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleTogglePickupPaid(p)}
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold cursor-pointer ${
                            eff === 'pago'
                              ? 'border-neutral-300 text-neutral-600 hover:border-[#111111]'
                              : 'bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-800'
                          }`}
                        >
                          {eff === 'pago' ? 'Reabrir' : 'Pagar'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeletePickup(p.id)}
                          className="p-1.5 border border-neutral-300 rounded-lg text-[#8A0000] hover:bg-red-50 cursor-pointer"
                          title="Excluir lançamento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================== SUB-TAB 3: EMPRESAS CONVENIADAS CRUD ======================== */}
      {subTab === 'empresas' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-black text-sm text-[#111111]">
                Empresas Conveniadas Cadastradas ({companies.length})
              </h4>
              <p className="text-[11px] text-neutral-500">
                Gerencie contratos corporativos, responsáveis autorizados e datas de vencimento.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreateCompany}
              className="bg-[#8A0000] hover:bg-[#6E0000] text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#D4A017]" />
              <span>Cadastrar Empresa</span>
            </button>
          </div>

          {showCompanyForm && (
            <form
              onSubmit={handleSaveCompany}
              className="p-5 rounded-xl bg-neutral-50 border border-neutral-300 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                <h5 className="font-black text-sm text-[#111111]">
                  {editingCompanyId
                    ? 'Editar Empresa Conveniada'
                    : 'Novo Cadastro de Empresa Conveniada'}
                </h5>
                <button
                  type="button"
                  onClick={() => setShowCompanyForm(false)}
                  className="text-xs font-bold text-neutral-500 hover:text-[#111111] cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold mb-1">
                    Nome da Empresa / Razão Social *
                  </label>
                  <input
                    type="text"
                    required
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    placeholder="Ex: Construtora Acre Forte Ltda"
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">CNPJ *</label>
                  <input
                    type="text"
                    required
                    value={compCnpj}
                    onChange={(e) => setCompCnpj(maskCnpj(e.target.value))}
                    placeholder="00.000.000/0000-00"
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs tabular-nums"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold mb-1">
                    Endereço Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={compAddress}
                    onChange={(e) => setCompAddress(e.target.value)}
                    placeholder="Rua/Av, Nº, Bairro, Cidade/UF"
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={compPhone}
                    onChange={(e) => setCompPhone(maskPhoneBR(e.target.value))}
                    placeholder="(68) 99999-9999"
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    E-mail (Faturas e Relatórios) *
                  </label>
                  <input
                    type="email"
                    required
                    value={compEmail}
                    onChange={(e) => setCompEmail(e.target.value)}
                    placeholder="financeiro@empresa.com.br"
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    Data de Início do Contrato *
                  </label>
                  <input
                    type="date"
                    required
                    value={compStartDate}
                    onChange={(e) => setCompStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs tabular-nums"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold mb-1">
                      Fechamento *
                    </label>
                    <select
                      value={compBillingCycle}
                      onChange={(e) =>
                        setCompBillingCycle(e.target.value as ConvenioBillingCycle)
                      }
                      className="w-full px-2.5 py-2 bg-white border border-neutral-300 rounded-lg text-xs"
                    >
                      <option value="mensal">Mensal</option>
                      <option value="quinzenal">Quinzenal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">
                      Dia de Vencimento *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={28}
                      required
                      value={compDueDay}
                      onChange={(e) =>
                        setCompDueDay(
                          Math.min(28, Math.max(1, Number(e.target.value) || 10))
                        )
                      }
                      className="w-full px-2.5 py-2 bg-white border border-neutral-300 rounded-lg text-xs tabular-nums"
                    />
                  </div>
                  <p className="col-span-2 text-[10px] text-neutral-500 tabular-nums">
                    Próx. vencimento previsto:{' '}
                    <strong className="text-[#111111]">
                      {formatDateBR(
                        computeInvoiceDueDate(
                          toLocalDateString(),
                          compBillingCycle,
                          compDueDay
                        )
                      )}
                    </strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    Responsável pela Retirada *
                  </label>
                  <input
                    type="text"
                    required
                    value={compAuthName}
                    onChange={(e) => setCompAuthName(e.target.value)}
                    placeholder="Nome completo do colaborador"
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    CPF do Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    value={compAuthCpf}
                    onChange={(e) => setCompAuthCpf(maskCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    Status do Convênio *
                  </label>
                  <select
                    value={compStatus}
                    onChange={(e) =>
                      setCompStatus(e.target.value as ConvenioCompanyStatus)
                    }
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="fatura_atraso">Fatura em Atraso</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={compSaving}
                  className="bg-[#8A0000] hover:bg-[#6E0000] disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-lg text-xs cursor-pointer"
                >
                  {compSaving
                    ? 'Salvando...'
                    : editingCompanyId
                    ? 'Salvar Alterações'
                    : 'Cadastrar Empresa Conveniada'}
                </button>
              </div>
            </form>
          )}

          {/* Companies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companies.map((c) => {
              const compPickups = pickups.filter((p) => p.companyId === c.id);
              const openAmt = compPickups
                .filter((p) => resolveEffectivePaymentStatus(p) !== 'pago')
                .reduce((acc, p) => acc + p.totalAmount, 0);

              return (
                <div
                  key={c.id}
                  className="border border-neutral-200 rounded-xl p-4 bg-white space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="font-black text-sm text-[#111111]">
                          {c.companyName}
                        </h5>
                        <p className="text-[11px] text-neutral-500 tabular-nums">
                          CNPJ: {c.cnpj}
                        </p>
                      </div>
                      {statusBadgeForCompany(c.status)}
                    </div>

                    <div className="text-xs text-neutral-600 space-y-1 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                      <p>
                        <strong>Endereço:</strong> {c.address}
                      </p>
                      <p className="tabular-nums">
                        <strong>WhatsApp:</strong> {c.phone} · <strong>E-mail:</strong>{' '}
                        {c.email}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-[#8A0000]" />
                        <span>
                          <strong>Autorizado:</strong> {c.authorizedPersonName} (CPF{' '}
                          {c.authorizedPersonCpf})
                        </span>
                      </p>
                      <p className="flex items-center gap-1.5 tabular-nums">
                        <Calendar className="w-3.5 h-3.5 text-[#D4A017]" />
                        <span>
                          Contrato desde {formatDateBR(c.contractStartDate)} · Fatura{' '}
                          <strong className="capitalize">{c.billingCycle}</strong> (dia{' '}
                          {String(c.dueDay).padStart(2, '0')})
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-neutral-700 tabular-nums">
                      Em aberto:{' '}
                      <strong className="text-[#8A0000]">
                        {formatCurrency(openAmt)}
                      </strong>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleCompanyStatus(c)}
                        className="px-2.5 py-1.5 rounded-lg border border-neutral-300 hover:border-[#111111] font-bold flex items-center gap-1 cursor-pointer"
                        title={c.status === 'inativo' ? 'Ativar' : 'Inativar'}
                      >
                        <Power className="w-3.5 h-3.5 text-[#D4A017]" />
                        <span>{c.status === 'inativo' ? 'Ativar' : 'Inativar'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditCompany(c)}
                        className="p-1.5 rounded-lg border border-neutral-300 hover:border-[#111111] cursor-pointer"
                        title="Editar empresa"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCompany(c)}
                        className="p-1.5 rounded-lg border border-neutral-300 text-[#8A0000] hover:bg-red-50 cursor-pointer"
                        title="Excluir empresa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================== SUB-TAB 4: RELATÓRIOS & EXPORTAÇÃO (.XLSX / .CSV) ======================== */}
      {subTab === 'relatorios' && (
        <div className="space-y-5">
          {/* Filters Toolbar */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold uppercase text-neutral-600">
                  Período:
                </span>
                {[
                  { id: 'diario', label: 'Diário' },
                  { id: 'semanal', label: 'Semanal (7d)' },
                  { id: 'quinzenal', label: 'Quinzenal (15d)' },
                  { id: 'mensal', label: 'Mensal' },
                  { id: 'personalizado', label: 'Personalizado' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      setReportPeriod(
                        p.id as
                          | 'diario'
                          | 'semanal'
                          | 'quinzenal'
                          | 'mensal'
                          | 'personalizado'
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                      reportPeriod === p.id
                        ? 'bg-[#8A0000] text-white border-[#8A0000]'
                        : 'bg-white text-neutral-700 border-neutral-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={reportCompanyId}
                  onChange={(e) => setReportCompanyId(e.target.value)}
                  className="px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs font-bold text-[#111111]"
                >
                  <option value="todas">Todas as Empresas ({companies.length})</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {reportPeriod === 'personalizado' && (
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-neutral-200 text-xs">
                <label className="font-bold flex items-center gap-1.5">
                  <span>De:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg tabular-nums"
                  />
                </label>
                <label className="font-bold flex items-center gap-1.5">
                  <span>Até:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg tabular-nums"
                  />
                </label>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-200">
              <p className="text-xs text-neutral-600 font-semibold">
                Exibindo <strong>{filteredReportPickups.length}</strong> registro(s) ·{' '}
                <span>{reportDateRange.label}</span>
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={openNotifyFromReport}
                  className="px-3.5 py-2 rounded-lg bg-[#D4A017] hover:bg-[#B8860B] text-[#111111] font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Notificar Empresa</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportConveniosCsv(filteredReportPickups)}
                  className="px-3.5 py-2 rounded-lg border border-[#111111] bg-white hover:bg-neutral-100 text-[#111111] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#8A0000]" />
                  <span>Exportar .CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportConveniosXlsx(filteredReportPickups)}
                  className="px-3.5 py-2 rounded-lg bg-[#111111] hover:bg-neutral-800 text-[#D4A017] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Exportar .XLSX</span>
                </button>
              </div>
            </div>
          </div>

          {/* Report Table with Footer Totalizer */}
          <div className="border border-neutral-200 rounded-xl overflow-x-auto bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-200 text-neutral-600 uppercase text-[11px]">
                  <th className="py-3 px-3 font-extrabold">Data da Retirada</th>
                  <th className="py-3 px-3 font-extrabold">Empresa Vinculada (CNPJ)</th>
                  <th className="py-3 px-3 font-extrabold">Responsável (CPF)</th>
                  <th className="py-3 px-3 font-extrabold text-center">Qtd</th>
                  <th className="py-3 px-3 font-extrabold text-right">Valor Unit.</th>
                  <th className="py-3 px-3 font-extrabold text-right">Total do Dia</th>
                  <th className="py-3 px-3 font-extrabold text-center">Vencimento</th>
                  <th className="py-3 px-3 font-extrabold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredReportPickups.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-neutral-500">
                      Nenhum lançamento encontrado no período e filtro selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredReportPickups.map((p) => {
                    const eff = resolveEffectivePaymentStatus(p);
                    return (
                      <tr key={p.id} className="hover:bg-neutral-50">
                        <td className="py-2.5 px-3 font-semibold text-[#111111] tabular-nums whitespace-nowrap">
                          {formatDateTimeBR(p.pickupDateTime)}
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-[#111111]">{p.companyName}</p>
                          <p className="text-[11px] text-neutral-500 tabular-nums">
                            {p.companyCnpj}
                          </p>
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-neutral-800">
                            {p.pickedUpByName}
                          </p>
                          <p className="text-[11px] text-neutral-500 tabular-nums">
                            {p.pickedUpByCpf}
                          </p>
                        </td>
                        <td className="py-2.5 px-3 text-center font-black tabular-nums">
                          {p.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right text-neutral-600 tabular-nums">
                          {formatCurrency(p.unitPrice)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-[#8A0000] tabular-nums">
                          {formatCurrency(p.totalAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-neutral-700 tabular-nums">
                          {formatDateBR(p.dueDate)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleTogglePickupPaid(p)}
                            className={`px-2 py-0.5 rounded text-[11px] font-extrabold cursor-pointer ${
                              eff === 'pago'
                                ? 'bg-emerald-100 text-emerald-800'
                                : eff === 'vencido'
                                ? 'bg-red-100 text-[#8A0000]'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                            title="Clique para alternar status Pago/Pendente"
                          >
                            {eff === 'pago'
                              ? 'Pago'
                              : eff === 'vencido'
                              ? 'Vencido'
                              : 'Pendente'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filteredReportPickups.length > 0 && (
                <tfoot>
                  <tr className="bg-[#111111] text-white font-black text-xs">
                    <td colSpan={3} className="py-3 px-3 uppercase tracking-wider text-[#D4A017]">
                      TOTALIZADOR DO PERÍODO FILTRADO
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums text-sm">
                      {reportTotals.qty} un.
                    </td>
                    <td className="py-3 px-3 text-right text-neutral-400">—</td>
                    <td className="py-3 px-3 text-right tabular-nums text-sm text-[#D4A017]">
                      {formatCurrency(reportTotals.amount)}
                    </td>
                    <td colSpan={2} className="py-3 px-3 text-right text-[11px] text-neutral-300">
                      {filteredReportPickups.length} lançamento(s)
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ======================== NOTIFICAR EMPRESA MODAL ======================== */}
      {notifyTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-neutral-200 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-neutral-200">
              <div>
                <h4 className="font-black text-base text-[#111111]">
                  Notificar Empresa · {notifyTarget.companyName}
                </h4>
                <p className="text-xs text-neutral-500">
                  Resumo formatado com período, quantidade, valor total, vencimento e Pix ({RESTAURANT_INFO.pixKey}).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotifyTarget(null)}
                className="p-1.5 rounded-lg border border-neutral-200 text-neutral-500 hover:text-[#111111] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              readOnly
              rows={11}
              value={notifyTarget.message}
              className="w-full p-3 bg-neutral-50 border border-neutral-300 rounded-xl font-mono text-xs text-[#111111]"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <a
                href={`https://wa.me/55${onlyDigits(notifyTarget.phone)}?text=${encodeURIComponent(
                  notifyTarget.message
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#8A0000] hover:bg-[#6E0000] text-white font-extrabold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4 text-[#D4A017]" />
                <span>Enviar WhatsApp</span>
              </a>

              <a
                href={`mailto:${encodeURIComponent(
                  notifyTarget.email
                )}?subject=${encodeURIComponent(
                  `Fatura Convênio Marmitex · ${RESTAURANT_INFO.name} (${notifyTarget.periodLabel})`
                )}&body=${encodeURIComponent(notifyTarget.message.replace(/\*/g, ''))}`}
                className="bg-[#111111] hover:bg-neutral-800 text-[#D4A017] font-extrabold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5"
              >
                <Mail className="w-4 h-4" />
                <span>Enviar E-mail</span>
              </a>

              <button
                type="button"
                onClick={async () => {
                  const ok = await copyTextToClipboard(notifyTarget.message);
                  if (ok) {
                    setNotifyCopied(true);
                    window.setTimeout(() => setNotifyCopied(false), 2500);
                  }
                }}
                className="border border-neutral-300 hover:border-[#111111] text-[#111111] font-bold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {notifyCopied ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>{notifyCopied ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { computeDueAlerts };
