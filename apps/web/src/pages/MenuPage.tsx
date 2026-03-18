import { useEffect, useState } from 'react'
import { menuApi, Category, Product } from '../api'
import { useCart } from '../context/CartContext'
import { Link } from 'react-router-dom'
import './MenuPage.css'

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const { addItem, itemCount, total } = useCart()

  useEffect(() => {
    menuApi.get('/categories')
      .then(async res => {
        const cats: Category[] = res.data
        const withProducts = await Promise.all(
          cats.map(async c => {
            const pRes = await menuApi.get(`/categories/${c.id}`)
            return pRes.data as Category
          })
        )
        setCategories(withProducts)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Chargement du menu...</div>

  return (
    <div className="menu-page">
      <div className="container">
        <h1>Notre Menu</h1>
        {categories.map(cat => (
          <section key={cat.id} className="category-section">
            <h2>{cat.name}</h2>
            {cat.description && <p className="category-desc">{cat.description}</p>}
            <div className="products-grid">
              {cat.products?.map(product => (
                <ProductCard key={product.id} product={product} onAdd={addItem} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {itemCount > 0 && (
        <div className="floating-cart">
          <Link to="/cart" className="cart-btn">
            🛒 {itemCount} article{itemCount > 1 ? 's' : ''} — {total.toFixed(2)}€
          </Link>
        </div>
      )}
    </div>
  )
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: (p: Product) => void }) {
  return (
    <div className={`product-card ${!product.is_available ? 'unavailable' : ''}`}>
      <div className="product-info">
        <h3>{product.name}</h3>
        {product.description && <p>{product.description}</p>}
        <div className="product-meta">
          <span className="price">{product.price.toFixed(2)}€</span>
          <span className="prep-time">⏱ {product.preparation_time} min</span>
        </div>
      </div>
      <button
        className="add-btn"
        onClick={() => onAdd(product)}
        disabled={!product.is_available}
      >
        {product.is_available ? '+ Ajouter' : 'Indisponible'}
      </button>
    </div>
  )
}
