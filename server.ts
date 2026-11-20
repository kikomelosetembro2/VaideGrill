import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

type OrderStatus =
  | 'pedido_aceito'
  | 'pedido_andamento'
  | 'pedido_mesa'
  | 'pedido_delivery'
  | 'pedido_entrega'
  | 'pedido_finalizado'
  | 'pedido_devolvido';

type OrderCategory = 'delivery' | 'retirada' | 'mesa';

const VALID_STATUSES: Set<OrderStatus> = new Set([
  'pedido_aceito',
  'pedido_andamento',
  'pedido_mesa',
  'pedido_delivery',
  'pedido_entrega',
  'pedido_finalizado',
  'pedido_devolvido',
]);

const VALID_CATEGORIES: Set<OrderCategory> = new Set(['delivery', 'retirada', 'mesa']);

interface AdminCredential {
  username: string;
  salt: string;
  hash: string;
}

interface StoredProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  note?: string;
  supportsDoneness?: boolean;
  prepTimeMinutes: number;
  defaultIngredients: string[];
  removableIngredients: string[];
  salesCount?: number;
  isAvailable?: boolean;
}

interface StoredOrderItem {
  cartItemId: string;
  menuItem: StoredProduct | { id: string; name: string; category?: string; price: number };
  quantity: number;
  customization: {
    removedIngredients: string[];
    addedExtras: Record<string, number>;
    meatDoneness?: string;
    specialNotes?: string;
  };
  unitPrice: number;
  totalPrice: number;
}

interface StoredOrder {
  id: string;
  orderNumber: number;
  customer: {
    name: string;
    phone: string;
    address?: {
      street: string;
      number: string;
      neighborhood: string;
      city: string;
      state: string;
      complement?: string;
      referencePoint?: string;
    };
  };
  items: StoredOrderItem[];
  orderCategory: OrderCategory;
  tableNumber?: string;
  deliveryFee: number;
  subtotal: number;
  discount: number;
  couponCode?: string;
  total: number;
  paymentMethod: string;
  paymentStatus: 'pendente' | 'aprovado';
  changeFor?: number;
  status: OrderStatus;
  createdAt: string;
  createdIso: string;
  estimatedTime: string;
  notes?: string;
  readyNotifiedAt?: string;
}

interface StoreData {
  orderCounter: number;
  adminCredential: AdminCredential | null;
  products: StoredProduct[];
  orders: StoredOrder[];
}

const STORE_FILE = path.resolve(process.cwd(), '.quiosk-store.json');
const PRODUCTS_SEED_FILE = path.resolve(process.cwd(), 'src/data/products.json');

