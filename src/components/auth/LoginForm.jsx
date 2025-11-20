import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '../../services/authService.js';
import { Button } from '../common/Button.jsx';
import { Input } from '../common/Input.jsx';
import { ErrorMessage } from '../common/ErrorMessage.jsx';

export function LoginForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validate()) return;

    setLoading(true);

    try {
      await signIn(formData.email, formData.password);
      // Redirect to home page on success
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);

      // Handle specific Firebase error codes
      let message = 'Failed to sign in. Please try again.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        message = 'Invalid email or password';
      } else if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later.';
      }

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ErrorMessage message={errorMessage} onClose={() => setErrorMessage('')} />

      <Input
        label="Email"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        required
        placeholder="your.email@example.com"
        autoComplete="email"
      />

      <Input
        label="Password"
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        required
        placeholder="Enter your password"
        autoComplete="current-password"
      />

      <Button
        type="submit"
        loading={loading}
        className="w-full"
      >
        Sign In
      </Button>
    </form>
  );
}
