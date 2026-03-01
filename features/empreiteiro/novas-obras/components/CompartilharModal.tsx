'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CompartilharModalProps {
  open: boolean;
  onClose: () => void;
  obraTitulo: string;
}

const SHARE_OPTIONS = [
  {
    id: 'copiar',
    label: 'Copiar link',
    icon: 'link',
    bg: 'bg-gray-100 dark:bg-gray-800',
    iconColor: 'text-gray-700 dark:text-gray-300',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: 'chat',
    bg: 'bg-green-50 dark:bg-green-900/20',
    iconColor: 'text-green-600',
  },
  {
    id: 'telegram',
    label: 'Telegram',
    icon: 'send',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-500',
  },
];

export function CompartilharModal({ open, onClose, obraTitulo }: CompartilharModalProps) {
  const [copied, setCopied] = useState(false);

  const handleOption = useCallback(async (id: string) => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Veja esta obra: ${obraTitulo}`;

    if (id === 'copiar') {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // fallback: do nothing
      }
      return;
    }

    if (id === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, '_blank');
    } else if (id === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
    }

    onClose();
  }, [obraTitulo, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-gray-800">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Compartilhar obra</h3>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{obraTitulo}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-600"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-2">
                {SHARE_OPTIONS.map((option) => {
                  const isCopied = option.id === 'copiar' && copied;
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOption(option.id)}
                      className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left w-full group"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${option.bg}`}>
                        <span className={`material-symbols-outlined ${option.iconColor}`}>
                          {isCopied ? 'check_circle' : option.icon}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {isCopied ? 'Link copiado!' : option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
