import { Router, Request, Response } from 'express';
import { PrismaClient } from '../generated/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: List all customers
 *     tags: [Customers]
 *     responses:
 *       200:
 *         description: List of customers
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: String(error) });
  }
});

/**
 * @swagger
 * /customers/email/{email}:
 *   get:
 *     summary: Find customer by email
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer found
 *       404:
 *         description: Customer not found
 */
router.get('/email/:email', async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customer.findUnique({ where: { email: req.params.email } });
    if (!customer) return res.status(404).json({ error: 'Not found', message: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: String(error) });
  }
});

/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     summary: Get customer by id
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer detail
 *       404:
 *         description: Customer not found
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });
    if (!customer) return res.status(404).json({ error: 'Not found', message: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: String(error) });
  }
});

/**
 * @swagger
 * /customers:
 *   post:
 *     summary: Create a customer
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name]
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Customer created
 *       400:
 *         description: Bad request
 *       409:
 *         description: Email already exists
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, name, phone } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Bad request', message: 'email and name are required' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Bad request', message: 'Invalid email format' });
    }

    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Conflict', message: 'Email already exists' });
    }

    const customer = await prisma.customer.create({ data: { email, name, phone } });
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: String(error) });
  }
});

/**
 * @swagger
 * /customers/{id}/orders:
 *   get:
 *     summary: Get customer order history
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order history
 *       404:
 *         description: Customer not found
 */
router.get('/:id/orders', async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });
    if (!customer) return res.status(404).json({ error: 'Not found', message: 'Customer not found' });

    const history = await prisma.orderHistory.findMany({
      where: { customer_id: req.params.id },
      orderBy: { created_at: 'desc' },
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: String(error) });
  }
});

/**
 * @swagger
 * /customers/{id}/orders:
 *   post:
 *     summary: Add order to customer history (called by OrderService)
 *     tags: [Customers]
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
 *             required: [order_id, total_amount, items_count]
 *             properties:
 *               order_id:
 *                 type: string
 *               total_amount:
 *                 type: number
 *               items_count:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Order added to history
 *       404:
 *         description: Customer not found
 */
router.post('/:id/orders', async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });
    if (!customer) return res.status(404).json({ error: 'Not found', message: 'Customer not found' });

    const { order_id, total_amount, items_count } = req.body;
    if (!order_id || total_amount === undefined || items_count === undefined) {
      return res.status(400).json({ error: 'Bad request', message: 'order_id, total_amount and items_count are required' });
    }

    const history = await prisma.orderHistory.create({
      data: { customer_id: req.params.id, order_id, total_amount, items_count },
    });
    res.status(201).json(history);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: String(error) });
  }
});

export default router;