function loadInitialProducts(): StoredProduct[] {
  try {
    const raw = fs.readFileSync(PRODUCTS_SEED_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (err) {
    console.error('Erro ao ler products.json:', err);
  }
  return [];
}

function createInitialOrders(products: StoredProduct[]): StoredOrder[] {
  const findItem = (id: string) =>
    products.find((p) => p.id === id) || {
      id,
      name: 'Alcatra Completa',
      category: 'espetinhos',
      price: 28,
    };

  const now = new Date();
  const iso1 = new Date(now.getTime() - 45 * 60000).toISOString();
  const iso2 = new Date(now.getTime() - 25 * 60000).toISOString();
  const iso3 = new Date(now.getTime() - 12 * 60000).toISOString();
  const iso4 = new Date(now.getTime() - 5 * 60000).toISOString();

  const p1 = findItem('esp_picanha_na_chapa');
  const p2 = findItem('beb_refri_lata');
  const p3 = findItem('tg_file_chapa_fritas');
  const p4 = findItem('arab_charutinho_10');
  const p5 = findItem('rabada_no_tucupi');

  return [
    {
      id: '#0004',
      orderNumber: 4,
      customer: {
        name: 'Mariana Souza',
        phone: '(68) 99912-4410',
      },
      items: [
        {
          cartItemId: 'seed_4_1',
          menuItem: p5,
          quantity: 1,
          customization: {
            removedIngredients: [],
            addedExtras: { extra_arroz: 1, extra_farofa: 1 },
            specialNotes: 'Sem camarão, bem quentinha',
          },
          unitPrice: 42.0,
          totalPrice: 42.0,
        },
        {
          cartItemId: 'seed_4_2',
          menuItem: p2,
          quantity: 2,
          customization: { removedIngredients: [], addedExtras: { extra_copo_gelo_limao: 2 } },
          unitPrice: 7.0,
          totalPrice: 14.0,
        },
      ],
      orderCategory: 'mesa',
      tableNumber: '04',
      deliveryFee: 0,
      subtotal: 56.0,
      discount: 0,
      total: 56.0,
      paymentMethod: 'cartao_credito',
      paymentStatus: 'aprovado',
      status: 'pedido_andamento',
      createdAt: new Date(iso4).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      createdIso: iso4,
      estimatedTime: '20 min',
    },
    {
      id: '#0003',
      orderNumber: 3,
      customer: {
        name: 'Carlos Eduardo',
        phone: '(68) 99988-3321',
        address: {
          street: 'Av. Ceará',
          number: '1420',
          neighborhood: 'Centro / Bosque / Estação',
          city: 'Rio Branco',
          state: 'AC',
          referencePoint: 'Em frente à praça',
        },
      },
      items: [
        {
          cartItemId: 'seed_3_1',
          menuItem: p3,
          quantity: 1,
          customization: {
            removedIngredients: [],
            addedExtras: { extra_baiao: 1, extra_embalagem: 1 },
            meatDoneness: 'ao_ponto',
          },
          unitPrice: 69.0,
          totalPrice: 69.0,
        },
      ],
      orderCategory: 'delivery',
      deliveryFee: 6.0,
      subtotal: 69.0,
      discount: 0,
      total: 75.0,
      paymentMethod: 'pix',
      paymentStatus: 'aprovado',
      status: 'pedido_delivery',
      createdAt: new Date(iso3).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      createdIso: iso3,
      estimatedTime: '30 - 40 min',
    },
    {
      id: '#0002',
      orderNumber: 2,
      customer: {
        name: 'Ana Paula Lima',
        phone: '(68) 99201-7755',
      },
      items: [
        {
          cartItemId: 'seed_2_1',
          menuItem: p4,
          quantity: 1,
          customization: {
            removedIngredients: [],
            addedExtras: { extra_embalagem: 1 },
          },
          unitPrice: 38.0,
          totalPrice: 38.0,
        },
        {
          cartItemId: 'seed_2_2',
          menuItem: p1,
          quantity: 1,
          customization: {
            removedIngredients: ['Vinagrete'],
            addedExtras: { extra_espeto_alcatra: 1 },
            meatDoneness: 'ao_ponto',
          },
          unitPrice: 49.0,
          totalPrice: 49.0,
        },
      ],
      orderCategory: 'retirada',
      deliveryFee: 0,
      subtotal: 87.0,
      discount: 0,
      total: 87.0,
      paymentMethod: 'pix',
      paymentStatus: 'aprovado',
      status: 'pedido_finalizado',
      createdAt: new Date(iso2).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      createdIso: iso2,
      estimatedTime: '20 - 25 min',
      readyNotifiedAt: new Date(iso2).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
    {
      id: '#0001',
      orderNumber: 1,
      customer: {
        name: 'Carlos Eduardo',
        phone: '(68) 99988-3321',
        address: {
          street: 'Av. Ceará',
          number: '1420',
          neighborhood: 'Centro / Bosque / Estação',
          city: 'Rio Branco',
          state: 'AC',
        },
      },
      items: [
        {
          cartItemId: 'seed_1_1',
          menuItem: p1,
          quantity: 2,
          customization: {
            removedIngredients: [],
            addedExtras: { extra_macaxeira: 1 },
            meatDoneness: 'bem_passado',
          },
          unitPrice: 39.0,
          totalPrice: 78.0,
        },
      ],
      orderCategory: 'delivery',
      deliveryFee: 6.0,
      subtotal: 78.0,
      discount: 5.0,
      couponCode: 'QUIOSK5',
      total: 79.0,
      paymentMethod: 'dinheiro',
      paymentStatus: 'aprovado',
      changeFor: 100,
      status: 'pedido_finalizado',
      createdAt: new Date(iso1).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      createdIso: iso1,
      estimatedTime: '30 - 40 min',
      readyNotifiedAt: new Date(iso1).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ];
}

function loadStore(): StoreData {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as StoreData;
      if (parsed && Array.isArray(parsed.products) && Array.isArray(parsed.orders)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Iniciando novo store local:', err);
  }
  const products = loadInitialProducts();
  const orders = createInitialOrders(products);
  const initial: StoreData = {
    orderCounter: 4,
    adminCredential: null,
    products,
    orders,
  };
  saveStore(initial);
  return initial;
}

function saveStore(data: StoreData): void {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao persistir dados do Quiosk da Preta:', err);
  }
}

function hashPassword(password: string, saltHex: string): string {
  return crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), 64).toString('hex');
}

function constantTimeMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function sanitizeImageUrl(url: unknown): string {
  if (typeof url !== 'string') return '/src/assets/images/quiosk_espetinhos_brasa_1795201717534.jpg';
  const trimmed = url.trim();
  if (
    trimmed.startsWith('/src/assets/') ||
    trimmed.startsWith('/assets/') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)
  ) {
    return trimmed;
  }
  return '/src/assets/images/quiosk_espetinhos_brasa_1795201717534.jpg';
}

