import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    const { hasError, error } = this.state;
    if (hasError) {
      let errorMessage = 'Ocorreu um erro inesperado no sistema.';
      
      try {
        const parsedError = JSON.parse(error?.message || '');
        if (parsedError.error && parsedError.error.includes('Missing or insufficient permissions')) {
          errorMessage = 'Erro de Permissão: Você não tem autorização para realizar esta operação ou acessar estes dados.';
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center border-t-8 border-red-500">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
              <AlertTriangle className="text-red-600" size={40} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 uppercase mb-4">Falha no Sistema</h2>
            <p className="text-gray-600 font-bold mb-8">{errorMessage}</p>
            <Button 
              variant="primary" 
              size="lg" 
              className="w-full"
              onClick={() => window.location.reload()}
            >
              Recarregar Aplicativo
            </Button>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-8 p-4 bg-gray-100 rounded-xl text-[10px] text-left overflow-auto max-h-40">
                {error?.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
