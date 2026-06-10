import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { aiService } from '@/config/setup';
import type { ChatMessage } from '@/services/AiService';
import { useAppStore } from '@/store/useAppStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface AdminSubNavProps {
  activeId: string;
  onItemClick: (id: string) => void;
  isAdmin?: boolean;
}

export const AdminSubNav: React.FC<AdminSubNavProps> = ({ activeId, onItemClick, isAdmin }) => {
  const isChatOpen = useAppStore((state) => state.isChatOpen);
  const setIsChatOpen = useAppStore((state) => state.setIsChatOpen);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = { role: 'user', content: text };
    const assistantMsgIndex = messages.length + 1; // It will be placed after userMsg
    
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '' }]);
    setInputValue('');
    setIsLoading(true);

    try {
      await aiService.askStream(text, messages, (chunk) => {
        setIsLoading(false); // Stop loading animation once first chunk arrives
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[assistantMsgIndex].content += chunk;
          return newMessages;
        });
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al contactar al asistente';
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[assistantMsgIndex].content = `⚠️ ${msg}`;
        return newMessages;
      });
      setIsLoading(false);
    }
  }, [messages]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || isLoading) return;
    sendMessage(text);
  }, [inputValue, isLoading, sendMessage]);

  const handleSuggestion = useCallback((text: string) => {
    sendMessage(text);
  }, [sendMessage]);
  const items: NavItem[] = useMemo(() => {
    const list: NavItem[] = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        ),
      },
      {
        id: 'productos',
        label: 'Productos',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
        ),
      },
      {
        id: 'categorias',
        label: 'Categorías',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
        ),
      },
      {
        id: 'inventario',
        label: 'Proveedores',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25v11.25m0-11.25h-3.75v11.25m0-11.25H6.75m3.75 0H6.75M6.75 7.5v11.25M6.75 7.5h-3.75" />
          </svg>
        ),
      },
      {
        id: 'ventas',
        label: 'Ventas',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
    ];

    if (isAdmin) {
      list.push(
        {
          id: 'reportes',
          label: 'Reportes',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          ),
        },
        {
          id: 'usuarios',
          label: 'Usuarios',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          ),
        },
        {
          id: 'mantenimiento',
          label: 'Mantenimiento',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.75 5.75a1.5 1.5 0 01-2.12 0L2.08 14.45a1.5 1.5 0 010-2.12l5.75-5.75m4.24 4.24l5.75-5.75a1.5 1.5 0 012.12 0l1.47 1.47a1.5 1.5 0 010 2.12l-5.75 5.75M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
        {
          id: 'actividad',
          label: 'Actividad',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        }
      );
    }

    list.push({
      id: 'ajustes',
      label: 'Ajustes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    });

    return list;
  }, [isAdmin]);

  return (
    <>
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full z-40 w-56 bg-surface border-r border-outline-variant/50 pt-16 shadow-sm">
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center px-5 border-b border-outline-variant/30">
          <img src="/img/logo-kiora-vectorizado.svg" alt="Kiora Logo" className="h-8 object-contain" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {items.map((item) => {
            const active = activeId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                  active
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* AI Agent */}
        <div className="px-4 py-4 mt-auto">
          <div
            onClick={() => setIsChatOpen(true)}
            className="group relative flex flex-col gap-3 p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest cursor-pointer transition-all duration-300 hover:border-on-surface/20 hover:bg-surface-container-low"
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-on-surface/0 via-on-surface/0 to-on-surface/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            <div className="flex items-center justify-between z-10">
              <div className="w-10 h-10 rounded-lg bg-surface border border-outline-variant/50 flex items-center justify-center text-on-surface shadow-sm group-hover:shadow transition-all">
                <span className="material-symbols-outlined font-light text-[22px]">support_agent</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-outline-variant/30 bg-surface/50">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse"></div>
                <span className="text-[9px] font-medium text-on-surface-variant tracking-widest uppercase">Online</span>
              </div>
            </div>

            <div className="z-10 mt-1">
              <h4 className="text-sm font-semibold text-on-surface tracking-wide">Kiora AI</h4>
              <p className="text-xs text-on-surface-variant/70 mt-0.5">Asistente Operativo</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-outline-variant/30 shrink-0">
          <p className="text-[10px] font-medium text-on-surface-variant">Kiora v2.0</p>
        </div>
      </aside>

      {/* ─── AI CHAT POPOVER ─── */}
      {isChatOpen && (
        <div className="fixed inset-0 z-[200] pointer-events-none">
          <div
            className="absolute inset-0 pointer-events-auto"
            onClick={() => setIsChatOpen(false)}
          ></div>
          {/* Popover Window */}
          <div className="absolute md:left-[240px] md:bottom-[24px] md:w-[380px] md:h-[600px] md:max-h-[85vh] left-4 right-4 bottom-24 top-20 bg-surface rounded-[20px] border border-outline-variant/30 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] flex flex-col animate-in zoom-in-75 slide-in-from-bottom-8 duration-300 overflow-hidden origin-bottom-left pointer-events-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/20 bg-surface-container-lowest shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-container-low border border-outline-variant/50 flex items-center justify-center text-on-surface">
                  <span className="material-symbols-outlined">support_agent</span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-on-surface tracking-wide">Kiora AI</h3>
                  <p className="text-[10px] text-on-surface-variant">DeepSeek</p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-surface-container-lowest/50">
              {messages.length === 0 && !isLoading && (
                <>
                  {/* System welcome */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/30 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[16px] text-on-surface">auto_awesome</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="bg-surface border border-outline-variant/30 rounded-2xl rounded-tl-sm p-3 shadow-sm max-w-[85%]">
                        <p className="text-sm text-on-surface leading-relaxed">
                          Hola. Soy Kiora AI, tu asistente operativo. ¿En qué puedo ayudarte a optimizar tu negocio hoy?
                        </p>
                      </div>
                      <span className="text-[10px] text-on-surface-variant/60 ml-1">Justo ahora</span>
                    </div>
                  </div>

                  {/* Suggested prompts */}
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={() => handleSuggestion('Analizar ventas de hoy')}
                      className="text-left px-4 py-3 rounded-xl border border-outline-variant/30 text-xs text-on-surface-variant hover:bg-surface-container hover:text-on-surface hover:border-outline-variant transition-colors flex items-center justify-between group shadow-sm"
                    >
                      Analizar ventas de hoy
                      <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                    </button>
                    <button
                      onClick={() => handleSuggestion('Sugerir pedidos de inventario')}
                      className="text-left px-4 py-3 rounded-xl border border-outline-variant/30 text-xs text-on-surface-variant hover:bg-surface-container hover:text-on-surface hover:border-outline-variant transition-colors flex items-center justify-between group shadow-sm"
                    >
                      Sugerir pedidos de inventario
                      <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                    </button>
                  </div>
                </>
              )}

              {/* Messages */}
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/30 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[16px] text-on-surface">auto_awesome</span>
                    </div>
                  )}
                  <div className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : ''}`}>
                    <div className={`rounded-2xl p-3 shadow-sm max-w-[90%] ${
                      msg.role === 'user'
                        ? 'bg-primary text-on-primary rounded-tr-sm'
                        : 'bg-surface border border-outline-variant/30 rounded-tl-sm'
                    }`}>
                      {msg.role === 'user' ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="text-sm leading-relaxed w-full">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({node, ...props}) => <h1 className="text-lg font-bold mt-4 mb-2 text-on-surface" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-base font-bold mt-3 mb-2 text-on-surface" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-sm font-bold mt-2 mb-1 text-on-surface" {...props} />,
                              p: ({node, ...props}) => <p className="mb-2 last:mb-0 whitespace-pre-wrap text-on-surface-variant" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 space-y-1 text-on-surface-variant" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 space-y-1 text-on-surface-variant" {...props} />,
                              li: ({node, ...props}) => <li className="" {...props} />,
                              table: ({node, ...props}) => (
                                <div className="overflow-x-auto my-3 border border-outline-variant/30 rounded-lg">
                                  <table className="w-full text-left border-collapse text-[11px] md:text-xs" {...props} />
                                </div>
                              ),
                              thead: ({node, ...props}) => <thead className="bg-surface-container-highest border-b border-outline-variant/30" {...props} />,
                              th: ({node, ...props}) => <th className="p-2 font-semibold text-on-surface" {...props} />,
                              td: ({node, ...props}) => <td className="p-2 border-b border-outline-variant/10 text-on-surface-variant" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-bold text-on-surface" {...props} />,
                              em: ({node, ...props}) => <em className="italic" {...props} />,
                              hr: ({node, ...props}) => <hr className="my-4 border-outline-variant/30" {...props} />,
                              code: ({node, inline, className, children, ...props}: any) => inline 
                                ? <code className="bg-surface-container-high px-1 py-0.5 rounded text-[11px] text-primary font-mono" {...props}>{children}</code>
                                : <pre className="block bg-surface-container-highest p-2 rounded-lg text-[11px] overflow-x-auto mb-2 font-mono"><code {...props}>{children}</code></pre>,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/30 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[16px] text-on-surface">auto_awesome</span>
                  </div>
                  <div className="bg-surface border border-outline-variant/30 rounded-2xl rounded-tl-sm p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-on-surface-variant/40 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-on-surface-variant/40 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-on-surface-variant/40 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-5 border-t border-outline-variant/20 bg-surface shrink-0">
              <form onSubmit={handleSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Escribe un comando o pregunta..."
                  disabled={isLoading}
                  className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-[20px] pl-5 pr-14 py-3.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-on-surface/40 focus:ring-1 focus:ring-on-surface/40 transition-all shadow-sm disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="absolute right-2 w-8 h-8 rounded-full bg-on-surface text-surface flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                </button>
              </form>
              <p className="text-[9px] text-center text-on-surface-variant/50 mt-3">
                Kiora AI puede cometer errores. Verifica la información importante.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── MOBILE BOTTOM NAV ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-outline-variant/50 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-between px-2 py-2.5 overflow-x-auto no-scrollbar">
          {items.filter(i => i.id !== 'actividad').map((item) => {
            const active = activeId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                onClick={() => onItemClick(item.id)}
                className={`relative flex flex-col items-center justify-center p-1.5 min-w-0 transition-all duration-200 active:scale-95 ${
                  active ? 'text-primary' : 'text-on-surface-variant/60'
                }`}
              >
                <div className={`flex items-center justify-center transition-transform duration-200 ${
                  active ? 'scale-110 drop-shadow-sm' : 'hover:scale-105'
                }`}>
                  {item.icon}
                </div>
                {active && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
