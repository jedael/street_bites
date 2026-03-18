import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import MenuPage from './pages/MenuPage'
import CartPage from './pages/CartPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import KitchenPage from './pages/KitchenPage'
import { CartProvider, useCart } from './context/CartContext'
import './App.css'

function Navigation() {
  const { itemCount } = useCart()

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">🍔 Street Bites</Link>
        <div className="nav-links">
          <Link to="/">Menu</Link>
          <Link to="/cart" className="cart-link">
            Panier
            {itemCount > 0 && (
              <span className="cart-badge">{itemCount}</span>
            )}
          </Link>
          <Link to="/kitchen">Cuisine</Link>
        </div>
      </div>
    </nav>
  )
}

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Navigation />
        <Routes>
          <Route path="/" element={<MenuPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/order/:id" element={<OrderConfirmationPage />} />
          <Route path="/kitchen" element={<KitchenPage />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  )
}

export default App
