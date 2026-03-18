import { useEffect, useState } from 'react'
import { orderApi, menuApi, Order, Category, Product } from '../api'
import './KitchenPage.css'

const STATUS_FLOW: Record<string, string> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'completed',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready: 'Prête',
  completed: 'Terminée',
  cancelled: 'Annulée',
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [activeTab, setActiveTab] = useState<'queue' | 'menu'>('queue')
  const [newCatName, setNewCatName] = useState('')
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category_id: '', preparation_time: '15', description: '' })

  const fetchOrders = () => {
    orderApi.get('/orders/queue').then(res => setOrders(res.data))
  }

  const fetchMenu = () => {
    menuApi.get('/categories').then(res => setCategories(res.data))
    menuApi.get('/products').then(res => setProducts(res.data))
  }

  useEffect(() => {
    fetchOrders()
    fetchMenu()
    const interval = setInterval(fetchOrders, 15000)
    return () => clearInterval(interval)
  }, [])

  const advanceStatus = async (order: Order) => {
    const next = STATUS_FLOW[order.status]
    if (!next) return
    await orderApi.patch(`/orders/${order.id}/status`, { status: next })
    fetchOrders()
  }

  const cancelOrder = async (order: Order) => {
    await orderApi.post(`/orders/${order.id}/cancel`)
    fetchOrders()
  }

  const toggleAvailability = async (product: Product) => {
    await menuApi.patch(`/products/${product.id}/availability`)
    fetchMenu()
  }

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName) return
    await menuApi.post('/categories', { name: newCatName, display_order: categories.length })
    setNewCatName('')
    fetchMenu()
  }

  const deleteCategory = async (id: string) => {
    try {
      await menuApi.delete(`/categories/${id}`)
      fetchMenu()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur')
    }
  }

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    await menuApi.post('/products', {
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      category_id: newProduct.category_id,
      preparation_time: parseInt(newProduct.preparation_time),
      description: newProduct.description || undefined,
      is_available: true,
    })
    setNewProduct({ name: '', price: '', category_id: '', preparation_time: '15', description: '' })
    fetchMenu()
  }

  const deleteProduct = async (id: string) => {
    await menuApi.delete(`/products/${id}`)
    fetchMenu()
  }

  return (
    <div className="kitchen-page">
      <div className="container">
        <h1>Vue Cuisine</h1>
        <div className="tabs">
          <button className={activeTab === 'queue' ? 'active' : ''} onClick={() => setActiveTab('queue')}>
            File de commandes ({orders.length})
          </button>
          <button className={activeTab === 'menu' ? 'active' : ''} onClick={() => setActiveTab('menu')}>
            Gestion du menu
          </button>
        </div>

        {activeTab === 'queue' && (
          <div className="queue-section">
            {orders.length === 0 ? (
              <p className="empty-queue">Aucune commande en cours</p>
            ) : (
              orders.map(order => (
                <div key={order.id} className={`order-card status-${order.status}`}>
                  <div className="order-header">
                    <span className="order-id">#{order.id.slice(0, 8)}</span>
                    <span className={`status-tag status-${order.status}`}>{STATUS_LABELS[order.status]}</span>
                    <span className="customer-name">{order.customer_name}</span>
                  </div>
                  <div className="order-items">
                    {order.items.map(item => (
                      <div key={item.id} className="kitchen-item">
                        <span>{item.product_name}</span>
                        <span>× {item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  {order.estimated_ready_at && (
                    <p className="estimated">Prête à : {new Date(order.estimated_ready_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                  )}
                  <div className="order-actions">
                    {STATUS_FLOW[order.status] && (
                      <button className="advance-btn" onClick={() => advanceStatus(order)}>
                        → {STATUS_LABELS[STATUS_FLOW[order.status]]}
                      </button>
                    )}
                    {['pending', 'confirmed'].includes(order.status) && (
                      <button className="cancel-btn" onClick={() => cancelOrder(order)}>Annuler</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="menu-management">
            <div className="section">
              <h2>Catégories</h2>
              <form className="inline-form" onSubmit={createCategory}>
                <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Nouvelle catégorie" required />
                <button type="submit">Ajouter</button>
              </form>
              <table className="management-table">
                <thead><tr><th>Nom</th><th>Actions</th></tr></thead>
                <tbody>
                  {categories.map(cat => (
                    <tr key={cat.id}>
                      <td>{cat.name}</td>
                      <td>
                        <button className="danger-btn" onClick={() => deleteCategory(cat.id)}>Supprimer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="section">
              <h2>Produits</h2>
              <form className="product-form" onSubmit={createProduct}>
                <input value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} placeholder="Nom du produit" required />
                <input type="number" step="0.01" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} placeholder="Prix (€)" required min="0.5" />
                <select value={newProduct.category_id} onChange={e => setNewProduct(p => ({ ...p, category_id: e.target.value }))} required>
                  <option value="">Catégorie</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input type="number" value={newProduct.preparation_time} onChange={e => setNewProduct(p => ({ ...p, preparation_time: e.target.value }))} placeholder="Temps (min)" min="1" max="60" required />
                <input value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} placeholder="Description (optionnel)" />
                <button type="submit">Ajouter le produit</button>
              </form>

              <table className="management-table">
                <thead><tr><th>Nom</th><th>Prix</th><th>Catégorie</th><th>Disponible</th><th>Actions</th></tr></thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.price.toFixed(2)}€</td>
                      <td>{categories.find(c => c.id === p.category_id)?.name || '—'}</td>
                      <td>
                        <button className={p.is_available ? 'toggle-on' : 'toggle-off'} onClick={() => toggleAvailability(p)}>
                          {p.is_available ? 'Dispo' : 'Indispo'}
                        </button>
                      </td>
                      <td>
                        <button className="danger-btn" onClick={() => deleteProduct(p.id)}>Supprimer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
