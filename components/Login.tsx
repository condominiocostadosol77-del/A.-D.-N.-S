import React, { useState } from 'react';
import { UserPlus, LogIn, Church } from 'lucide-react';
import * as storage from '../services/storage';

interface LoginProps {
  onLogin: (email: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isRegistering) {
        if (!name) {
          setError('Por favor, informe o nome.');
          setIsLoading(false);
          return;
        }
        
        const success = await storage.registerUser({
          name,
          email,
          password
        });

        if (success) {
          onLogin(email);
        } else {
          setError('Este email já está cadastrado.');
          setIsLoading(false);
        }
      } else {
        const user = await storage.loginUser(email, password);
        
        if (user) {
          onLogin(user.email);
        } else {
          setError('Email ou senha inválidos. Tente novamente ou cadastre-se.');
          setIsLoading(false);
        }
      }
    } catch (err) {
      setError('Ocorreu um erro. Tente novamente.');
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setEmail('');
    setPassword('');
    setName('');
  };

  return (
    <div className="min-h-screen bg-emerald-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-8 text-center bg-emerald-800 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-emerald-700/30 opacity-20 transform -skew-y-12 scale-150"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="inline-flex p-4 rounded-full bg-amber-500 mb-6 shadow-lg ring-4 ring-white/10">
              <Church className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-xl md:text-2xl font-serif font-bold mb-2 uppercase tracking-wide">
              A. D. NATIVIDADE DA SERRA
            </h1>
            <p className="text-emerald-200 text-sm">
              {isRegistering ? 'Crie sua conta administrativa' : 'Gestão Eclesiástica Simplificada'}
            </p>
          </div>
        </div>
        
        <div className="p-8 flex-1">
          {/* Default Login Hint */}
          {!isRegistering && (
             <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                <p className="font-bold mb-1">Acesso Padrão:</p>
                <p>Email: <strong>admin@igreja.com</strong></p>
                <p>Senha: <strong>admin</strong></p>
             </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div className="animate-fade-in-down">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Igreja ou Admin</label>
                <input 
                  type="text" 
                  required={isRegistering}
                  placeholder="Ex: Igreja Batista Central"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input 
                type="email" 
                required 
                placeholder="admin@igreja.com"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <input 
                type="password" 
                required 
                placeholder="••••••"
                minLength={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                {error}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={isLoading}
              className={`
                w-full py-3 rounded-lg font-bold text-lg text-white shadow-lg transition-all transform hover:-translate-y-0.5
                flex items-center justify-center gap-2
                ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-xl'}
              `}
            >
              {isLoading ? (
                'Processando...'
              ) : (
                <>
                  {isRegistering ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                  {isRegistering ? 'Cadastrar Conta' : 'Acessar Sistema'}
                </>
              )}
            </button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <button 
              type="button"
              onClick={toggleMode}
              className="text-sm text-emerald-700 hover:text-emerald-900 font-medium hover:underline transition-colors"
            >
              {isRegistering 
                ? 'Já possui uma conta? Faça Login.' 
                : 'Ainda não tem conta? Cadastre-se gratuitamente.'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;