const store = loadStore();
const activeSessions = new Map<string, { username: string; expiresAt: number }>();

function getEnvAdminPasscode(): string {
  return (process.env.ADMIN_PASSCODE || '').trim();
}

function getEnvAdminUsername(): string {
  return (process.env.ADMIN_USERNAME || 'admin').trim() || 'admin';
}

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
}

function getSession(req: Request): { username: string; expiresAt: number } | null {
  const token = getBearerToken(req);
  if (!token) return null;
  const sess = activeSessions.get(token);
  if (!sess) return null;
  if (Date.now() > sess.expiresAt) {
    activeSessions.delete(token);
    return null;
  }
  return sess;
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const sess = getSession(req);
  if (!sess) {
    res.status(401).json({ error: 'Acesso restrito. Faça login no Painel Administrativo.' });
    return;
  }
  next();
}

function formatOrderCode(num: number): string {
  return `#${String(num).padStart(4, '0')}`;
}

function buildCustomerSpendingReport(orders: StoredOrder[]) {
  const map = new Map<
    string,
    {
      customerKey: string;
      name: string;
      phone: string;
      totalOrders: number;
      totalSpent: number;
      deliveryCount: number;
      retiradaCount: number;
      mesaCount: number;
      lastOrderAt: string;
      lastOrderId: string;
      itemCounts: Map<string, number>;
    }
  >();

  for (const order of orders) {
    if (order.status === 'pedido_devolvido') continue;
    const phoneDigits = (order.customer.phone || '').replace(/\D/g, '');
    const key = phoneDigits || order.customer.name.trim().toLowerCase() || 'cliente';

    const existing = map.get(key) || {
      customerKey: key,
      name: order.customer.name,
      phone: order.customer.phone,
      totalOrders: 0,
      totalSpent: 0,
      deliveryCount: 0,
      retiradaCount: 0,
      mesaCount: 0,
      lastOrderAt: order.createdAt,
      lastOrderId: order.id,
      itemCounts: new Map<string, number>(),
    };

    existing.totalOrders += 1;
    existing.totalSpent += Number(order.total) || 0;
    if (order.orderCategory === 'delivery') existing.deliveryCount += 1;
    else if (order.orderCategory === 'mesa') existing.mesaCount += 1;
    else existing.retiradaCount += 1;

    for (const item of order.items) {
      const itemName = item.menuItem.name;
      existing.itemCounts.set(itemName, (existing.itemCounts.get(itemName) || 0) + item.quantity);
    }

    map.set(key, existing);
  }

  return Array.from(map.values())
    .map((c) => {
      let topItem = '—';
      let maxQty = 0;
      c.itemCounts.forEach((qty, name) => {
        if (qty > maxQty) {
          maxQty = qty;
          topItem = name;
        }
      });
      return {
        customerKey: c.customerKey,
        name: c.name,
        phone: c.phone,
        totalOrders: c.totalOrders,
        totalSpent: Number(c.totalSpent.toFixed(2)),
        averageTicket: Number((c.totalSpent / Math.max(1, c.totalOrders)).toFixed(2)),
        deliveryCount: c.deliveryCount,
        retiradaCount: c.retiradaCount,
        mesaCount: c.mesaCount,
        lastOrderAt: c.lastOrderAt,
        lastOrderId: c.lastOrderId,
        topItem,
      };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // ======================== ADMIN AUTH ROUTES ========================
  app.get('/api/admin/auth-status', (req: Request, res: Response) => {
    const envPasscode = getEnvAdminPasscode();
    const sess = getSession(req);
    const needsBootstrap = !envPasscode && !store.adminCredential;
    res.json({
      needsBootstrap,
      envPasscodeActive: Boolean(envPasscode),
      authenticated: Boolean(sess),
      username: sess?.username || null,
    });
  });

  app.post('/api/admin/bootstrap', (req: Request, res: Response) => {
    const envPasscode = getEnvAdminPasscode();
    if (envPasscode || store.adminCredential) {
      res.status(403).json({ error: 'Credencial de administrador já configurada.' });
      return;
    }

    const username = typeof req.body?.username === 'string' && req.body.username.trim()
      ? req.body.username.trim()
      : 'admin';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (password.length < 4) {
      res.status(400).json({ error: 'A senha deve conter pelo menos 4 caracteres.' });
      return;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(password, salt);
    store.adminCredential = { username, salt, hash };
    saveStore(store);

    const token = crypto.randomBytes(32).toString('hex');
    activeSessions.set(token, { username, expiresAt: Date.now() + 12 * 60 * 60 * 1000 });

    res.status(201).json({ token, username });
  });

  app.post('/api/admin/login', (req: Request, res: Response) => {
    const usernameInput = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const passwordInput = typeof req.body?.password === 'string' ? req.body.password : '';

    const envPasscode = getEnvAdminPasscode();
    if (envPasscode) {
      const expectedUser = getEnvAdminUsername();
      const userOk = !usernameInput || usernameInput === expectedUser;
      const passDigest = crypto.createHash('sha256').update(passwordInput).digest('hex');
      const envDigest = crypto.createHash('sha256').update(envPasscode).digest('hex');
      if (!userOk || !constantTimeMatch(passDigest, envDigest)) {
        res.status(401).json({ error: 'Usuário ou senha incorretos.' });
        return;
      }
      const token = crypto.randomBytes(32).toString('hex');
      activeSessions.set(token, {
        username: expectedUser,
        expiresAt: Date.now() + 12 * 60 * 60 * 1000,
      });
      res.json({ token, username: expectedUser });
      return;
    }

    if (!store.adminCredential) {
      res.status(400).json({ error: 'Configure a senha de administrador primeiro.' });
      return;
    }

    const userMatches =
      !usernameInput || usernameInput.toLowerCase() === store.adminCredential.username.toLowerCase();
    const attemptHash = hashPassword(passwordInput, store.adminCredential.salt);
    const passMatches = constantTimeMatch(attemptHash, store.adminCredential.hash);

    if (!userMatches || !passMatches) {
      res.status(401).json({ error: 'Usuário ou senha inválidos.' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    activeSessions.set(token, {
      username: store.adminCredential.username,
      expiresAt: Date.now() + 12 * 60 * 60 * 1000,
    });
    res.json({ token, username: store.adminCredential.username });
  });

  app.post('/api/admin/logout', (req: Request, res: Response) => {
    const token = getBearerToken(req);
    if (token) activeSessions.delete(token);
    res.json({ ok: true });
  });

  // ======================== PRODUCTS ROUTES ========================
  app.get('/api/products', (_req: Request, res: Response) => {
    res.json({ products: store.products });
  });

  app.post('/api/products', requireAdmin, (req: Request, res: Response) => {
    const body = req.body || {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const price = Number(body.price);
    if (!name || !Number.isFinite(price) || price < 0) {
      res.status(400).json({ error: 'Nome e preço válido são obrigatórios.' });
      return;
    }

    const newProduct: StoredProduct = {
      id: `quiosk_${Date.now()}`,
      name,
      category: typeof body.category === 'string' ? body.category : 'espetinhos',
      description: typeof body.description === 'string' ? body.description.trim() : '',
      price,
      originalPrice:
        body.originalPrice && Number.isFinite(Number(body.originalPrice))
          ? Number(body.originalPrice)
          : undefined,
      image: sanitizeImageUrl(body.image),
      note: typeof body.note === 'string' && body.note.trim() ? body.note.trim() : undefined,
      supportsDoneness: Boolean(body.supportsDoneness),
      prepTimeMinutes: Number.isFinite(Number(body.prepTimeMinutes))
        ? Number(body.prepTimeMinutes)
        : 20,
      defaultIngredients: Array.isArray(body.defaultIngredients)
        ? body.defaultIngredients.map(String)
        : [],
      removableIngredients: Array.isArray(body.removableIngredients)
        ? body.removableIngredients.map(String)
        : [],
      salesCount: 0,
      isAvailable: body.isAvailable !== false,
    };

    store.products.unshift(newProduct);
    saveStore(store);
    res.status(201).json({ product: newProduct });
  });

  app.put('/api/products/:id', requireAdmin, (req: Request, res: Response) => {
    const idx = store.products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Produto não encontrado.' });
      return;
    }

    const existing = store.products[idx];
    const body = req.body || {};
    const updated: StoredProduct = {
      ...existing,
      name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : existing.name,
      category: typeof body.category === 'string' ? body.category : existing.category,
      description:
        typeof body.description === 'string' ? body.description.trim() : existing.description,
      price:
        body.price !== undefined && Number.isFinite(Number(body.price))
          ? Number(body.price)
          : existing.price,
      originalPrice:
        body.originalPrice && Number.isFinite(Number(body.originalPrice))
          ? Number(body.originalPrice)
          : undefined,
      image: body.image ? sanitizeImageUrl(body.image) : existing.image,
      note: typeof body.note === 'string' ? body.note.trim() || undefined : existing.note,
      supportsDoneness:
        body.supportsDoneness !== undefined
          ? Boolean(body.supportsDoneness)
          : existing.supportsDoneness,
      prepTimeMinutes:
        body.prepTimeMinutes !== undefined && Number.isFinite(Number(body.prepTimeMinutes))
          ? Number(body.prepTimeMinutes)
          : existing.prepTimeMinutes,
      defaultIngredients: Array.isArray(body.defaultIngredients)
        ? body.defaultIngredients.map(String)
        : existing.defaultIngredients,
      removableIngredients: Array.isArray(body.removableIngredients)
        ? body.removableIngredients.map(String)
        : existing.removableIngredients,
      isAvailable:
        body.isAvailable !== undefined ? Boolean(body.isAvailable) : existing.isAvailable,
    };

    store.products[idx] = updated;
    saveStore(store);
    res.json({ product: updated });
  });

  app.delete('/api/products/:id', requireAdmin, (req: Request, res: Response) => {
    const idx = store.products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Produto não encontrado.' });
      return;
    }
    store.products.splice(idx, 1);
    saveStore(store);
    res.json({ ok: true });
  });

  // ======================== ORDERS & KDS ROUTES ========================
  app.get('/api/orders', (_req: Request, res: Response) => {
    res.json({
      orders: store.orders,
      nextOrderNumber: store.orderCounter + 1,
    });
  });

  app.post('/api/orders', (req: Request, res: Response) => {
    const body = req.body || {};
    if (!Array.isArray(body.items) || body.items.length === 0) {
      res.status(400).json({ error: 'O pedido deve conter ao menos 1 item.' });
      return;
    }

    const customerName =
      typeof body.customer?.name === 'string' ? body.customer.name.trim() : '';
    const customerPhone =
      typeof body.customer?.phone === 'string' ? body.customer.phone.trim() : '';
    if (!customerName || !customerPhone) {
      res.status(400).json({ error: 'Informe nome e telefone do cliente.' });
      return;
    }

    const orderCategory: OrderCategory = VALID_CATEGORIES.has(body.orderCategory)
      ? body.orderCategory
      : 'retirada';

    const nextNumber = store.orderCounter + 1;
    store.orderCounter = nextNumber;
    const orderId = formatOrderCode(nextNumber);

    const nowIso = new Date().toISOString();
    const createdAt = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const initialStatus: OrderStatus =
      body.status && VALID_STATUSES.has(body.status) ? body.status : 'pedido_aceito';

    const newOrder: StoredOrder = {
      id: orderId,
      orderNumber: nextNumber,
      customer: {
        name: customerName,
        phone: customerPhone,
        address:
          orderCategory === 'delivery' && body.customer?.address
            ? {
                street: String(body.customer.address.street || ''),
                number: String(body.customer.address.number || ''),
                neighborhood: String(body.customer.address.neighborhood || ''),
                city: 'Rio Branco',
                state: 'AC',
                complement: body.customer.address.complement
                  ? String(body.customer.address.complement)
                  : undefined,
                referencePoint: body.customer.address.referencePoint
                  ? String(body.customer.address.referencePoint)
                  : undefined,
              }
            : undefined,
      },
      items: body.items,
      orderCategory,
      tableNumber:
        orderCategory === 'mesa' && body.tableNumber ? String(body.tableNumber).trim() : undefined,
      deliveryFee: orderCategory === 'delivery' ? Number(body.deliveryFee) || 0 : 0,
      subtotal: Number(body.subtotal) || 0,
      discount: Number(body.discount) || 0,
      couponCode: typeof body.couponCode === 'string' ? body.couponCode : undefined,
      total: Number(body.total) || 0,
      paymentMethod: typeof body.paymentMethod === 'string' ? body.paymentMethod : 'pix',
      paymentStatus: body.paymentStatus === 'aprovado' ? 'aprovado' : 'pendente',
      changeFor:
        body.changeFor && Number.isFinite(Number(body.changeFor))
          ? Number(body.changeFor)
          : undefined,
      status: initialStatus,
      createdAt,
      createdIso: nowIso,
      estimatedTime:
        orderCategory === 'delivery'
          ? '30 - 45 min'
          : orderCategory === 'mesa'
          ? '15 - 25 min'
          : '15 - 25 min',
      notes: typeof body.notes === 'string' ? body.notes.trim() || undefined : undefined,
    };

    // Update product sales counts
    for (const item of newOrder.items) {
      const prod = store.products.find((p) => p.id === item.menuItem?.id);
      if (prod) {
        prod.salesCount = (prod.salesCount || 0) + (Number(item.quantity) || 1);
      }
    }

    store.orders.unshift(newOrder);
    saveStore(store);

    res.status(201).json({ order: newOrder });
  });

  app.patch('/api/orders/:id/status', requireAdmin, (req: Request, res: Response) => {
    const order = store.orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Pedido não encontrado.' });
      return;
    }

    const nextStatus = req.body?.status as OrderStatus;
    if (!VALID_STATUSES.has(nextStatus)) {
      res.status(400).json({ error: 'Status de pedido inválido.' });
      return;
    }

    order.status = nextStatus;
    if (req.body?.markReadyNotified) {
      order.readyNotifiedAt = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    saveStore(store);
    res.json({ order });
  });

  // ======================== ADMIN REPORTS ROUTE ========================
  app.get('/api/admin/reports', requireAdmin, (_req: Request, res: Response) => {
    const customerReport = buildCustomerSpendingReport(store.orders);
    const validOrders = store.orders.filter((o) => o.status !== 'pedido_devolvido');
    const totalRevenue = validOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    const byCategory = {
      delivery: validOrders.filter((o) => o.orderCategory === 'delivery').length,
      retirada: validOrders.filter((o) => o.orderCategory === 'retirada').length,
      mesa: validOrders.filter((o) => o.orderCategory === 'mesa').length,
    };

    res.json({
      totalRevenue,
      totalOrders: store.orders.length,
      validOrdersCount: validOrders.length,
      byCategory,
      customerReport,
    });
  });

  // ======================== VITE / STATIC SERVING ========================
  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Quiosk da Preta rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Falha ao iniciar servidor Quiosk da Preta:', err);
  process.exit(1);
});
