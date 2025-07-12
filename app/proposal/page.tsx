// app/proposal/page.tsx
'use client';

import React from 'react';
import {
  CheckCircle,
  Download,
  Lock,
  Globe,
  User,
  Mic,
  FileText,
  CalendarDays,
  Video,
  BookOpen,
  Award,
  HardDrive,
  CreditCard,
  RefreshCw,
  ZoomIn,
  XCircle, // Still used for non-included features, if any remain.
} from 'lucide-react';

export default function ProposalPage() {
  const deadlineDate = '14 de Julio'; // This is a fixed date, not calculated from current time.
  const googleDriveLink = 'https://drive.google.com/drive/folders/1JQAh1J39nugVLocSVu4n_DB6WthzVTgO?usp=sharing'; // ¡CAMBIA ESTO POR TU ENLACE REAL!

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Header/Banner */}
      <header className="w-full max-w-4xl bg-blue-600 text-white p-6 rounded-lg shadow-lg mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Propuesta de Sistema Médico Inteligente</h1>
        <p className="text-lg">Optimice su consulta con tecnología de vanguardia</p>
      </header>

      {/* Sección Introducción */}
      <section className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold text-blue-700 mb-4">Dr. Alejandro,</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Aquí le comparto toda la información detallada al respecto del desarrollo del sistema inteligente para transcripción de citas médicas. Un sistema que será 100% suyo y le ahorrará tiempo y mejorará la precisión de las notas clínicas, además de digitalizar su clínica.
        </p>
        <p className="text-gray-700 leading-relaxed">
          Te comparto un enlace con algunas imágenes de un bosquejo que he estado armando en base a lo que hablamos para tener una idea general de cómo se podría ver la aplicación web.
        </p>

        {/* Enlace a Google Drive */}
        <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-800 rounded-md shadow-sm flex items-center justify-center">
          <HardDrive className="w-6 h-6 mr-3" />
          <a
            href={googleDriveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-700 hover:underline"
          >
            Haga clic aquí para ver las imágenes del bosquejo del sistema
          </a>
        </div>
      </section>

      {/* Sección Funcionalidades Más Importantes (Manteniendo la descripción general) */}
      <section className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold text-blue-700 mb-6">Funcionalidades Más Importantes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start p-4 bg-blue-50 rounded-lg shadow-sm">
            <Mic className="text-blue-600 w-6 h-6 mr-3 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-800">Transcripción Automática</h3>
              <p className="text-gray-600 text-sm">Convierta la voz de sus consultas en texto de manera instantánea con alta precisión.</p>
            </div>
          </div>
          <div className="flex items-start p-4 bg-blue-50 rounded-lg shadow-sm">
            <FileText className="text-blue-600 w-6 h-6 mr-3 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-800">Generación de Notas Clínicas Inteligentes</h3>
              <p className="text-gray-600 text-sm">Notas estructuradas y profesionales con IA (motivo, historial, diagnóstico, tratamiento).</p>
            </div>
          </div>
          <div className="flex items-start p-4 bg-blue-50 rounded-lg shadow-sm">
            <User className="text-blue-600 w-6 h-6 mr-3 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-800">Gestión de Usuarios</h3>
              <p className="text-gray-600 text-sm">Soporte para usuario Administrador y usuarios Asistentes.</p>
            </div>
          </div>
          <div className="flex items-start p-4 bg-blue-50 rounded-lg shadow-sm">
            <Download className="text-blue-600 w-6 h-6 mr-3 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-800">Descarga de Historial Completo</h3>
              <p className="text-gray-600 text-sm">Posibilidad de descargar el historial completo de todas las consultas.</p>
            </div>
          </div>
          <div className="flex items-start p-4 bg-blue-50 rounded-lg shadow-sm">
            <Lock className="text-blue-600 w-6 h-6 mr-3 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-800">Información Encriptada</h3>
              <p className="text-gray-600 text-sm">La información de los pacientes se maneja de forma segura y encriptada.</p>
            </div>
          </div>
          <div className="flex items-start p-4 bg-blue-50 rounded-lg shadow-sm">
            <Globe className="text-blue-600 w-6 h-6 mr-3 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-800">Acceso Web (Multi-dispositivo)</h3>
              <p className="text-gray-600 text-sm">Se accede desde cualquier navegador web, compatible con móviles y computadoras.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección Versiones (con comparativa integrada) */}
      <section className="w-full max-w-4xl p-8 mb-8">
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-8">Versiones</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tarjeta Standard */}
          <div className="bg-white p-8 rounded-lg shadow-xl border border-gray-200 flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-bold text-blue-600 mb-4 text-center">Versión Standard</h3>
              <p className="text-gray-700 mb-6 text-center">
                El sistema se entrega con una interfaz limpia y funcional, sin personalización de marca.
              </p>
              <div className="text-center mb-6">
                <p className="text-xl text-gray-500 line-through">$27000 MXN</p>
                <p className="text-5xl font-extrabold text-blue-800">$18000 MXN</p>
                <p className="text-sm text-gray-600 mt-2">
                  (El único gasto mensual inicial estimado será para el uso de la API de OpenAI: **Aprox. $10 USD/mes**, dependiendo del volumen de uso)
                </p>
              </div>
              <h4 className="font-semibold text-gray-700 mb-3 text-center">Características Incluidas:</h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" /> Transcripción y Notas IA</li>
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" /> Gestión de Usuarios (Admin + Asistentes)</li>
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" /> Descarga de Historial Completo</li> {/* INCLUDED IN BOTH */}
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" /> Información Encriptada</li>
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" /> Acceso Web (Móvil y PC)</li>
                <li className="flex items-center text-gray-500"><XCircle className="w-5 h-5 text-red-500 mr-2" /> Branding y Personalización de Marca</li> {/* ONLY DIFFERENCE */}
              </ul>
            </div>
          </div>

          {/* Tarjeta PRO */}
          <div className="bg-white p-8 rounded-lg shadow-xl border-2 border-blue-600 flex flex-col justify-between relative overflow-hidden">
             {/* Esquina superior derecha con un acento */}
             <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                ¡Más valor!
            </div>
            <div>
              <h3 className="text-2xl font-bold text-blue-600 mb-4 text-center">Versión PRO</h3>
              <p className="text-gray-700 mb-6 text-center">
                Personalización completa con su logo, colores y elementos visuales de su clínica.
              </p>
              <div className="text-center mb-6">
                <p className="text-xl text-gray-500 line-through">$33000 MXN</p>
                <p className="text-5xl font-extrabold text-blue-800">$24000 mxn</p>
                <p className="text-sm text-gray-600 mt-2">
                  (El único gasto mensual inicial estimado será para el uso de la API de OpenAI: **Aprox. $10 USD/mes**, dependiendo del volumen de uso)
                </p>
              </div>
              <h4 className="font-semibold text-gray-700 mb-3 text-center">Características Incluidas:</h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" /> Transcripción y Notas IA</li>
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" /> Gestión de Usuarios (Admin + Asistentes)</li>
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" /> Descarga de Historial Completo</li> {/* INCLUDED IN BOTH */}
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" /> Información Encriptada</li>
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" /> Acceso Web (Móvil y PC)</li>
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" /> **Branding y Personalización de Marca** <span className="ml-1 text-xs text-blue-500">(EXCLUSIVO PRO)</span></li> {/* ONLY DIFFERENCE */}
              </ul>
            </div>
          </div>
        </div>
        <p className="text-center text-lg text-gray-700 mt-8">
            El valor con descuento del trabajo es válido hasta el <span className="font-bold text-red-600">{deadlineDate}</span>,
            debido a que tengo otros proyectos en espera pero me interesa mucho tu proyecto porque sé que voy a poder darte muy buenos resultados.
        </p>

        {/* Sección de Beneficios Adicionales por Pronta Decisión */}
        <div className="mt-12 p-8 bg-blue-100 rounded-lg shadow-inner border border-blue-200">
            <h3 className="text-2xl font-bold text-blue-800 mb-6 text-center">Beneficios Exclusivos por Comenzar Ahora</h3>
            <p className="text-lg text-gray-700 mb-6 text-center">
                Si decide iniciar el proyecto en esta fecha, además del precio especial, te regalo:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                    <RefreshCw className="w-6 h-6 text-blue-600 mr-3" />
                    <span className="text-gray-800 font-medium">1 Mes GRATIS de optimización, mejoras del sistema y mantenimiento</span>
                </div>
                <div className="flex items-center bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                    <Video className="w-6 h-6 text-blue-600 mr-3" />
                    <span className="text-gray-800 font-medium">Videos tutoriales detallados para el uso del sistema.</span>
                </div>
                <div className="flex items-center bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                    <BookOpen className="w-6 h-6 text-blue-600 mr-3" />
                    <span className="text-gray-800 font-medium">Manual de usuario completo.</span>
                </div>
                <div className="flex items-center bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                    <ZoomIn className="w-6 h-6 text-blue-600 mr-3" />
                    <span className="text-gray-800 font-medium">Capacitación en vivo vía Zoom.</span>
                </div>
            </div>
        </div>
      </section>

      {/* Sección Modalidad de Pago y Garantía */}
      <section className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold text-blue-700 mb-6 text-center">Modalidad de Pago y Garantía</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-200 flex items-start">
            <CreditCard className="w-8 h-8 text-blue-600 mr-4 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Modalidad de Pago Flexible</h3>
              <p className="text-gray-700">
                Para su comodidad y confianza, el pago se realizará en dos partes:
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                <li>**50%** antes de iniciar el proyecto.</li>
                <li>**50%** al entregar el sistema completamente funcional.</li>
              </ul>
            </div>
          </div>
          <div className="bg-green-50 p-6 rounded-lg shadow-sm border border-green-200 flex items-start">
            <Award className="w-8 h-8 text-green-600 mr-4 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Garantía de Satisfacción 100%</h3>
              <p className="text-gray-700">
                Estoy tan seguro de que te va a encantar, que te ofrezco una garantía de funcionamiento firmada por contrato. Si el sistema no es lo que esperaba, tienes **30 días post-entrega** para solicitar el reembolso y se le reembolsará el 100% del dinero.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección Plazos de Entrega */}
      <section className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-md mb-8 text-center">
        <h2 className="text-2xl font-semibold text-blue-700 mb-4">Plazo de Entrega</h2>
        <p className="text-gray-700 text-lg">
          Mi equipo se compromete con la eficiencia al 100%, la versión inicial del sistema será entregada en un plazo de:
        </p>
        <p className="text-4xl font-bold text-blue-700 mt-4">7 días hábiles</p>
      </section>

      {/* Sección Cierre */}
      <section className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-md text-center">
        <p className="text-gray-700 leading-relaxed mb-4">
          Estoy a tu disposición para cualquier consulta adicional, aclarar dudas o lo que necesite.
        </p>
        <p className="text-gray-800 font-semibold mt-4">Atentamente,</p>
        <p className="text-blue-700 font-bold text-lg">Luis Adrian Ortiz</p>
      </section>

      {/* Footer (opcional) */}
      <footer className="w-full max-w-4xl text-center mt-8 text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Luis Adrian Ortiz. Todos los derechos reservados.
      </footer>
    </div>
  );
}