import express from 'express';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import categoriesRouter from './routes/categories';
import productsRouter from './routes/products';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Menu Service API',
      version: '1.0.0',
      description: 'API for managing food truck menu categories and products',
    },
    servers: [{ url: `http://localhost:${PORT}` }],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/categories', categoriesRouter);
app.use('/products', productsRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'menu-service' });
});

app.listen(PORT, () => {
  console.log(`Menu Service running on http://localhost:${PORT}`);
  console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
});

export default app;
