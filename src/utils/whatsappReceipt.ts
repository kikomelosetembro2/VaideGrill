import { Order } from '../types';
import {
  RESTAURANT_INFO,
  COMMON_EXTRAS,
  getOrderStatusLabel,
  ORDER_CATEGORY_LABELS,
} from '../data/menuData';

/**
 * Formata o objeto 'Order' em comanda oficial de cozinha para WhatsApp,
 * incluindo número automático sequencial, categoria (Delivery/Retirada/Mesa Presencial),
 * posição de status atual e TODOS os produtos com seus adicionais selecionados.
 */
export function formatKitchenComandaWhatsApp(order: Order): string {
  const line = '------------------------------------------';
  const doubleLine = '==========================================';
  const timeStr =
    order.createdAt ||
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const categoryInfo = ORDER_CATEGORY_LABELS[order.orderCategory];
  const statusLabel = getOrderStatusLabel(order.status);

  let msg = `*${RESTAURANT_INFO.name.toUpperCase()}*\n`;
  msg += `*COMANDA OFICIAL DA COZINHA*\n`;
  msg += `${doubleLine}\n`;
  msg += `*PEDIDO Nº:* ${order.id} (Seq. #${order.orderNumber})\n`;
  msg += `*DATA/HORA:* ${timeStr}\n`;
  msg += `*CATEGORIA:* ${categoryInfo.label.toUpperCase()}${
    order.orderCategory === 'mesa' && order.tableNumber
      ? ` — MESA ${order.tableNumber}`
      : ''
  }\n`;
  msg += `*STATUS NA COMANDA:* [${statusLabel.toUpperCase()}]\n`;
  msg += `${line}\n\n`;

  // SEÇÃO 1: DADOS DO CLIENTE E ATENDIMENTO
  msg += `*1. DADOS DO CLIENTE / ATENDIMENTO*\n`;
  msg += `- Nome: ${order.customer.name}\n`;
  msg += `- WhatsApp/Tel: ${order.customer.phone}\n`;

  if (order.orderCategory === 'delivery' && order.customer.address) {
    msg += `- Entrega: ${order.customer.address.street}, Nº ${order.customer.address.number}\n`;
    msg += `- Bairro: ${order.customer.address.neighborhood} (${order.customer.address.city}-${order.customer.address.state})\n`;
    if (order.customer.address.complement) {
      msg += `- Complemento: ${order.customer.address.complement}\n`;
    }
    if (order.customer.address.referencePoint) {
      msg += `- Referencia: ${order.customer.address.referencePoint}\n`;
    }
  } else if (order.orderCategory === 'mesa') {
    msg += `- Atendimento: Mesa Presencial${order.tableNumber ? ` (Mesa ${order.tableNumber})` : ''}\n`;
  } else {
    msg += `- Atendimento: Retirada no Balcao\n`;
  }

  msg += `\n${line}\n\n`;

  // SEÇÃO 2: TODOS OS PRODUTOS COM ADICIONAIS
  msg += `*2. PRODUTOS E ADICIONAIS DA COMANDA*\n`;
  order.items.forEach((item, index) => {
    msg += `*${index + 1}. [${item.quantity}x] ${item.menuItem.name}* — R$ ${item.totalPrice
      .toFixed(2)
      .replace('.', ',')}\n`;

    if (item.customization.meatDoneness) {
      const donenessMap: Record<string, string> = {
        mal_passado: 'Mal Passado',
        ao_ponto: 'Ao Ponto',
        bem_passado: 'Bem Passado',
      };
      msg += `   *Ponto da Carne:* ${
        donenessMap[item.customization.meatDoneness] || item.customization.meatDoneness
      }\n`;
    }

    if (
      item.customization.removedIngredients &&
      item.customization.removedIngredients.length > 0
    ) {
      msg += `   *Remover:* ${item.customization.removedIngredients.join(', ')}\n`;
    }

    const extrasList = Object.entries(item.customization.addedExtras || {}).filter(
      ([, qty]) => qty > 0
    );
    if (extrasList.length > 0) {
      msg += `   *Adicionais Inclusos:*\n`;
      extrasList.forEach(([extraId, qty]) => {
        const extraOpt =
          item.menuItem.availableExtras.find((e) => e.id === extraId) ||
          COMMON_EXTRAS.find((e) => e.id === extraId);
        if (extraOpt) {
          msg += `     + ${qty}x ${extraOpt.name} (R$ ${(extraOpt.price * qty)
            .toFixed(2)
            .replace('.', ',')})\n`;
        }
      });
    }

    if (item.customization.specialNotes) {
      msg += `   *Obs. Cozinha:* "${item.customization.specialNotes}"\n`;
    }
    msg += `\n`;
  });

  if (order.notes) {
    msg += `*Observação Geral:* ${order.notes}\n\n`;
  }

  msg += `${line}\n\n`;

  // SEÇÃO 3: TOTAIS E PAGAMENTO
  msg += `*3. TOTAIS E PAGAMENTO*\n`;
  msg += `- Subtotal: R$ ${order.subtotal.toFixed(2).replace('.', ',')}\n`;
  if (order.orderCategory === 'delivery') {
    msg += `- Taxa Entrega: R$ ${order.deliveryFee.toFixed(2).replace('.', ',')}\n`;
  }
  if (order.discount > 0) {
    msg += `- Desconto: -R$ ${order.discount.toFixed(2).replace('.', ',')} (${
      order.couponCode || 'Fidelidade'
    })\n`;
  }
  msg += `*TOTAL GERAL: R$ ${order.total.toFixed(2).replace('.', ',')}*\n`;

  const paymentLabels: Record<string, string> = {
    pix: `PIX (Chave: ${RESTAURANT_INFO.phone})`,
    cartao_credito: 'Cartao de Credito',
    cartao_debito: 'Cartao de Debito',
    dinheiro: 'Dinheiro',
  };
  msg += `- Pagamento: ${paymentLabels[order.paymentMethod] || order.paymentMethod}\n`;
  msg += `- Situacao Pagto: ${
    order.paymentStatus === 'aprovado' ? 'Aprovado' : 'A conferir na entrega/caixa'
  }\n`;

  if (order.changeFor && order.changeFor > order.total) {
    const change = order.changeFor - order.total;
    msg += `- Troco para: R$ ${order.changeFor.toFixed(2).replace('.', ',')} (Troco: R$ ${change
      .toFixed(2)
      .replace('.', ',')})\n`;
  }

  msg += `\n${doubleLine}\n`;
  msg += `${RESTAURANT_INFO.name} · ${RESTAURANT_INFO.phone}\n`;
  msg += `${RESTAURANT_INFO.openingHours}`;

  return msg;
}

