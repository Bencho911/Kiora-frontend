import React, { useState } from 'react';
import { incidentService, alertService } from '@/config/setup';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';

export function IncidentForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'baja' as 'baja' | 'media' | 'alta'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo || !formData.descripcion) {
      alertService.showError('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      await incidentService.create({
        ...formData,
        estado: 'pendiente',
        fecha_rep: new Date().toISOString()
      });
      alertService.showSuccess('Reportado', 'Tu incidencia ha sido enviada al equipo técnico');
      setFormData({ titulo: '', descripcion: '', prioridad: 'baja' });
    } catch (error) {
      alertService.showError('Error', 'No se pudo enviar el reporte');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-none shadow-none bg-slate-50/50 rounded-3xl">
      <CardHeader>
        <CardTitle className="text-xl font-black">Reportar Incidencia</CardTitle>
        <CardDescription>¿Algo no funciona como debería? Avísanos para solucionarlo.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo" className="font-bold">Título del problema</Label>
            <Input 
              id="titulo" 
              placeholder="Ej: Error al descargar reporte de ventas" 
              value={formData.titulo}
              onChange={e => setFormData({...formData, titulo: e.target.value})}
              className="bg-white border-slate-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prioridad" className="font-bold">Prioridad</Label>
            <select 
              id="prioridad"
              value={formData.prioridad}
              onChange={e => setFormData({...formData, prioridad: e.target.value as any})}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-100"
            >
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion" className="font-bold">Descripción detallada</Label>
            <Textarea 
              id="descripcion" 
              placeholder="Describe lo que pasó y los pasos para reproducirlo..." 
              value={formData.descripcion}
              onChange={e => setFormData({...formData, descripcion: e.target.value})}
              className="bg-white border-slate-200 min-h-[100px]"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-kiora-red hover:bg-kiora-red-hover text-white font-black uppercase tracking-widest py-6 rounded-2xl"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Reporte Técnico'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
