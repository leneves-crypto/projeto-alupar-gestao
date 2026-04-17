import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X, Check } from 'lucide-react';
import { Button } from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'destructive' | 'success';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'primary'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#001a33]/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-100"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  variant === 'destructive' ? 'bg-red-100 text-red-600' :
                  variant === 'success' ? 'bg-green-100 text-green-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  <AlertTriangle size={24} />
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <h3 className="text-xl font-black text-[#001a33] uppercase tracking-tight mb-2">
                {title}
              </h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">
                {message}
              </p>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <Button
                variant="ghost"
                className="flex-1 font-bold uppercase text-xs tracking-widest"
                onClick={onClose}
              >
                {cancelLabel}
              </Button>
              <Button
                variant={variant === 'destructive' ? 'danger' : variant === 'success' ? 'success' : 'primary'}
                className="flex-1 font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-200"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
