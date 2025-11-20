import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { SignupPage } from './pages/SignupPage.jsx';
import { CreateDesignPage } from './pages/CreateDesignPage.jsx';
import { MyDesignsPage } from './pages/MyDesignsPage.jsx';
import { DesignDetailPage } from './pages/DesignDetailPage.jsx';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/create" element={<CreateDesignPage />} />
            <Route path="/designs" element={<MyDesignsPage />} />
            <Route path="/designs/:id" element={<DesignDetailPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
