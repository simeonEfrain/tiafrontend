import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CreateNormativa.css'; // Usamos el nuevo CSS mejorado

const CreateNormativa = ({ normativa, onClose, onNormativaUpdated }) => {
  const [titulo, setTitulo] = useState(normativa ? normativa.titulo : '');
  const [descripcion, setDescripcion] = useState(normativa ? normativa.descripcion : '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (normativa) {
        await axios.put(`http://localhost:8000/normativas/${normativa.id}`, {
          titulo,
          descripcion
        });
      } else {
        await axios.post('http://localhost:8000/normativas/', {
          titulo,
          descripcion
        });
      }
      onNormativaUpdated(); // Refrescar la lista de normativas
      onClose(); // Cerrar el modal
    } catch (error) {
      console.error('Error al guardar la normativa:', error);
    }
  };

  return (
    <div className="modal-content">
      <h2>{normativa ? 'Editar Normativa' : 'Crear Nueva Normativa'}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="titulo">Título</label>
          <input
            type="text"
            id="titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            required
          />
        </div>
        <button type="submit">{normativa ? 'Actualizar' : 'Crear'}</button>
        <button type="button" onClick={onClose}>Cancelar</button>
      </form>
    </div>
  );
};

export default CreateNormativa;
