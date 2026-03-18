import { Router, Request, Response } from 'express';
import { PrismaClient } from '../generated/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         display_order:
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
 * /categories:
 *   get:
 *     summary: List all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories ordered by display_order
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { display_order: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: String(error) });
  }
});

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get category with its products
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category with products
 *       404:
 *         description: Category not found
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: { products: true },
    });
    if (!category) return res.status(404).json({ error: 'Not found', message: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: String(error) });
  }
});

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a category
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               display_order:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Category created
 *       400:
 *         description: Bad request
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, display_order } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Bad request', message: 'name is required' });
    }
    const category = await prisma.category.create({
      data: { name, description, display_order: display_order ?? 0 },
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: String(error) });
  }
});

/**
 * @swagger
 * /categories/{id}:
 *   patch:
 *     summary: Update a category
 *     tags: [Categories]
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
 *               display_order:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Category updated
 *       404:
 *         description: Category not found
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, display_order } = req.body;
    const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Not found', message: 'Category not found' });

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(display_order !== undefined && { display_order }),
      },
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: String(error) });
  }
});

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete a category (only if empty)
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Category deleted
 *       400:
 *         description: Category has products
 *       404:
 *         description: Category not found
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: { products: true },
    });
    if (!existing) return res.status(404).json({ error: 'Not found', message: 'Category not found' });
    if (existing.products.length > 0) {
      return res.status(400).json({ error: 'Bad request', message: 'Cannot delete category with products' });
    }
    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: String(error) });
  }
});

export default router;
