export interface TechSection {
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  details: {
    category: string;
    tech: string;
    reason: string;
  }[];
}

export interface RoadmapWeek {
  week: number;
  phase: string;
  duration: string;
  deliverables: string[];
  keyMilestone: string;
  status: 'concluido_neste_prototipo' | 'planejado';
}

export const TECH_STACK_RECOMMENDATION: TechSection[] = [
  {
    title: '1. Frontend Cross-Platform (Cliente & Totem)',
    subtitle: 'Experiência fluida para Web PWA, iOS e Android',
    description: 'Para o cliente final de uma sanduicheria com alto volume de pedidos, a prioridade é carregamento instantâneo (< 1.5s), suporte offline para menus salvos e interface com feedback tátil de customização.',
    highlights: [
      'React + Vite PWA para Web Mobile (sem necessidade de instalar da loja para pedir)',
      'React Native (Expo) ou Flutter para versões nativas nas lojas Apple Store e Google Play com mesmo código base',
      'Tailwind CSS para styling modular com tema de alto contraste (Preto, Laranja e Branco)',
      'Zustand ou Redux Toolkit para gerenciamento global de carrinho e sincronização de pedidos',
    ],
    details: [
      { category: 'Web / PWA', tech: 'React 19 + TypeScript + Vite', reason: 'Performance máxima de bundle, suporte a PWA com notificações push e funcionamento no navegador sem atrito.' },
      { category: 'Mobile Nativo', tech: 'React Native / Expo SDK', reason: 'Reutilização de 85% dos hooks e tipos de TypeScript entre Web e Mobile, reduzindo tempo de desenvolvimento pela metade.' },
      { category: 'Design System', tech: 'Tailwind CSS + Lucide Icons + Motion', reason: 'Identidade visual moderna com microinterações suaves ao adicionar queijos e carnes.' },
    ],
  },
  {
    title: '2. Backend & Banco de Dados em Tempo Real',
    subtitle: 'APIs resilientes para picos de pedidos (Sexta a Domingo)',
    description: 'Sanduicherias sofrem com rajadas de pedidos no horário nobre (19h às 22h). É essencial um backend que transmita atualizações instantâneas de status para a cozinha e para o cliente sem polling excessivo.',
    highlights: [
      'Node.js (NestJS ou Express com TypeScript) ou Go (Golang) para alto throughput',
      'PostgreSQL (Cloud SQL / Supabase) para integridade relacional financeira e de cardápio',
      'Redis para cache de cardápio, controle de concorrência e fila de pedidos (BullMQ)',
      'WebSockets / Server-Sent Events (SSE) para atualização em tempo real do status na cozinha (KDS) e mapa do motoboy',
    ],
    details: [
      { category: 'Linguagem / Runtime', tech: 'Node.js LTS (TypeScript) ou Go', reason: 'Ecossistema rico para integrações com gateways de pagamento brasileiros e bibliotecas de impressão térmica.' },
      { category: 'Banco Principal', tech: 'PostgreSQL com Prisma / Drizzle', reason: 'Garante transações ACID perfeitas para pagamentos, histórico de faturamento e cupons de desconto.' },
      { category: 'Tempo Real & Cache', tech: 'Redis + Socket.io / WebSockets', reason: 'Broadcast de novo pedido para a cozinha em < 50ms com confirmação de recebimento.' },
    ],
  },
  {
    title: '3. Meios de Pagamento & Integrações Essenciais',
    subtitle: 'Checkout veloz com foco em conversão no Brasil',
    description: 'No mercado brasileiro de delivery, 60% a 70% dos pedidos são pagos via Pix. Um checkout com QR Code e Copia e Cola com confirmação instantânea de pagamento reduz cancelamentos em até 40%.',
    highlights: [
      'Pix Dinâmico (Mercado Pago, Asaas, Efí ou Itaú/Banco Central) com Webhook de conciliação imediata',
      'Cartão de Crédito e Débito tokenizado com antifraude (ClearSale / Konduto integrado no gateway)',
      'Carteiras Digitais nativas (Apple Pay e Google Pay) permitindo compra com 1 toque no celular',
      'Dinheiro na entrega com cálculo automático de troco para evitar desentendimentos na entrega',
    ],
    details: [
      { category: 'Pix Automatizado', tech: 'API Pix Banco Central (PSP)', reason: 'QR Code com vencimento de 15 min; quando o cliente paga no app do banco dele, o backend recebe o webhook e aprova em 2 segundos.' },
      { category: 'Cartões & Carteiras', tech: 'Stripe ou Mercado Pago SDK', reason: 'Suporte nativo a Apple Pay, Google Pay, parcelamento sem juros e compliance PCI-DSS.' },
      { category: 'Mensageria WhatsApp', tech: 'Z-API ou WhatsApp Business Cloud API', reason: 'Envio automático de mensagem no WhatsApp do cliente com o link de rastreamento do Kikomelo001.' },
    ],
  },
  {
    title: '4. Painel do Estabelecimento & KDS (Cozinha)',
    subtitle: 'Gerenciador de Ordens e Impressão de Comanda Térmica',
    description: 'A cozinha precisa de um painel simples e sem distrações (KDS - Kitchen Display System) com alertas sonoros, contadores de tempo por prato e destaque de customizações críticas.',
    highlights: [
      'Classificação visual por tempo: Verde (< 15 min), Amarelo (15-25 min), Vermelho (> 25 min)',
      'Alertas de customização destacados em cores fortes: SEM CEBOLA, EXTRA BACON, PONTO DA CARNE',
      'Integração com impressoras térmicas ESC/POS (80mm) via USB ou rede Ethernet/Wi-Fi',
      'Módulo de despacho de motoboy com link de rota GPS e notificação ao cliente',
    ],
    details: [
      { category: 'Interface KDS', tech: 'Web Dashboard fullscreen para tablets/monitores', reason: 'Pode rodar em qualquer tablet Android ou smart TV barata na área de montagem da chapa.' },
      { category: 'Impressão Térmica', tech: 'ESC/POS via biblioteca node-escpos ou QZ Tray', reason: 'Imprime via comando direto duas vias: 1 via para a chapa/montagem e 1 via para anexar na embalagem do motoboy.' },
    ],
  },
];

