import { Router, Request, Response } from 'express';
import { PrismaClient } from '../generated/client';
import axios from 'axios';

const router = Router();
const prisma = new PrismaClient();

const MENU_SERVICE_URL = process.env.MENU_SERVICE_URL || 'http://localhost:3001';
const CUSTOMER_SERVICE_URL = process.env.CUSTOMER_SERVICE_URL || 'http://localhost:3002';

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready'],
  ready: ['completed'],
  completed: [],
  cancelled: [],
};

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: List all orders
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { created_at: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: String(error) });
  }
});

/**
 * @swagger
 * /orders/queue:
 *   get:
 *     summary: Get orders in preparation queue
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Orders with status confirmed or preparing
 */
router.get('/queue', async (_req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: { in: ['pending', 'confirmed', 'preparing', 'ready'] } },
      include: { items: true },
      orderBy: { estimated_ready_at: 'asc' },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: String(error) });
  }
});

/**
 * @swagger
 * /orders/customer/{customerId}:
 *   get:
 *     summary: Get orders by customer id
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer orders
 */
router.get('/customer/:customerId', async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { customer_id: req.params.customerId },
      include: { items: true },
      orderBy: { created_at: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: String(error) });
  }
});

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order by id
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order detail
 *       404:
 *         description: Order not found
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });
    if (!order) return res.status(404).json({ error: 'Not found', message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: String(error) });
  }
});

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create an order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customer_email, customer_name, items]
 *             properties:
 *               customer_email:
 *                 type: string
 *               customer_name:
 *                 type: string
 *               customer_phone:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product_id:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Order created
 *       400:
 *         description: Bad request
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { customer_email, customer_name, customer_phone, items } = req.body;

    if (!customer_email || !customer_name) {
      return res.status(400).json({ error: 'Bad request', message: 'customer_email and customer_name are required' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Bad request', message: 'At least 1 item is required' });
    }
    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity < 1) {
        return res.status(400).json({ error: 'Bad request', message: 'Each item must have product_id and quantity >= 1' });
      }
    }

    // Verify or create customer
    let customer;
    try {
      const customerRes = await axios.get(`${CUSTOMER_SERVICE_URL}/customers/email/${customer_email}`);
      customer = customerRes.data;
    } catch {
      // Customer doesn't exist, create one
      try {
        const customerRes = await axios.post(`${CUSTOMER_SERVICE_URL}/customers`, {
          email: customer_email,
          name: customer_name,
          phone: customer_phone,
        });
        customer = customerRes.data;
      } catch (createErr: any) {
        return res.status(400).json({ error: 'Bad request', message: 'Could not create/find customer' });
      }
    }

    // Verify products and fetch details
    const orderItems = [];
    let maxPrepTime = 0;

    for (const item of items) {
      try {
        const productRes = await axios.get(`${MENU_SERVICE_URL}/products/${item.product_id}`);
        const product = productRes.data;

        if (!product.is_available) {
          return res.status(400).json({ error: 'Bad request', message: `Product ${product.name} is not available` });
        }

        const subtotal = product.price * item.quantity;
        orderItems.push({
          product_id: product.id,
          product_name: product.name,
          unit_price: product.price,
          quantity: item.quantity,
          subtotal,
        });

        if (product.preparation_time > maxPrepTime) {
          maxPrepTime = product.preparation_time;
        }
      } catch {
        return res.status(400).json({ error: 'Bad request', message: `Product ${item.product_id} not found` });
      }
    }

    const total_amount = orderItems.reduce((sum, i) => sum + i.subtotal, 0);
    const estimated_ready_at = new Date(Date.now() + (maxPrepTime + 5) * 60 * 1000);

    const order = await prisma.order.create({
      data: {
        customer_id: customer.id,
        customer_name,
        customer_email,
        total_amount,
        estimated_ready_at,
        items: { create: orderItems },
      },
      include: { items: true },
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: String(error) });
  }
});

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [confirmed, preparing, ready, completed, cancelled]
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid transition
 *       404:
 *         description: Order not found
 */
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!order) return res.status(404).json({ error: 'Not found', message: 'Order not found' });

    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed || !allowed.includes(status)) {
      return res.status(400).json({
        error: 'Bad request',
        message: `Cannot transition from ${order.status} to ${status}`,
      });
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: { items: true },
    });

    // When completed, notify customer service
    if (status === 'completed') {
      try {
        await axios.post(`${CUSTOMER_SERVICE_URL}/customers/${order.customer_id}/orders`, {
          order_id: order.id,
          total_amount: order.total_amount,
          items_count: order.items.reduce((sum, i) => sum + i.quantity, 0),
        });
      } catch {
        // Don't fail the status update if history recording fails
        console.error('Failed to record order in customer history');
      }
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: String(error) });
  }
});

/**
 * @swagger
 * /orders/{id}/cancel:
 *   post:
 *     summary: Cancel an order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order cancelled
 *       400:
 *         description: Cannot cancel
 *       404:
 *         description: Order not found
 */
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: 'Not found', message: 'Order not found' });

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Can only cancel orders with status pending or confirmed',
      });
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'cancelled' },
      include: { items: true },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: String(error) });
  }
});

export default router;
