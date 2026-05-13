import React, { useState, useRef, useEffect } from 'react';
import type { Order } from '@/models/Order';
import { receiptPrinterService } from '@/services/ReceiptPrinterService';

interface ReceiptModalProps {
  order: Order;
  onClose: () => void;
}

type PrintMethod = 'browser' | 'bluetooth' | 'serial';
type PrinterState = 'idle' | 'connecting' | 'connected' | 'printing' | 'success' | 'error';

interface MethodState {
  status: PrinterState;
  message: string;
}

const INITIAL_STATE: MethodState = { status: 'idle', message: '' };

export function ReceiptModal({ order, onClose }: ReceiptModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [bleState, setBleState] = useState<MethodState>(INITIAL_STATE);
  const [serialState, setSerialState] = useState<MethodState>(INITIAL_STATE);

  const bleSupported    = receiptPrinterService.isWebBluetoothSupported();
  const serialSupported = receiptPrinterService.isWebSerialSupported();

  // ── Populate iframe preview ──────────────────────────────────────────────────
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(receiptPrinterService.generateReceiptHTML(order));
      doc.close();
    }
  }, [order]);

  // ── Browser print ─────────────────────────────────────────────────────────────
  const handleBrowserPrint = () => receiptPrinterService.printWithBrowser(order);

  // ── Bluetooth ─────────────────────────────────────────────────────────────────
  const handleBleConnect = async () => {
    setBleState({ status: 'connecting', message: 'Buscando impresoras Bluetooth cercanas...' });
    const ok = await receiptPrinterService.connectBluetooth();
    if (ok) {
      const name = receiptPrinterService.getBleDeviceName() ?? 'Impresora';
      setBleState({ status: 'connected', message: `✓ Conectado a "${name}"` });
    } else {
      setBleState({ status: 'error', message: 'No se pudo conectar. Asegúrate de que la impresora está encendida y en modo de emparejamiento.' });
    }
  };

  const handleBlePrint = async () => {
    setBleState(s => ({ ...s, status: 'printing', message: 'Enviando ticket a la impresora...' }));
    try {
      await receiptPrinterService.printWithBluetooth(order);
      setBleState({ status: 'success', message: '✓ ¡Ticket impreso exitosamente!' });
    } catch (e: any) {
      setBleState({ status: 'error', message: `Error al imprimir: ${e?.message ?? 'Error desconocido'}` });
    }
  };

  const handleBleDisconnect = async () => {
    await receiptPrinterService.disconnectBluetooth();
    setBleState(INITIAL_STATE);
  };

  // ── Serial / USB ──────────────────────────────────────────────────────────────
  const handleSerialConnect = async () => {
    setSerialState({ status: 'connecting', message: 'Selecciona el puerto en el diálogo...' });
    const ok = await receiptPrinterService.connectSerial();
    if (ok) {
      setSerialState({ status: 'connected', message: '✓ Puerto USB/Serial conectado' });
    } else {
      setSerialState({ status: 'error', message: 'No se pudo abrir el puerto. Verifica que la impresora esté conectada.' });
    }
  };

  const handleSerialPrint = async () => {
    setSerialState(s => ({ ...s, status: 'printing', message: 'Enviando ticket...' }));
    try {
      await receiptPrinterService.printWithSerial(order);
      setSerialState({ status: 'success', message: '✓ ¡Ticket impreso exitosamente!' });
    } catch (e: any) {
      setSerialState({ status: 'error', message: `Error al imprimir: ${e?.message ?? 'Error desconocido'}` });
    }
  };

  const handleSerialDisconnect = async () => {
    await receiptPrinterService.disconnectSerial();
    setSerialState(INITIAL_STATE);
  };

  const isBleConnected    = receiptPrinterService.isBleConnected();
  const isSerialConnected = receiptPrinterService.isSerialConnected();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Comprobante de Compra
            </h2>
            <p className="text-xs text-slate-400 font-bold mt-0.5 uppercase tracking-widest">
              Venta #{order.id_vent} · {order.fecha_vent
                ? new Date(order.fecha_vent).toLocaleDateString('es-CO')
                : new Date().toLocaleDateString('es-CO')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
            aria-label="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">

          {/* Left: Receipt preview */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
            <div className="px-5 py-3 border-b border-slate-100 bg-white flex items-center gap-2 shrink-0">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                Vista Previa del Comprobante
              </span>
            </div>
            <div className="flex-1 overflow-auto p-6 flex justify-center">
              <iframe
                ref={iframeRef}
                title="Vista previa del comprobante"
                className="w-[310px] min-h-[520px] bg-white rounded-2xl shadow-xl border border-slate-200"
                style={{ border: 'none' }}
                scrolling="auto"
              />
            </div>
          </div>

          {/* Right: Print options */}
          <div className="w-full lg:w-80 flex flex-col gap-4 p-5 border-t lg:border-t-0 lg:border-l border-slate-100 overflow-y-auto shrink-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Opciones de Impresión
            </p>

            {/* ── Option 1: Browser / PDF ── */}
            <PrinterCard
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              }
              iconBg="bg-blue-50 text-blue-600"
              title="Imprimir / Guardar PDF"
              description="Usa cualquier impresora del sistema o guarda como PDF desde el diálogo del navegador."
              badge="Todos los navegadores"
              badgeColor="bg-blue-50 text-blue-600"
              supported={true}
            >
              <button
                id="btn-browser-print"
                onClick={handleBrowserPrint}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white py-3 text-sm font-black hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Abrir Diálogo de Impresión
              </button>
            </PrinterCard>

            {/* ── Option 2: Bluetooth BLE ── */}
            <PrinterCard
              icon={
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41l5.59 5.59L5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/>
                </svg>
              }
              iconBg={isBleConnected ? 'bg-violet-100 text-violet-600' : 'bg-violet-50 text-violet-500'}
              title="Impresora Bluetooth"
              description="Mini impresoras inalámbricas: Peripage A6/A8, Phomemo M02, MX10, Cat Printer, Paperang y compatibles."
              badge={bleSupported ? 'Chrome · Edge · Brave' : 'No soportado'}
              badgeColor={bleSupported ? 'bg-violet-50 text-violet-600' : 'bg-red-50 text-red-500'}
              supported={bleSupported}
              unsupportedMessage="Tu navegador no soporta WebBluetooth. Usa Chrome, Edge o Brave (con Shields desactivado para este sitio)."
              state={bleState}
              connected={isBleConnected}
            >
              <ConnectPrintButtons
                connected={isBleConnected}
                state={bleState}
                onConnect={() => void handleBleConnect()}
                onPrint={() => void handleBlePrint()}
                onDisconnect={() => void handleBleDisconnect()}
                connectLabel="Conectar por Bluetooth"
                printLabel="🖨️ Imprimir Ticket"
                connectColor="bg-violet-600 hover:bg-violet-700 shadow-violet-500/20"
                printColor="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
              />
            </PrinterCard>

            {/* ── Option 3: USB/Serial ESC/POS ── */}
            <PrinterCard
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M12 18h.01M8 21h8a2 2 0 002-2v-2H6v2a2 2 0 002 2zM6 17V7a1 1 0 011-1h10a1 1 0 011 1v10H6z" />
                </svg>
              }
              iconBg={isSerialConnected ? 'bg-orange-100 text-orange-600' : 'bg-orange-50 text-orange-500'}
              title="Impresora USB / Serial"
              description="Impresoras ESC/POS por USB o puerto serie: Epson TM-T20, POS-58, POS-80 y compatibles."
              badge={serialSupported ? 'Chrome · Edge · Brave' : 'No soportado'}
              badgeColor={serialSupported ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-500'}
              supported={serialSupported}
              unsupportedMessage="Tu navegador no soporta WebSerial. Usa Chrome, Edge o Brave (con Shields desactivado para este sitio)."
              state={serialState}
              connected={isSerialConnected}
            >
              <ConnectPrintButtons
                connected={isSerialConnected}
                state={serialState}
                onConnect={() => void handleSerialConnect()}
                onPrint={() => void handleSerialPrint()}
                onDisconnect={() => void handleSerialDisconnect()}
                connectLabel="Conectar por USB/Serial"
                printLabel="🖨️ Imprimir Ticket"
                connectColor="bg-orange-500 hover:bg-orange-600 shadow-orange-500/20"
                printColor="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
              />
            </PrinterCard>

            {/* Footer note */}
            <p className="text-[10px] text-slate-400 text-center leading-relaxed px-2">
              Imprime en papel A4 o térmico 58/80 mm.<br/>
              <span className="text-amber-500 font-bold">Brave:</span> desactiva Shields (🦁) para este sitio si el Bluetooth o USB no funcionan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface PrinterCardProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  supported: boolean;
  unsupportedMessage?: string;
  state?: MethodState;
  connected?: boolean;
  children: React.ReactNode;
}

