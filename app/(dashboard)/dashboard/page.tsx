'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import {
  Mic, Square, FileText, UserPlus, X, Users, Activity, Pause, Play,
} from 'lucide-react';

// Importa componentes de UI y hooks
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/common/StatCard';

import { useAuth } from '@/hooks/useAuth'; // Importa el hook de autenticación
import { usePatients } from '@/hooks/usePatients'; // Importa el hook de pacientes
import { useConsultations } from '@/hooks/useConsultations'; // Importa el hook de consultas
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useAudioRecorder } from '@/hooks/useAudioRecorder'; // Importa el hook de grabación de audio

// Importa las interfaces desde types/index.ts
import { Patient, Consultation } from '@/types';

export default function Dashboard() {
  const { user, profile, loading: loadingAuth, handleLogout } = useAuth(); // Usa el hook de autenticación
  const { patients, loadingPatients, createPatient, loadPatients } = usePatients(); // Usa el hook de pacientes
  const { consultations, loadingConsultations, loadConsultations } = useConsultations(); // Usa el hook de consultas
  const { totalPatients, consultationsToday, newPatientsThisMonth, loading: loadingStats } = useDashboardStats();
  const {
    isRecording, isPaused, audioBlob, isProcessingAudio,
    startRecording, pauseRecording, resumeRecording, stopRecording, processAudio, resetAudio
  } = useAudioRecorder(); // Usa el hook de grabación de audio

  const [selectedPatient, setSelectedPatient] = useState('');
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientDni, setNewPatientDni] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientEmail, setNewPatientEmail] = useState('');
  const [isSavingPatient, setIsSavingPatient] = useState(false);
  const [consultationType, setConsultationType] = useState('new_patient');

  useEffect(() => {
    if (!loadingAuth && user) {
      loadPatients();
      loadConsultations(5); // Carga las 5 consultas más recientes
    }
  }, [loadingAuth, user, loadPatients, loadConsultations]);

  const handleCreatePatientSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPatientName || !newPatientDni || !user) {
      alert('El nombre y el DNI del paciente son obligatorios.');
      return;
    }
    setIsSavingPatient(true);
    const success = await createPatient({
      full_name: newPatientName,
      document_id: newPatientDni,
      phone: newPatientPhone,
      email: newPatientEmail,
    }, user.id);

    if (success) {
      alert("¡Paciente creado exitosamente!");
      setNewPatientName('');
      setNewPatientDni('');
      setNewPatientPhone('');
      setNewPatientEmail('');
      setIsPatientModalOpen(false);
    } else {
      // El error ya se maneja en usePatients
      alert("Error al crear el paciente. Consulta la consola.");
    }
    setIsSavingPatient(false);
  };

  const handleProcessAudio = async () => {
    if (user) {
      const success = await processAudio(selectedPatient, consultationType, user);
      if (success) {
        // La alerta ya se muestra en useAudioRecorder, aquí solo recargamos
        loadConsultations(5); // Recargar consultas para ver la nueva
        setSelectedPatient('');
        resetAudio();
      }
    } else {
      alert('Usuario no autenticado.');
    }
  };
   // --- LÓGICA PARA HABILITAR EL BOTÓN ---
  const isFormValid = newPatientName.trim() !== '' && newPatientDni.trim() !== '';

  if (loadingAuth || loadingPatients || loadingConsultations || loadingStats) {
    return <div className="h-screen bg-base-200 flex items-center justify-center text-text-secondary">Cargando...</div>;
  }

  return (
    <div className="h-screen flex bg-base-200 overflow-hidden">
      {isPatientModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
          <div className="bg-card p-8 rounded-xl shadow-2xl w-full max-w-md relative">
            <button onClick={() => setIsPatientModalOpen(false)} className="absolute top-4 right-4 text-text-secondary hover:text-accent transition-colors"><X size={24} /></button>
            <h2 className="text-2xl font-bold mb-6 text-text-primary">Nuevo Paciente</h2>
            <form onSubmit={handleCreatePatientSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1">Nombre Completo</label>
                  <input type="text" value={newPatientName} onChange={(e) => setNewPatientName(e.target.value)} className="w-full p-3 border border-base-300 rounded-lg bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Ej: Carlos Sánchez" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1">DNI</label>
                  <input type="text" value={newPatientDni} onChange={(e) => setNewPatientDni(e.target.value)} className="w-full p-3 border border-base-300 rounded-lg bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Ej: 12345678" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1">Teléfono (Opcional)</label>
                  <input type="tel" value={newPatientPhone} onChange={(e) => setNewPatientPhone(e.target.value)} className="w-full p-3 border border-base-300 rounded-lg bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Ej: 11-2233-4455" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1">Email (Opcional)</label>
                  <input type="email" value={newPatientEmail} onChange={(e) => setNewPatientEmail(e.target.value)} className="w-full p-3 border border-base-300 rounded-lg bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="ejemplo@correo.com" />
                </div>
              </div>
              <div className="mt-8 flex justify-end space-x-4">
                <button type="button" onClick={() => setIsPatientModalOpen(false)} className="px-5 py-2.5 rounded-lg text-text-primary bg-base-200 hover:bg-base-300 font-semibold transition-colors">Cancelar</button>
                <button
  type="submit"
  disabled={!isFormValid || isSavingPatient}
  className="w-1/2 bg-primary rounded-xl text-primary-foreground ... disabled:bg-muted disabled:text-muted-foreground ..."
>
  {isSavingPatient ? 'Guardando...' : 'Guardar Paciente'}
</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="h-screen flex bg-base-200 overflow-hidden">

        <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
          <main className="flex-1 p-8 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <StatCard title="Pacientes Totales" value={totalPatients} icon={Users} color="bg-orange-400" />
              <StatCard title="Consultas Hoy" value={consultationsToday} icon={Activity} color="bg-green-500" />
              <StatCard title="Nuevos Pacientes (Mes)" value={newPatientsThisMonth} icon={UserPlus} color="bg-primary" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 bg-base-100 rounded-xl shadow-soft border border-base-300 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-text-primary flex items-center"><Mic className="w-6 h-6 mr-3 text-primary" />Nueva Consulta</h2>
                  <button onClick={() => setIsPatientModalOpen(true)} className="flex items-center space-x-2 text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors shadow-soft">
                    <UserPlus size={16} />
                    <span className="font-semibold">Nuevo Paciente</span>
                  </button>
                </div>

                <div className="bg-base-200 p-4 rounded-lg">
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-text-secondary mb-2">1. Tipo de Consulta</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center cursor-pointer"><input type="radio" name="consultationType" value="new_patient" checked={consultationType === 'new_patient'} onChange={(e) => setConsultationType(e.target.value)} className="h-4 w-4 text-primary border-gray-300 focus:ring-primary" /><span className="ml-2 text-sm text-text-primary">Primera Vez</span></label>
                      <label className="flex items-center cursor-pointer"><input type="radio" name="consultationType" value="follow_up" checked={consultationType === 'follow_up'} onChange={(e) => setConsultationType(e.target.value)} className="h-4 w-4 text-primary border-gray-300 focus:ring-primary" /><span className="ml-2 text-sm text-text-primary">Seguimiento</span></label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-text-secondary mb-2">2. Seleccionar Paciente</label>
                      <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} className="w-full p-3 border border-base-300 rounded-lg bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="">Seleccionar...</option>
                        {patients.map((patient) => (<option key={patient.id} value={patient.id}>{patient.full_name}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-text-secondary mb-2">3. Grabar Audio</label>
                      <div className="flex space-x-3">
                        {!isRecording ? (
                          <button
                            onClick={startRecording}
                            disabled={!selectedPatient || !!audioBlob}
                            className="flex items-center space-x-2 bg-accent text-white px-5 py-3 rounded-lg hover:opacity-90 disabled:bg-gray-300 transition-all shadow-soft"
                          >
                            <Mic className="w-5 h-5" />
                            <span className="font-semibold">Grabar</span>
                          </button>
                        ) : (
                          <>
                            {!isPaused ? (
                              <button
                                onClick={pauseRecording}
                                className="flex items-center space-x-2 bg-gray-700 text-white px-5 py-3 rounded-lg hover:bg-gray-800 transition-colors shadow-soft"
                              >
                                <Pause className="w-5 h-5" />
                                <span className="font-semibold">Pausar</span>
                              </button>
                            ) : (
                              <button
                                onClick={resumeRecording}
                                className="flex items-center space-x-2 bg-gray-700 text-white px-5 py-3 rounded-lg hover:bg-gray-800 transition-colors shadow-soft"
                              >
                                <Play className="w-5 h-5" />
                                <span className="font-semibold">Reanudar</span>
                              </button>
                            )}
                            <button
                              onClick={stopRecording}
                              className="flex items-center space-x-2 bg-gray-700 text-white px-5 py-3 rounded-lg hover:bg-gray-800 transition-colors shadow-soft"
                            >
                              <Square className="w-5 h-5" />
                              <span className="font-semibold">Parar</span>
                            </button>
                          </>
                        )}
                        {audioBlob && (
                          <button
                            onClick={handleProcessAudio}
                            disabled={isProcessingAudio}
                            className="flex items-center space-x-2 bg-primary text-white px-5 py-3 rounded-lg hover:bg-primary-dark disabled:bg-gray-300 transition-colors shadow-soft"
                          >
                            <FileText className="w-5 h-5" />
                            <span className="font-semibold">{isProcessingAudio ? 'Procesando...' : 'Procesar'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {isRecording && !isPaused && (
                    <div className="flex items-center justify-center text-destructive font-medium pt-4">
                      <span className="relative flex h-3 w-3 mr-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                      </span>
                      Grabando...
                    </div>
                  )}
                  {isRecording && isPaused && (
                    <div className="text-center text-text-secondary font-medium pt-4">Grabación pausada</div>
                  )}
                  {audioBlob && !isRecording && (
                    <div className="text-center text-success font-medium pt-4">✅ Audio listo para procesar</div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1 bg-base-100 rounded-xl shadow-soft border border-base-300 p-6 flex flex-col">
                <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center flex-shrink-0"><FileText className="w-6 h-6 mr-3 text-primary" />Consultas Recientes</h2>
                <div className="space-y-3 flex-1 overflow-y-auto -mr-3 pr-3">
                  {consultations.length === 0 ? <p className="text-text-secondary text-center py-8">No hay consultas aún.</p> : (
                    consultations.map((consultation) => (
                      <Link href={`/dashboard/consultation/${consultation.id}`} key={consultation.id}>
                        <div className="border border-base-300 rounded-lg p-3 cursor-pointer hover:bg-base-200 hover:border-primary transition-all">
                          <div className="flex justify-between items-start">
                            <p className="font-bold text-text-primary text-sm">{consultation.patients?.full_name || 'Paciente desconocido'}</p>
                            <p className="text-xs text-text-secondary">{new Date(consultation.created_at).toLocaleDateString('es-AR')}</p>
                          </div>
                          <p className="mt-1 text-sm text-text-secondary truncate">
                            {consultation.formatted_notes?.note_content || 'Nota no disponible'}
                          </p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}