/**
 * Formata notificação WhatsApp para o CLIENTE quando o pedido estiver pronto.
 */
export function formatCustomerReadyWhatsApp(order: Order): string {
  const statusLabel = getOrderStatusLabel(order.status);
  const categoryInfo = ORDER_CATEGORY_LABELS[order.orderCategory];

  let msg = `Olá *${order.customer.name}*!\n\n`;
  msg += `Seu pedido *${order.id}* no *${RESTAURANT_INFO.name}* está *PRONTO*!\n`;
  msg += `*Status atual:* ${statusLabel}\n`;
  msg += `*Categoria:* ${categoryInfo.label}${
    order.orderCategory === 'mesa' && order.tableNumber ? ` (Mesa ${order.tableNumber})` : ''
  }\n`;
  msg += `*Total:* R$ ${order.total.toFixed(2).replace('.', ',')}\n\n`;

  if (order.orderCategory === 'delivery') {
    msg += `Nossa equipe já está despachando para o endereço: ${order.customer.address?.street}, Nº ${order.customer.address?.number} (${order.customer.address?.neighborhood}).\n`;
  } else if (order.orderCategory === 'mesa') {
    msg += `Nossa equipe está levando seu pedido à Mesa ${order.tableNumber || 'indicada'}. Bom apetite!\n`;
  } else {
    msg += `Você já pode retirar seu pedido no balcão do Quiosk da Preta. Bom apetite!\n`;
  }

  msg += `\nObrigado pela preferência! ${RESTAURANT_INFO.instagram}`;
  return msg;
}

function openExternalWhatsAppLink(phoneDigits: string, message: string): string {
  const cleanDigits = phoneDigits.replace(/\D/g, '');
  const withCountry = cleanDigits.startsWith('55') ? cleanDigits : `55${cleanDigits}`;
  const url = `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;

  try {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.warn('Nao foi possivel abrir o link do WhatsApp:', err);
  }
  return url;
}

export function triggerWhatsAppKitchenComanda(
  order: Order,
  phone: string = RESTAURANT_INFO.whatsappRaw
): string {
  const message = formatKitchenComandaWhatsApp(order);
  return openExternalWhatsAppLink(phone, message);
}

export function triggerCustomerReadyWhatsApp(order: Order): string {
  const message = formatCustomerReadyWhatsApp(order);
  return openExternalWhatsAppLink(order.customer.phone, message);
}

// Aliases de compatibilidade
export const generateWhatsAppReceipt = formatKitchenComandaWhatsApp;
export const openWhatsAppOrder = triggerWhatsAppKitchenComanda;
