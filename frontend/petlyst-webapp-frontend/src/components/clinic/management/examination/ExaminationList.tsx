import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '../../../../hooks/useAppDispatch';
import { useAppSelector } from '../../../../hooks/useAppSelector';
import { 
  listExaminations, 
  getExamination, 
  deleteExamination,
  updateExaminationStatus
} from './examinationSlice';
import { Examination, ExaminationFilters } from './examinationService';
import { format } from 'date-fns';
import { FaEdit, FaTrash, FaEye } from 'react-icons/fa';

interface ExaminationListProps {
  filters?: ExaminationFilters;
  onViewExamination?: (examination: Examination) => void;
  onEditExamination?: (examination: Examination) => void;
}

const ExaminationList: React.FC<ExaminationListProps> = ({ 
  filters = {}, 
  onViewExamination,
  onEditExamination
}) => {
  const dispatch = useAppDispatch();
  const { examinations, loading, error, totalCount } = useAppSelector(state => state.examinations);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  
  // Calculate offset based on pagination
  const offset = (currentPage - 1) * limit;
  
  // Load examinations when component mounts or filters/pagination change
  useEffect(() => {
    dispatch(listExaminations({
      ...filters,
      limit,
      offset
    }));
  }, [dispatch, filters, limit, offset]);
  
  // Handle status change
  const handleStatusChange = (examinationId: number, newStatus: 'started' | 'in_progress' | 'completed') => {
    dispatch(updateExaminationStatus({ examinationId, status: newStatus }));
  };
  
  // Handle examination view
  const handleViewExamination = (examination: Examination) => {
    dispatch(getExamination(examination.examination_id));
    if (onViewExamination) {
      onViewExamination(examination);
    }
  };
  
  // Handle examination edit
  const handleEditExamination = (examination: Examination) => {
    dispatch(getExamination(examination.examination_id));
    if (onEditExamination) {
      onEditExamination(examination);
    }
  };
  
  // Handle confirmation dialog for delete
  const handleConfirmDelete = (examinationId: number) => {
    setConfirmDelete(examinationId);
  };
  
  // Handle deletion of examination
  const handleDeleteExamination = async () => {
    if (confirmDelete) {
      await dispatch(deleteExamination(confirmDelete));
      setConfirmDelete(null);
    }
  };
  
  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch(status) {
      case 'started':
        return <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">Started</span>;
      case 'in_progress':
        return <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800">In Progress</span>;
      case 'completed':
        return <span className="px-2 py-1 rounded bg-green-100 text-green-800">Completed</span>;
      default:
        return <span className="px-2 py-1 rounded bg-gray-100 text-gray-800">{status}</span>;
    }
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(totalCount / limit);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  if (loading && examinations.length === 0) {
    return <div className="flex justify-center p-8"><div className="loader">Loading...</div></div>;
  }
  
  if (error) {
    return <div className="p-4 text-red-600 bg-red-100 rounded">Error: {error}</div>;
  }
  
  if (examinations.length === 0) {
    return <div className="p-8 text-center text-gray-500">No examinations found.</div>;
  }
  
  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Pet Name</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Veterinarian</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {examinations.map((examination) => (
            <tr key={examination.examination_id}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                {examination.pet_name || `Pet #${examination.pet_id}`}
                <div className="text-xs text-gray-500">
                  {examination.pet_species} {examination.pet_breed ? `(${examination.pet_breed})` : ''}
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {examination.veterinarian_name || `Vet #${examination.vet_id}`}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {format(new Date(examination.created_at), 'PPP')}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                <div className="flex items-center">
                  {renderStatusBadge(examination.status)}
                  <select
                    className="ml-2 text-sm border-gray-300 rounded-md"
                    value={examination.status}
                    onChange={(e) => handleStatusChange(
                      examination.examination_id, 
                      e.target.value as 'started' | 'in_progress' | 'completed'
                    )}
                  >
                    <option value="started">Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <div className="flex space-x-2 justify-end">
                  <button
                    onClick={() => handleViewExamination(examination)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <FaEye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditExamination(examination)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleConfirmDelete(examination.examination_id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{offset + 1}</span> to{' '}
                <span className="font-medium">{Math.min(offset + limit, totalCount)}</span> of{' '}
                <span className="font-medium">{totalCount}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  &laquo;
                </button>
                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handlePageChange(index + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                      currentPage === index + 1
                        ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  &raquo;
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FaTrash className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Examination</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this examination? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDeleteExamination}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setConfirmDelete(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExaminationList;
