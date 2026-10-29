import { Order } from '../types';
import { RESTAURANT_INFO } from '../data/menuData';

/**
 * Formata o objeto 'Order' em uma mensagem de texto estruturada
 * organizada por seções obrigatórias:
 * 1. Dados do Cliente e Entrega
 * 2. Itens do Pedido (com personalizações, ponto da carne e adicionais)
 * 3. Totais e Valores
 * 4. Forma de Pagamento
 */
export function formatOrderWhatsAppMessage(order: Order): string {
  const line = '------------------------------------------';
  const doubleLine = '==========================================';
  const timeStr = order.createdAt || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  let msg = `🔥 *LANCHONETE VAI DE GRILL* 🔥\n`;
  msg += `*COMPROVANTE OFICIAL DA COZINHA (KDS)*\n`;
  msg += `${doubleLine}\n`;
  msg += `📋 *PEDIDO:* #${order.id}\n`;
  msg += `⏰ *HORÁRIO:* ${timeStr}\n`;
  msg += `📍 *ESTABELECIMENTO:* ${RESTAURANT_INFO.address} - Rio Branco/AC\n`;
  msg += `${line}\n\n`;

  // SEÇÃO 1: DADOS DO CLIENTE
  msg += `👤 *1. DADOS DO CLIENTE*\n`;
  msg += `• *Nome:* ${order.customer.name}\n`;
  msg += `• *Telefone/WhatsApp:* ${order.customer.phone}\n`;

  if (order.deliveryMethod === 'entrega' && order.customer.address) {
    msg += `• *Tipo de Pedido:* 🛵 DELIVERY (ENTREGA)\n`;
    msg += `• *Endereço:* ${order.customer.address.street}, Nº ${order.customer.address.number}\n`;
    msg += `• *Bairro:* ${order.customer.address.neighborhood}\n`;
    msg += `• *Cidade/UF:* Rio Branco - AC\n`;
    if (order.customer.address.complement) {
      msg += `• *Complemento:* ${order.customer.address.complement}\n`;
    }
    if (order.customer.address.referencePoint) {
      msg += `• *Ponto de Ref.:* ${order.customer.address.referencePoint}\n`;
    }
  } else {
    msg += `• *Tipo de Pedido:* 🏪 RETIRADA NO BALCÃO\n`;
    msg += `• *Local de Retirada:* ${RESTAURANT_INFO.address} - Bairro João Eduardo\n`;
    msg += `• *Tempo Estimado:* ~15 a 25 minutos\n`;
  }

  msg += `\n${line}\n\n`;

  // SEÇÃO 2: ITENS DO PEDIDO
  msg += `🍔 *2. ITENS DO PEDIDO*\n`;
  order.items.forEach((item, index) => {
    msg += `*${index + 1}. [${item.quantity}x] ${item.menuItem.name}* - R$ ${item.totalPrice.toFixed(2).replace('.', ',')}\n`;

    // Ponto da carne na grelha
    if (item.customization.meatDoneness) {
      const donenessMap: Record<string, string> = {
        mal_passado: 'MAL PASSADO (Vermelho centro suculento)',
        ao_ponto: 'AO PONTO (Rosado centro macio)',
        bem_passado: 'BEM PASSADO (Tostadinho sem sangue)',
      };
      msg += `   🥩 *Ponto na Grelha:* ${donenessMap[item.customization.meatDoneness] || item.customization.meatDoneness.toUpperCase()}\n`;
    }

    // Ingredientes Removidos
    if (item.customization.removedIngredients && item.customization.removedIngredients.length > 0) {
      msg += `   ❌ *Remover:* ${item.customization.removedIngredients.join(', ')}\n`;
    }

    // Adicionais Extras
    const extrasList = Object.entries(item.customization.addedExtras || {});
    if (extrasList.length > 0) {
      msg += `   ➕ *Adicionais Selecionados:*\n`;
      extrasList.forEach(([extraId, qty]) => {
        const extraOpt = item.menuItem.availableExtras.find((e) => e.id === extraId);
        if (extraOpt) {
          msg += `      • ${qty}x ${extraOpt.name} (+R$ ${(extraOpt.price * qty).toFixed(2).replace('.', ',')})\n`;
        }
      });
    }

    // Se for hambúrguer montado do zero
    if (item.isCustomBurger && item.customBurgerLayers) {
      msg += `   🍞 *Pão:* ${item.customBurgerLayers.bread}\n`;
      msg += `   🥩 *Carne:* ${item.customBurgerLayers.protein}\n`;
      if (item.customBurgerLayers.cheeses.length > 0) {
        msg += `   🧀 *Queijos:* ${item.customBurgerLayers.cheeses.join(', ')}\n`;
      }
      if (item.customBurgerLayers.sauces.length > 0) {
        msg += `   🥫 *Molhos:* ${item.customBurgerLayers.sauces.join(', ')}\n`;
      }
      if (item.customBurgerLayers.toppings.length > 0) {
        msg += `   🥓 *Saladas/Toppings:* ${item.customBurgerLayers.toppings.join(', ')}\n`;
      }
    }

    // Observações especiais para a cozinha
    if (item.customization.specialNotes) {
      msg += `   ⚠️ *Obs da Cozinha:* "${item.customization.specialNotes}"\n`;
    }

    msg += `\n`;
  });

  msg += `${line}\n\n`;

  // SEÇÃO 3: TOTAIS E VALORES
  msg += `💰 *3. TOTAIS E VALORES*\n`;
  msg += `• Subtotal dos Itens: R$ ${order.subtotal.toFixed(2).replace('.', ',')}\n`;
  msg += `• Taxa de Entrega: R$ ${order.deliveryFee.toFixed(2).replace('.', ',')} ${order.deliveryMethod === 'retirada' ? '(Retirada Grátis)' : ''}\n`;

  if (order.discount > 0) {
    msg += `• Desconto Aplicado: -R$ ${order.discount.toFixed(2).replace('.', ',')} (${order.couponCode || 'Cupom'})\n`;
  }

  msg += `👉 *TOTAL DO PEDIDO: R$ ${order.total.toFixed(2).replace('.', ',')}*\n`;

  msg += `\n${line}\n\n`;

  // SEÇÃO 4: FORMA DE PAGAMENTO
  msg += `💳 *4. FORMA DE PAGAMENTO*\n`;
  const paymentLabels: Record<string, string> = {
    pix: 'PIX (Chave Celular: (68) 99227-7408)',
    cartao_credito: 'Cartão de Crédito / Débito',
    carteira_digital: 'Carteira Digital (Apple Pay / Google Pay)',
    dinheiro: 'Dinheiro na Entrega',
  };
  msg += `• Método: ${paymentLabels[order.paymentMethod] || order.paymentMethod.toUpperCase()}\n`;
  msg += `• Status: ${order.paymentStatus === 'aprovado' ? '✅ Aprovado / Confirmado' : '⏳ Aguardando Conferência'}\n`;

  if (order.changeFor) {
    const changeAmount = order.changeFor - order.total;
    msg += `• Levar Troco Para: R$ ${order.changeFor.toFixed(2).replace('.', ',')} (Troco: R$ ${changeAmount > 0 ? changeAmount.toFixed(2).replace('.', ',') : '0,00'})\n`;
  }

  if (order.loyaltyPointsEarned) {
    msg += `⭐ *Pontos de Fidelidade Ganhos:* +${order.loyaltyPointsEarned} pontos\n`;
  }

  msg += `\n${doubleLine}\n`;
  msg += `🔥 *Vai de Grill - O Sabor do Sanduíche Artesanal na Brasa*\n`;
  msg += `📞 WhatsApp Delivery: (68) 99227-7408\n`;
  msg += `📍 Rua A, 1176 - Bairro João Eduardo, Rio Branco - AC`;

  return msg;
}

/**
 * Dispara automaticamente a abertura do link wa.me para o WhatsApp da Lanchonete Vai de Grill
 * com o comprovante estruturado.
 */
export function triggerWhatsAppOrder(order: Order, phone: string = RESTAURANT_INFO.whatsappRaw): string {
  const message = formatOrderWhatsAppMessage(order);
  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${phone}?text=${encoded}`;

  try {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.warn('Erro ao disparar link do WhatsApp:', err);
  }

  return url;
}

// Aliases para compatibilidade reversa com telas já existentes
export const generateWhatsAppReceipt = formatOrderWhatsAppMessage;
export const openWhatsAppOrder = triggerWhatsAppOrder;
