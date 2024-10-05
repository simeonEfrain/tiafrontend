import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CreateNormativa from './CreateNormativa';
import './NormativasList.css'; // Estilo opcional

const NormativasList = () => {
  const [normativas, setNormativas] = useState([]);
  const [showModal, setShowModal] = useState(false); // Control del modal
  const [normativaToEdit, setNormativaToEdit] = useState(null); // Normativa seleccionada para editar

  useEffect(() => {
    fetchNormativas();
  }, []);

  const fetchNormativas = async () => {
    try {
      const response = await axios.get('http://localhost:8000/normativas/');
      setNormativas(response.data);
    } catch (error) {
      console.error('Error al obtener las normativas:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/normativas/${id}`);
      fetchNormativas(); // Recargar la lista después de eliminar
    } catch (error) {
      console.error('Error al eliminar la normativa:', error);
    }
  };

  const handleEdit = (normativa) => {
    setNormativaToEdit(normativa); // Cargar la normativa seleccionada
    setShowModal(true); // Mostrar modal para editar
  };

  const handleCreate = () => {
    setNormativaToEdit(null); // Limpiar el formulario para crear
    setShowModal(true); // Mostrar modal para crear
  };

  return (
    <div>
      <button className="create-button" onClick={handleCreate}>
        Crear Nueva Normativa
      </button>

      <table className="normativas-table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {normativas.map((normativa) => (
            <tr key={normativa.id}>
              <td>{normativa.titulo}</td>
              <td>{normativa.descripcion.slice(0, 30)}...</td>
              <td>
                <button className="edit-button" onClick={() => handleEdit(normativa)}>Editar</button>
                <button className="delete-button" onClick={() => handleDelete(normativa.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal para crear/editar normativas */}
      {showModal && (
        <div className="modal">
          <CreateNormativa
            normativa={normativaToEdit}
            onClose={() => setShowModal(false)}
            onNormativaUpdated={fetchNormativas}
          />
        </div>
      )}
    </div>
  );
};

export default NormativasList;
