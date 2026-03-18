import { Router, Request, Response } from 'express';
import { PrismaClient } from '../generated/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         price:
 *           type: number
 *         category_id:
 *           type: string
 *         image_url:
 *           type: string
 *           nullable: true
 *         is_available:
 *           type: boolean
 *         preparation_time:
 *           type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: List all products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: available
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category_id, available } = req.query;
    const where: any = {};
    if (category_id) where.category_id = String(category_id);
    if (available !== undefined) where.is_available = available === 'true';

    const products = await prisma.product.findMany({ where });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: String(error) });
  }
});

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a product by id
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product detail
 *       404:
 *         description: Product not found
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: 'Not found', message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: String(error) });
  }
});

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, category_id, preparation_time]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *                 minimum: 0.5
 *               category_id:
 *                 type: string
 *               image_url:
 *                 type: string
 *               is_available:
 *                 type: boolean
 *               preparation_time:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 60
 *     responses:
 *       201:
 *         description: Product created
 *       400:
 *         description: Bad request
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, price, category_id, image_url, is_available, preparation_time } = req.body;

    if (!name) return res.status(400).json({ error: 'Bad request', message: 'name is required' });
    if (price === undefined || price < 0.5) {
      return res.status(400).json({ error: 'Bad request', message: 'price must be >= 0.50' });
    }
    if (!category_id) return res.status(400).json({ error: 'Bad request', message: 'category_id is required' });
    if (preparation_time === undefined || preparation_time < 1 || preparation_time > 60) {
      return res.status(400).json({ error: 'Bad request', message: 'preparation_time must be between 1 and 60' });
    }

    const category = await prisma.category.findUnique({ where: { id: category_id } });
    if (!category) return res.status(400).json({ error: 'Bad request', message: 'Category not found' });

    const product = await prisma.product.create({
      data: { name, description, price, category_id, image_url, is_available: is_available ?? true, preparation_time },
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: String(error) });
  }
});

/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     summary: Update a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               is_available:
 *                 type: boolean
 *               preparation_time:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Product updated
 *       404:
 *         description: Product not found
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Not found', message: 'Product not found' });

    const { name, description, price, category_id, image_url, is_available, preparation_time } = req.body;

    if (price !== undefined && price < 0.5) {
      return res.status(400).json({ error: 'Bad request', message: 'price must be >= 0.50' });
    }
    if (preparation_time !== undefined && (preparation_time < 1 || preparation_time > 60)) {
      return res.status(400).json({ error: 'Bad request', message: 'preparation_time must be between 1 and 60' });
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(category_id !== undefined && { category_id }),
        ...(image_url !== undefined && { image_url }),
        ...(is_available !== undefined && { is_available }),
        ...(preparation_time !== undefined && { preparation_time }),
      },
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: String(error) });
  }
});

/**
 * @swagger
 * /products/{id}/availability:
 *   patch:
 *     summary: Toggle product availability
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Availability toggled
 *       404:
 *         description: Product not found
 */
router.patch('/:id/availability', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Not found', message: 'Product not found' });

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { is_available: !existing.is_available },
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: String(error) });
  }
});

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Product deleted
 *       404:
 *         description: Product not found
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Not found', message: 'Product not found' });

    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: String(error) });
  }
});

export default router;
