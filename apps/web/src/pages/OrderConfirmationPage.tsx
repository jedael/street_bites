import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { orderApi, Order } from '../api'
import './OrderConfirmationPage.css'

const STATUS_LABELS: Record<string, string> = {
  pending: '⏳ En attente',
  confirmed: '✅ Confirmée',
  preparing: '👨‍🍳 En préparation',
  ready: '🎉 Prête !',
  completed: '✓ Terminée',
  cancelled: '❌ Annulée',
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#888',
  confirmed: '#2196F3',
  preparing: '#FF9800',
  ready: '#4CAF50',
  completed: '#4CAF50',
  cancelled: '#f44336',
}

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchOrder = useCallback(async () => {
    try {
      const res = await orderApi.get(`/orders/${id}`)
      setOrder(res.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchOrder()
    const interval = setInterval(fetchOrder, 10000)
    return () => clearInterval(interval)
  }, [fetchOrder])

  if (loading) return <div className="loading">Chargement...</div>
  if (!order) return <div className="container"><p>Commande introuvable.</p></div>

  const estimatedTime = order.estimated_ready_at
    ? new Date(order.estimated_ready_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="container confirmation-page">
      <div className="confirmation-card">
        <h1>Commande #{order.id.slice(0, 8)}</h1>

        <div className="status-badge" style={{ background: STATUS_COLORS[order.status] || '#888' }}>
          {STATUS_LABELS[order.status] || order.status}
        </div>

        {estimatedTime && order.status !== 'completed' && order.status !== 'cancelled' && (
          <div className="estimated-time">
            <p>Prête vers</p>
            <strong>{estimatedTime}</strong>
          </div>
        )}

        <div className="order-summary">
          <h2>Récapitulatif</h2>
          {order.items.map(item => (
            <div key={item.id} className="order-item">
              <span>{item.product_name} × {item.quantity}</span>
              <span>{item.subtotal.toFixed(2)}€</span>
            </div>
          ))}
          <div className="order-total">
            <strong>Total</strong>
            <strong>{order.total_amount.toFixed(2)}€</strong>
          </div>
        </div>

        <div className="customer-info">
          <p><strong>Client :</strong> {order.customer_name}</p>
          <p><strong>Email :</strong> {order.customer_email}</p>
        </div>

        <p className="refresh-note">La page se rafraîchit automatiquement toutes les 10 secondes.</p>

        <a href="/" className="back-btn">← Retour au menu</a>
      </div>
    </div>
  )
}