export const MVP_ROADMAP: RoadmapWeek[] = [
  {
    week: 1,
    phase: 'Semana 1: Arquitetura, Banco de Dados & Cardápio',
    duration: 'Dias 1 a 5',
    deliverables: [
      'Modelagem do banco de dados (Tabelas: Clientes, Produtos, Ingredientes, Adicionais, Pedidos, Itens, Cupons)',
      'Configuração da infraestrutura de CI/CD e repositórios Frontend e Backend',
      'Cadastro do cardápio completo da Lanchonete Kikomelo001 com categorização e fotos',
      'Implementação da tela Home com busca por ingredientes e categorias',
    ],
    keyMilestone: 'Catálogo de produtos navegável e estruturação de dados concluída.',
    status: 'concluido_neste_prototipo',
  },
  {
    week: 2,
    phase: 'Semana 2: Customizador Crítico de Sanduíches & Monte seu Burger',
    duration: 'Dias 6 a 10',
    deliverables: [
      'Módulo de Customização de Sanduíche: remoção de ingredientes base e adição de extras',
      'Cálculo de preço reativo em tempo real e seleção de ponto da carne',
      'Módulo "Monte seu Sanduíche do Zero" com 5 passos (Pão -> Carne -> Queijo -> Molho -> Saladas)',
      'Validação de regras de negócio (limite de itens, adicionais cobrados, notas da cozinha)',
    ],
    keyMilestone: 'Customizador 100% interativo com camadas visuais do burger funcionando.',
    status: 'concluido_neste_prototipo',
  },
  {
    week: 3,
    phase: 'Semana 3: Carrinho, Validação de Bairros de Rio Branco & Checkout',
    duration: 'Dias 11 a 15',
    deliverables: [
      'Carrinho de compras reativo com edição e exclusão de itens',
      'Seletor de Bairros de Rio Branco com taxas de entrega e prazos estimados',
      'Opção de Retirada no balcão (Rua Teste, 1182 - Bairro Centro)',
      'Mecanismo de cupons de desconto (KIKOMELO10, ACREVIP)',
      'Integração de checkout Pix dinâmico, Cartão de Crédito e Carteiras Digitais',
    ],
    keyMilestone: 'Fluxo completo de pedido fechado e geração do código Pix.',
    status: 'concluido_neste_prototipo',
  },
  {
    week: 4,
    phase: 'Semana 4: Painel da Cozinha (KDS), Impressão & Rastreio em Tempo Real',
    duration: 'Dias 16 a 20',
    deliverables: [
      'Desenvolvimento do painel KDS para a equipe da cozinha da Lanchonete Kikomelo001',
      'Transição de status em tempo real (Recebido -> Em Preparo -> Pronto -> Saiu para Entrega)',
      'Tela de acompanhamento do cliente com linha do tempo e mapa animado de entrega em Rio Branco',
      'Formatação de comanda térmica de 80mm pronta para impressão',
      'Login social (Google/Apple) e autenticação OTP por celular',
    ],
    keyMilestone: 'MVP funcional de ponta a ponta: do pedido do cliente à entrega pelo motoboy.',
    status: 'concluido_neste_prototipo',
  },
  {
    week: 5,
    phase: 'Semana 5 (Pós-MVP): Testes Piloto em Rio Branco & Ajustes de Operação',
    duration: 'Dias 21 a 25',
    deliverables: [
      'Testes de carga com pedidos simultâneos no horário de pico',
      'Treinamento da equipe de chapeiros e atendentes na Rua Teste, 1182',
      'Integração de notificações via WhatsApp oficial para o cliente',
      'Ajustes nos tempos médios de preparo e rotas de motoboy',
    ],
    keyMilestone: 'Lançamento oficial em produção para os clientes de Rio Branco, Acre!',
    status: 'planejado',
  },
];
