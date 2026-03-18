import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { orderApi, customerApi } from '../api'
import './CartPage.css'

interface OrderHistory {
  id: string
  order_id: string
  total_amount: number
  items_count: number
  created_at: string
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart()
  const navigate = useNavigate()

  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [history, setHistory] = useState<OrderHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const lookupCustomer = async () => {
    if (!customerEmail) return
    try {
      const res = await customerApi.get(`/customers/email/${customerEmail}`)
      const customer = res.data
      setCustomerName(customer.name)
      setCustomerPhone(customer.phone || '')
      // Fetch order history
      const histRes = await customerApi.get(`/customers/${customer.id}/orders`)
      setHistory(histRes.data)
    } catch {
      setHistory([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return
    setLoading(true)
    setError('')

    try {
      const res = await orderApi.post('/orders', {
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: customerPhone || undefined,
        items: items.map(i => ({ product_id: i.product.id, quantity: i.quantity })),
      })
      clearCart()
      navigate(`/order/${res.data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la commande')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container cart-page">
      <h1>Mon Panier</h1>
      <div className="cart-layout">
        <div className="cart-items">
          {items.length === 0 ? (
            <div className="cart-empty-inline">
              <p>Votre panier est vide.</p>
              <a href="/">Retour au menu</a>
            </div>
          ) : (
            <>
              {items.map(item => (
                <div key={item.product.id} className="cart-item">
                  <div className="item-info">
                    <h3>{item.product.name}</h3>
                    <span>{item.product.price.toFixed(2)}€/unité</span>
                  </div>
                  <div className="item-controls">
                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                    <span className="item-subtotal">{(item.product.price * item.quantity).toFixed(2)}€</span>
                    <button className="remove-btn" onClick={() => removeItem(item.product.id)}>✕</button>
                  </div>
                </div>
              ))}
              <div className="cart-total">
                <strong>Total : {total.toFixed(2)}€</strong>
              </div>
            </>
          )}
        </div>

        <div className="checkout-form">
          <h2>Vos informations</h2>
          <form onSubmit={handleSubmit}>
            <label>
              Email *
              <input
                type="email"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                onBlur={lookupCustomer}
                required
                placeholder="votre@email.com"
              />
            </label>
            <label>
              Nom *
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                required={items.length > 0}
                placeholder="Votre nom"
              />
            </label>
            <label>
              Téléphone
              <input
                type="tel"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="06 xx xx xx xx"
              />
            </label>

            {error && <p className="error-msg">{error}</p>}

            {items.length > 0 && (
              <button type="submit" disabled={loading} className="order-btn">
                {loading ? 'Commande en cours...' : `Commander — ${total.toFixed(2)}€`}
              </button>
            )}
          </form>

          {history.length > 0 && (
            <div className="history">
              <h3>Vos commandes précédentes</h3>
              {history.map(h => (
                <div key={h.id} className="history-item">
                  <span>{new Date(h.created_at).toLocaleDateString('fr-FR')}</span>
                  <span>{h.items_count} article{h.items_count > 1 ? 's' : ''}</span>
                  <span>{h.total_amount.toFixed(2)}€</span>
                </div>
              ))}
            </div>
          )}

          {history.length === 0 && customerEmail && customerName === '' && (
            <p className="no-history">Aucun historique pour cet email.</p>
          )}
        </div>
      </div>
    </div>
  )
}
