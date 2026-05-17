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
    <div className="w-full max-w-6xl mx-auto px-2 pb-24 relative animate-in fade-in duration-500">
      {!hideBackButton && (
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mt-4 flex items-center gap-2 text-slate-400 hover:text-[#ec131e] transition-all group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[12px] font-black uppercase tracking-widest">Volver al Panel</span>
        </Button>
      )}

      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
        <div className="text-left">
          <h1 className="text-3xl sm:text-4xl font-black text-[#111827] tracking-tight mb-1">
            ¿En qué podemos <span className="text-[#ec131e]">ayudarte</span>?
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium">Encuentra soluciones rápidas o contacta soporte.</p>
        </div>

        <div className="relative w-full md:max-w-md group">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#ec131e] transition-colors" />
          <Input
            placeholder="Busca por palabra clave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 pl-11 pr-6 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-[#ec131e]/5 transition-all text-sm shadow-sm font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-[#ec131e] rounded-full" />
                <h2 className="text-lg font-black text-[#111827] uppercase tracking-tight">Preguntas Frecuentes</h2>
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-lg">
                {filteredFaqIndices.length} Temas
              </span>
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
                        className="w-full px-5 py-4 text-left flex justify-between items-center group bg-white"
                      >
                        <span className={`font-black text-sm transition-colors ${isActive ? 'text-[#ec131e]' : 'text-slate-700'}`}>
                          {faq.question}
                        </span>
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-[#ec131e] text-white rotate-180 shadow-lg shadow-kiora-red/20' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600'}`}>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </button>
                      <div className={`px-5 text-slate-500 text-sm leading-relaxed transition-all duration-300 ease-in-out overflow-hidden ${isActive ? 'pb-5 pt-1 max-h-96' : 'max-h-0'}`}>
                        <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100/50 font-medium text-slate-600">
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
          <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-[2rem] bg-white overflow-hidden group/card">
            <CardHeader className="bg-[#111827] text-white py-8 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#ec131e]/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-white/20 group-hover/card:scale-110 transition-transform duration-500">
                <LifeBuoy className="w-6 h-6 text-[#ec131e]" />
              </div>
              <CardTitle className="text-xl font-black tracking-tight">¿Necesitas más?</CardTitle>
              <CardDescription className="text-slate-400 font-medium text-xs">Atención prioritaria para tu tienda</CardDescription>
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
            <div className="grid grid-cols-1 gap-2.5">
              {HELP_TOPICS.slice(0, 4).map((topic, idx) => (
                <div key={idx} className="group flex items-center gap-3 p-3.5 bg-white border border-slate-100 rounded-2xl hover:border-[#ec131e]/20 hover:shadow-lg hover:shadow-[#ec131e]/5 transition-all cursor-pointer">
                  <div className="text-[#ec131e] shrink-0 group-hover:scale-110 transition-transform">{topic.icon}</div>
                  <span className="font-bold text-slate-700 text-xs leading-tight group-hover:text-slate-900 transition-colors">{topic.title}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
