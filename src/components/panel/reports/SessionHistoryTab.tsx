import React, { useEffect, useState } from 'react';
import { sessionService, SessionData } from '@/services/sessionService';
import { userService } from '@/config/setup';
import type { User } from '@/models/User';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { alertService } from '@/config/setup';

export const SessionHistoryTab: React.FC = () => {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [users, setUsers] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Load sessions
        const history = await sessionService.getSessionsHistory(50, 0);
        setSessions(history);

        // Load users to map names
        const usersData = await userService.fetchUsers(1, 100);
        const userMap: Record<number, string> = {};
        if (usersData && usersData.data) {
          usersData.data.forEach((u: User) => {
            if (u.id_usu !== undefined) {
              userMap[u.id_usu] = u.nom_usu || 'Desconocido';
            }
          });
        }
        // Fallback for Admin (ID 1)
        if (!userMap[1]) userMap[1] = 'Administrador (Sistema)';
        setUsers(userMap);

      } catch (error) {
        console.error("Error al cargar historial", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleDownloadReport = async (session: SessionData) => {
    try {
      const report = await sessionService.getSessionReport(session.id);
      
      const doc = new jsPDF();
      const userName = users[session.usuario_id] || 'Usuario Desconocido';
      
      // Título
      doc.setFontSize(18);
      doc.text('Cierre de Turno', 14, 22);
      
      // Datos Generales
      doc.setFontSize(11);
      doc.text(`ID Sesión: #${session.id}`, 14, 32);
      doc.text(`Cajero Responsable: ${userName}`, 14, 38);
      doc.text(`Apertura: ${new Date(session.hora_apertura || session.fecha_apertura).toLocaleString()}`, 14, 44);
      doc.text(`Cierre: ${session.hora_cierre ? new Date(session.hora_cierre).toLocaleString() : 'AÚN ABIERTA'}`, 14, 50);
      doc.text(`Estado: ${session.estado}`, 14, 56);

      // Desglose de Ventas
      doc.setFontSize(14);
      doc.text('Desglose por Método de Pago', 14, 70);

      const tableData = report.ventas_por_metodo.map((v: any) => [
        v.metodo,
        v.cantidad.toString(),
        `$${Number(v.total).toLocaleString('es-CO')}`
      ]);

      autoTable(doc, {
        startY: 75,
        head: [['Método', 'Transacciones', 'Total Recaudado']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] }
      });

      // Total General
      const finalY = (doc as any).lastAutoTable.finalY || 100;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Ventas: $${Number(report.session.total_ventas).toLocaleString('es-CO')}`, 14, finalY + 15);

      doc.save(`Cierre_Turno_${session.id}.pdf`);
      alertService.showToast('success', 'Reporte PDF descargado');
    } catch (error) {
      console.error(error);
      alertService.showToast('error', 'No se pudo generar el reporte del turno');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="py-20 bg-surface rounded-xl border border-dashed border-outline-variant/50 flex flex-col items-center text-center px-8">
        <div className="w-16 h-16 bg-surface-container-high rounded-xl flex items-center justify-center mb-4 text-on-surface-variant/50">
          <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>history</span>
        </div>
        <h4 className="label-md text-on-surface-variant">Sin Historial de Turnos</h4>
        <p className="body-md text-on-surface-variant mt-1 max-w-xs">Aún no se ha registrado ninguna sesión de caja en el sistema.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-500">
      {sessions.map((session) => {
        const isOp = session.estado === 'ABIERTA';
        const userName = users[session.usuario_id] || 'Usuario Desconocido';
        const openTime = new Date(session.hora_apertura || session.fecha_apertura).toLocaleString();
        const closeTime = session.hora_cierre ? new Date(session.hora_cierre).toLocaleString() : 'En curso';
        const total = Number(session.total_ventas || 0).toLocaleString('es-CO');

        return (
          <div key={session.id} className="bg-surface rounded-xl border border-outline-variant/30 p-5 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isOp ? 'bg-primary animate-pulse' : 'bg-outline-variant'}`}></div>
                <span className="label-sm font-semibold text-on-surface">Turno #{session.id}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${isOp ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant'}`}>
                {session.estado}
              </span>
            </div>

            <div className="space-y-2 mb-5">
              <p className="label-sm text-on-surface-variant flex justify-between">
                <span>Cajero:</span>
                <span className="text-on-surface font-medium">{userName}</span>
              </p>
              <p className="label-sm text-on-surface-variant flex justify-between">
                <span>Apertura:</span>
                <span className="text-on-surface">{openTime}</span>
              </p>
              <p className="label-sm text-on-surface-variant flex justify-between">
                <span>Cierre:</span>
                <span className="text-on-surface">{closeTime}</span>
              </p>
              <p className="label-sm text-on-surface-variant flex justify-between mt-2 pt-2 border-t border-outline-variant/30">
                <span>Total Ventas:</span>
                <span className="text-on-surface font-bold text-lg">${total}</span>
              </p>
            </div>

            <button
              onClick={() => handleDownloadReport(session)}
              className="w-full py-2.5 flex items-center justify-center gap-2 rounded-lg border border-outline-variant/50 label-sm text-on-surface hover:bg-primary-fixed/30 hover:border-primary transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
              Descargar Cierre (A4)
            </button>
          </div>
        );
      })}
    </div>
  );
};
