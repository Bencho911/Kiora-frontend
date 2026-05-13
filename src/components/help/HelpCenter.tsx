import { useState, useMemo } from 'react';
import { HELP_FAQS, HELP_TOPICS } from './helpContent';
import { authService } from '@/config/setup';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Search, ChevronLeft, Mail, Phone, LifeBuoy } from 'lucide-react';

interface HelpCenterProps {
  hideBackButton?: boolean;
}

export default function HelpCenter({ hideBackButton = false }: HelpCenterProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchTerm, setSearchTerm] = useState('');

  const handleBack = () => {
    if (authService.isAuthenticated()) {
      window.location.href = '/panel';
    } else {
      window.location.href = '/login/';
    }
  };

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const filteredFaqIndices = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const faqs = Array.isArray(HELP_FAQS) ? HELP_FAQS : [];
    if (!q) return faqs.map((_, i) => i);
    return faqs.map((faq, i) => ({ faq, i }))
      .filter(({ faq }) => faq.question.toLowerCase().includes(q) || faq.answer.toLowerCase().includes(q))
      .map(({ i }) => i);
  }, [searchTerm]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-24 relative animate-in fade-in duration-500">
      {!hideBackButton && (
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mt-6 flex items-center gap-2 text-slate-400 hover:text-[#ec131e] transition-all group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[12px] font-black uppercase tracking-widest">Volver</span>
        </Button>
      )}

      <div className="mb-12 text-center pt-8">
        <h1 className="text-4xl font-black text-[#111827] tracking-tight mb-4">¿En qué podemos <span className="text-[#ec131e]">ayudarte</span>?</h1>
        <p className="text-slate-500 mb-8 font-medium">Encuentra soluciones rápidas o contacta con nuestro equipo técnico.</p>
        
        <div className="relative max-w-2xl mx-auto group">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#ec131e] transition-colors" />
          <Input
            placeholder="Busca un tema, pregunta o funcionalidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-14 pl-12 pr-6 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-[#ec131e]/5 transition-all text-base shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-6 bg-[#ec131e] rounded-full" />
              <h2 className="text-xl font-black text-[#111827]">Preguntas Frecuentes</h2>
            </div>
            
            {filteredFaqIndices.length === 0 ? (
              <div className="bg-slate-50 p-8 rounded-3xl border border-dashed border-slate-200 text-center">
                <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-bold">No hay resultados para «{searchTerm}»</p>
                <p className="text-sm text-slate-400 mt-1">Intenta con términos más generales como "inventario" o "venta".</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFaqIndices.map((faqIndex) => {
                  const faq = HELP_FAQS[faqIndex];
                  const isActive = openIndex === faqIndex;
                  return (
                    <Card 
                      key={faqIndex}
                      className={`overflow-hidden transition-all duration-300 border-none shadow-md hover:shadow-lg ${isActive ? 'ring-2 ring-[#ec131e]/20' : ''}`}
                    >
                      <button
                        onClick={() => toggleFaq(faqIndex)}
                        className="w-full px-6 py-5 text-left flex justify-between items-center group bg-white"
                      >
                        <span className={`font-bold text-[15px] transition-colors ${isActive ? 'text-[#ec131e]' : 'text-slate-700'}`}>
                          {faq.question}
                        </span>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-[#ec131e] text-white rotate-180' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </button>
                      <div className={`px-6 text-slate-500 text-[14px] leading-relaxed transition-all duration-300 ease-in-out overflow-hidden ${isActive ? 'pb-6 pt-2 max-h-96' : 'max-h-0'}`}>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          {faq.answer}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>


        </div>

        <aside className="space-y-8">
          <Card className="border-none shadow-xl shadow-slate-100/50 rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="bg-[#111827] text-white py-8">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                <LifeBuoy className="w-6 h-6 text-[#ec131e]" />
              </div>
              <CardTitle className="text-xl font-black">¿Necesitas más?</CardTitle>
              <CardDescription className="text-slate-400 font-medium">Contáctanos directamente</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-[#ec131e]/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#ec131e] shadow-sm group-hover:scale-110 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email Soporte</p>
                    <p className="text-sm font-bold text-slate-900">soporte@kiora.app</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-emerald-300 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm group-hover:scale-110 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">WhatsApp</p>
                    <p className="text-sm font-bold text-slate-900">+57 321 532 2886</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2">Temas Populares</h3>
            <div className="grid grid-cols-1 gap-3">
              {HELP_TOPICS.slice(0, 4).map((topic, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-slate-200 transition-all cursor-pointer shadow-sm">
                  <div className="text-[#ec131e] shrink-0">{topic.icon}</div>
                  <span className="font-bold text-slate-700 text-sm leading-tight">{topic.title}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
