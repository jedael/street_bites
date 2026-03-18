import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import MenuPage from './pages/MenuPage'
import CartPage from './pages/CartPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import KitchenPage from './pages/KitchenPage'
import { CartProvider } from './context/CartContext'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <nav className="navbar">
          <div className="container navbar-inner">
            <Link to="/" className="brand">🍔 Street Bites</Link>
            <div className="nav-links">
              <Link to="/">Menu</Link>
              <Link to="/cart">Panier</Link>
              <Link to="/kitchen">Cuisine</Link>
            </div>
          </div>
        </nav>
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
