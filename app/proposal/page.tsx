// app/proposal/page.tsx
'use client'; // Esto es necesario en el App Router si usas useState o useEffect

import React from 'react';
import { CheckCircle, XCircle, Gift, CalendarDays, DollarSign, Lightbulb, FileText } from 'lucide-react'; // Íconos que ya tienes

export default function ProposalPage() {
  const deadlineDate = '14 de Julio'; // Puedes hacer esto dinámico si quieres

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Header/Banner */}
      <header className="w-full max-w-4xl bg-blue-600 text-white p-6 rounded-lg shadow-lg mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Propuesta de Sistema Médico Inteligente</h1>
        <p className="text-lg">Optimice su consulta con tecnología de vanguardia</p>
      </header>

      {/* Sección Introducción */}
      <section className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold text-blue-700 mb-4">Estimado Doctor,</h2>
        <p className="text-gray-700 leading-relaxed">
          Me complace presentarle una propuesta detallada para el desarrollo de un sistema innovador que transformará la gestión de sus consultas. Diseñado para ahorrarle tiempo y mejorar la precisión de sus notas clínicas, este sistema integra inteligencia artificial para la transcripción y procesamiento de audio.
        </p>
      </section>

      {/* Sección Descripción del Sistema */}
      <section className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold text-blue-700 mb-6">¿Qué Ofrecemos?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start p-4 bg-blue-50 rounded-lg shadow-sm">
            <CheckCircle className="text-blue-600 w-6 h-6 mr-3 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-800">Transcripción Automática</h3>
              <p className="text-gray-600 text-sm">Convierta la voz de sus consultas en texto de manera instantánea con alta precisión.</p>
            </div>
          </div>
          <div className="flex items-start p-4 bg-blue-50 rounded-lg shadow-sm">
            <Lightbulb className="text-blue-600 w-6 h-6 mr-3 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-800">Procesamiento Inteligente con IA</h3>
              <p className="text-gray-600 text-sm">Extracción automática de motivo de consulta, historial, síntomas, diagnóstico y tratamiento.</p>
            </div>
          </div>
          <div className="flex items-start p-4 bg-blue-50 rounded-lg shadow-sm">
            <FileText className="text-blue-600 w-6 h-6 mr-3 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-800">Generación de Notas Clínicas</h3>
              <p className="text-gray-600 text-sm">Notas estructuradas y profesionales listas para su historial médico.</p>
            </div>
          </div>
          <div className="flex items-start p-4 bg-blue-50 rounded-lg shadow-sm">
            <CalendarDays className="text-blue-600 w-6 h-6 mr-3 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-800">Gestión Integral de Consultas</h3>
              <p className="text-gray-600 text-sm">Acceda y organice fácilmente todo el historial de sus pacientes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección Costos Mensuales */}
      <section className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-md mb-8 text-center">
        <h2 className="text-2xl font-semibold text-blue-700 mb-4">Inversión y Costos Operativos</h2>
        <div className="flex items-center justify-center bg-gray-50 p-6 rounded-lg border border-gray-200">
          <DollarSign className="w-8 h-8 text-green-600 mr-4" />
          <div>
            <p className="text-lg text-gray-700">El único gasto mensual inicial estimado será para el uso de la API de OpenAI:</p>
            <p className="text-3xl font-bold text-green-700 mt-2">Aprox. $10 USD/mes</p>
            <p className="text-sm text-gray-500">(Dependiendo del volumen de uso)</p>
          </div>
        </div>
      </section>

      {/* Sección Opciones de Presupuesto */}
      <section className="w-full max-w-4xl p-8 mb-8">
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-8">Opciones de Inversión</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tarjeta Sin Branding */}
          <div className="bg-white p-8 rounded-lg shadow-xl border border-gray-200 flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-bold text-blue-600 mb-4 text-center">Versión Sin Branding</h3>
              <p className="text-gray-700 mb-6 text-center">
                El sistema se entrega con una interfaz limpia y estándar, lista para usar.
              </p>
              <div className="text-center mb-6">
                <p className="text-xl text-gray-500 line-through">$1500 USD</p>
                <p className="text-5xl font-extrabold text-blue-800">$1000 USD</p>
              </div>
            </div>
            <div className="mt-auto">
              <p className="text-center text-sm font-semibold text-red-600">
                ¡Oferta por tiempo limitado! Válida hasta el {deadlineDate}.
              </p>
            </div>
          </div>

          {/* Tarjeta Con Branding */}
          <div className="bg-white p-8 rounded-lg shadow-xl border-2 border-blue-600 flex flex-col justify-between relative overflow-hidden">
             {/* Esquina superior derecha con un acento */}
             <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                ¡Más valor!
            </div>
            <div>
              <h3 className="text-2xl font-bold text-blue-600 mb-4 text-center">Versión Con Branding de su Marca</h3>
              <p className="text-gray-700 mb-6 text-center">
                Personalización completa con su logo, colores y elementos visuales de su clínica.
              </p>
              <div className="text-center mb-6">
                <p className="text-xl text-gray-500 line-through">$1800 USD</p>
                <p className="text-5xl font-extrabold text-blue-800">$1300 USD</p>
              </div>
            </div>
            <div className="mt-auto">
              <p className="text-center text-sm font-semibold text-red-600 mb-4">
                ¡Oferta por tiempo limitado! Válida hasta el {deadlineDate}.
              </p>
              <div className="bg-blue-100 text-blue-800 p-4 rounded-lg flex items-center justify-center font-medium shadow-inner">
                <Gift className="w-6 h-6 mr-3 text-blue-600" />
                <span>¡REGALO ESPECIAL! Sesión de capacitación personalizada de 2 horas.</span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-center text-lg text-gray-700 mt-8">
            Si toma la decisión antes del <span className="font-bold text-red-600">{deadlineDate}</span>, podremos
            dedicar a todo nuestro equipo para asegurar una implementación rápida y eficiente de su proyecto.
        </p>
      </section>

      {/* Sección Plazos de Entrega */}
      <section className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-md mb-8 text-center">
        <h2 className="text-2xl font-semibold text-blue-700 mb-4">Plazo de Entrega</h2>
        <p className="text-gray-700 text-lg">
          Comprometidos con la eficiencia, la versión inicial del sistema será entregada en un plazo de:
        </p>
        <p className="text-4xl font-bold text-blue-700 mt-4">1 Semana</p>
      </section>

      {/* Sección Cierre */}
      <section className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-md text-center">
        <p className="text-gray-700 leading-relaxed mb-4">
          Estoy a su entera disposición para cualquier consulta adicional, aclarar dudas o programar una demostración más detallada del funcionamiento del sistema.
        </p>
        <p className="text-gray-800 font-semibold mt-4">Atentamente,</p>
        <p className="text-blue-700 font-bold text-lg">[Tu Nombre/Nombre de tu Empresa]</p>
      </section>

      {/* Footer (opcional) */}
      <footer className="w-full max-w-4xl text-center mt-8 text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} [Tu Nombre/Nombre de tu Empresa]. Todos los derechos reservados.
      </footer>
    </div>
  );
}