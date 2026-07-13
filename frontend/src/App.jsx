import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import StockInsights from './pages/StockInsights';
import Compare from './pages/Compare';
import Portfolio from './pages/Portfolio';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AIChatWidget from './components/AIChatWidget';
import TickerTape from './components/TickerTape';
import { CurrencyProvider } from './context/CurrencyContext';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [theme, setTheme] = useState('dark');
  const navigate = useNavigate();
  const location = useLocation();

  const handleStockSelect = (ticker) => {
    setSelectedTicker(ticker);
    navigate('/stockinsights');
  };

  useEffect(() => {
    localStorage.setItem('theme', 'dark');
    document.documentElement.classList.add('dark');
  }, []);

  const toggleTheme = () => { /* Theme is locked to dark mode for premium feel */ };

  return (
    <CurrencyProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="bg-[var(--bg-primary)] min-h-screen text-[var(--text-main)] font-sans flex overflow-hidden transition-colors duration-300 w-full">
                <Sidebar
                  isOpen={isSidebarOpen}
                  setIsOpen={setIsSidebarOpen}
                  theme={theme}
                />

                <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'} h-screen w-full`}>
                  <TickerTape />
                  <Navbar
                    theme={theme}
                    toggleTheme={toggleTheme}
                    onStockSelect={handleStockSelect}
                    toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                  />
                  <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth no-scrollbar w-full">
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard theme={theme} />} />
                      <Route path="/stockinsights" element={<StockInsights theme={theme} selectedTicker={selectedTicker} />} />
                      <Route path="/compare" element={<Compare theme={theme} />} />
                      <Route path="/portfolio" element={<Portfolio theme={theme} />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </main>

                  {/* Global Overlays */}
                  <AIChatWidget />
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </CurrencyProvider>
  );
}

export default App;
