import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchExamination, updateExaminationStatus } from './examinationSlice';
import { AppDispatch, RootState } from '../../../../store';

interface ExaminationDetailModalProps {
  examinationId: number;
  show: boolean;
  onHide: () => void;
}

const ExaminationDetailModal: React.FC<ExaminationDetailModalProps> = ({
  examinationId,
  show,
  onHide
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { examination, loading, error } = useSelector((state: RootState) => state.examinations);

  // Fetch examination data when modal is opened
  useEffect(() => {
    if (show && examinationId) {
      dispatch(fetchExamination(examinationId));
    }
  }, [dispatch, show, examinationId]);

  if (!show) return null;

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge
  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const statusMap: { [key: string]: string } = {
      'started': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800'
    };
    
    const statusTextMap: { [key: string]: string } = {
      'started': 'Başlandı',
      'in_progress': 'Devam Ediyor',
      'completed': 'Tamamlandı'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusMap[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusTextMap[status] || status}
      </span>
    );
  };

  // Handle status update
  const handleStatusUpdate = (newStatus: 'started' | 'in_progress' | 'completed') => {
    if (examination && examination.examination_id) {
      dispatch(updateExaminationStatus({ id: examination.examination_id, status: newStatus }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Muayene Detayları</h2>
          <button
            onClick={onHide}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading.details ? (
          <div className="flex justify-center items-center py-20">
            <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : examination ? (
          <div className="space-y-6">
            {/* Header Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {examination.pet_name} 
                    <span className="ml-2 text-sm text-gray-500">
                      ({examination.pet_species} - {examination.pet_breed})
                    </span>
                  </h3>
                  <p className="text-sm text-gray-500">
                    Veteriner: {examination.veterinarian_name}
                  </p>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">Durum:</span>
                  {getStatusBadge(examination.status)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="text-xs text-gray-500">Muayene Tarihi</p>
                  <p className="text-sm font-medium">{formatDate(examination.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Son Güncelleme</p>
                  <p className="text-sm font-medium">{formatDate(examination.updated_at)}</p>
                </div>
              </div>
            </div>

            {/* Vital Signs */}
            <div>
              <h4 className="text-base font-medium text-gray-900 mb-3">Vital Bulgular</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Vücut Isısı</p>
                  <p className="text-base font-medium">{examination.temperature ? `${examination.temperature} °C` : '-'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Kalp Atış Hızı</p>
                  <p className="text-base font-medium">{examination.heart_rate ? `${examination.heart_rate} bpm` : '-'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Solunum Hızı</p>
                  <p className="text-base font-medium">{examination.respiratory_rate ? `${examination.respiratory_rate} bpm` : '-'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Ağırlık</p>
                  <p className="text-base font-medium">{examination.weight ? `${examination.weight} kg` : '-'}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {examination.notes && (
              <div>
                <h4 className="text-base font-medium text-gray-900 mb-2">Notlar</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{examination.notes}</p>
                </div>
              </div>
            )}

            {/* Status Actions */}
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center">
                <h4 className="text-base font-medium text-gray-900">Muayene Durumu</h4>
                <div className="flex space-x-2">
                  <button
                    className={`px-3 py-1 text-xs font-medium rounded-md ${
                      examination.status === 'started' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                    onClick={() => handleStatusUpdate('started')}
                    disabled={loading.update}
                  >
                    Başlandı
                  </button>
                  <button
                    className={`px-3 py-1 text-xs font-medium rounded-md ${
                      examination.status === 'in_progress' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                    onClick={() => handleStatusUpdate('in_progress')}
                    disabled={loading.update}
                  >
                    Devam Ediyor
                  </button>
                  <button
                    className={`px-3 py-1 text-xs font-medium rounded-md ${
                      examination.status === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                    onClick={() => handleStatusUpdate('completed')}
                    disabled={loading.update}
                  >
                    Tamamlandı
                  </button>
                </div>
              </div>
              {loading.update && (
                <div className="mt-2 text-xs text-gray-500 flex items-center">
                  <svg className="animate-spin mr-1 h-3 w-3 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Durum güncelleniyor...
                </div>
              )}
            </div>

            {/* Diagnoses Link */}
            <div className="border-t pt-4 mt-4">
              <button 
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-md flex items-center justify-center"
                onClick={() => {
                  // Implementation will be added when diagnosis module is created
                  alert('Tanı modülü henüz uygulanmadı');
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Tanıları Görüntüle / Yeni Tanı Ekle
              </button>
            </div>

            {/* Report Link */}
            <div>
              <button 
                className="w-full py-2 bg-green-50 hover:bg-green-100 text-green-700 font-medium rounded-md flex items-center justify-center"
                onClick={() => {
                  // Implementation will be added when report module is created
                  alert('Rapor modülü henüz uygulanmadı');
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Muayene Raporu Oluştur
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">Muayene bilgileri bulunamadı.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExaminationDetailModal;
