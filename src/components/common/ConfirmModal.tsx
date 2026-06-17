import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  isDestructive = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-inverse-surface/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0 cursor-pointer" onClick={onCancel} />
      
      <div 
        className="relative bg-surface rounded-2xl shadow-xl border border-outline-variant/30 p-6 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-xl flex-shrink-0 ${isDestructive ? 'bg-error-container text-error' : 'bg-primary-container text-primary'}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
              {isDestructive ? 'warning' : 'help'}
            </span>
          </div>
          <h3 className="headline-sm text-on-surface">{title}</h3>
        </div>
        
        <p className="body-md text-on-surface-variant mb-8 pl-1">
          {message}
        </p>
        
        <div className="flex gap-3 justify-end">
          <button 
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-outline-variant/50 text-on-surface hover:bg-surface-container-high hover:border-outline-variant transition-colors label-md font-semibold"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl shadow-sm hover:opacity-90 transition-all active:scale-[0.98] label-md font-semibold ${
              isDestructive 
                ? 'bg-error text-on-error' 
                : 'bg-primary text-on-primary'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