function PrinterCard({
  icon, iconBg, title, description, badge, badgeColor,
  supported, unsupportedMessage, state, connected, children
}: PrinterCardProps) {
  const borderColor = connected
    ? 'border-emerald-200'
    : !supported
      ? 'border-slate-100 opacity-60'
      : 'border-slate-100';

  return (
    <div className={`rounded-2xl border ${borderColor} bg-white p-4 shadow-sm space-y-3 transition-all`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-black text-slate-800">{title}</p>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
              {badge}
            </span>
          </div>
        </div>
        {connected && (
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 animate-pulse shrink-0" />
        )}
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed">{description}</p>

      {!supported && unsupportedMessage ? (
        <div className="text-[10px] bg-amber-50 border border-amber-100 text-amber-700 p-3 rounded-xl leading-relaxed">
          ⚠ {unsupportedMessage}
        </div>
      ) : (
        <>
          {state && state.message && (
            <div className={`text-[10px] p-3 rounded-xl border font-medium leading-relaxed ${
              state.status === 'error'
                ? 'bg-red-50 border-red-100 text-red-600'
                : state.status === 'success'
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                  : 'bg-slate-50 border-slate-100 text-slate-600'
            }`}>
              {state.message}
            </div>
          )}
          {children}
        </>
      )}
    </div>
  );
}

interface ConnectPrintButtonsProps {
  connected: boolean;
  state: MethodState;
  onConnect: () => void;
  onPrint: () => void;
  onDisconnect: () => void;
  connectLabel: string;
  printLabel: string;
  connectColor: string;
  printColor: string;
}

function ConnectPrintButtons({
  connected, state,
  onConnect, onPrint, onDisconnect,
  connectLabel, printLabel,
  connectColor, printColor
}: ConnectPrintButtonsProps) {
  const isLoading = state.status === 'connecting' || state.status === 'printing';

  if (!connected) {
    return (
      <button
        onClick={onConnect}
        disabled={isLoading}
        className={`w-full flex items-center justify-center gap-2 rounded-xl text-white py-3 text-sm font-black active:scale-95 transition-all shadow-lg disabled:opacity-60 ${connectColor}`}
      >
        {state.status === 'connecting'
          ? <><Spinner /> Conectando...</>
          : <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {connectLabel}
            </>
        }
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onPrint}
        disabled={isLoading}
        className={`w-full flex items-center justify-center gap-2 rounded-xl text-white py-3 text-sm font-black active:scale-95 transition-all shadow-lg disabled:opacity-60 ${printColor}`}
      >
        {state.status === 'printing'
          ? <><Spinner /> Imprimiendo...</>
          : printLabel
        }
      </button>
      <button
        onClick={onDisconnect}
        className="w-full py-2 rounded-xl border border-slate-200 text-[10px] font-black text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
      >
        Desconectar
      </button>
    </div>
  );
}

function Spinner() {
  return <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />;
}
