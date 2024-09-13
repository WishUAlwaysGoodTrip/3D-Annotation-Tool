import React, { useState } from 'react';
import '../AnnotationPanel.css'; // Assuming you'll create a CSS file for the styles

const AnnotationPanel = () => {
  const [annotations, setAnnotations] = useState([
    'HEALTHY',
    'UNHEALTHY', 
    'ADD...'
  ]);
  const [newAnnotation, setNewAnnotation] = useState('');
  const [newColor, setNewColor] = useState('#ffffff');
  const [showAddInput, setShowAddInput] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // 保存正在编辑的注释索引
  const [editedAnnotation, setEditedAnnotation] = useState(''); // 保存编辑中的注释名称
  const [clickTimer, setClickTimer] = useState(null); // 用于区分单击和双击
  const [showAnnotationList, setShowAnnotationList] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);

  const handleAnnotationChange = (e) => {
    if (e.target.value === 'ADD...') {
      setShowAddInput(true);
    } else{
      setShowAddInput(false)
    }
  };

  const handleAddAnnotation = (e) => {
    e.preventDefault();
    if (newAnnotation.trim() !== '') {
      setAnnotations([...annotations.slice(0, annotations.length - 1), newAnnotation, 'ADD...']);
      setNewAnnotation('');
      setNewColor('#ffffff');
      setShowAddInput(false);
    }
  };

  const handleRemoveAnnotation = (annotationToRemove) => {
      setAnnotations(annotations.filter(annotation => annotation !== annotationToRemove));
  };
    // 开始编辑注释
  const handleDoubleClick = (index, annotation) => {
    setEditingIndex(index); // 设置正在编辑的注释索引
    setEditedAnnotation(annotation); // 设置要编辑的注释
  };

    // 保存编辑后的注释
  const handleEditSave = (index) => {
    const updatedAnnotations = [...annotations];
    updatedAnnotations[index] = editedAnnotation;
    setAnnotations(updatedAnnotations);
    setEditingIndex(null); // 完成编辑，重置编辑状态
  };

  const teeth = [
    { id: 1, color: '#ffffff' }, // White
    { id: 2, color: '#0000ff' }, // Blue
    { id: 3, color: '#555555' },
    { id: 4, color: '#63a103' }, 
    { id: 5, color: '#800080' }, 
    { id: 6, color: '#63a103' }, 
    { id: 7, color: '#0000ff' }, // Blue
    { id: 8, color: '#555555' }, 
    { id: 9, color: '#63a103' }, 
    { id: 10, color: '#800080' }, // Purple
    { id: 11, color: '#555555' },
    { id: 12, color: '#0000ff' }, // Blue
    { id: 13, color: '#ffffff' }, // White
    { id: 14, color: '#63a103' }, 
    { id: 15, color: '#800080' }, // Purple
    { id: 16, color: '#555555' }  
  ];

  return (
    <div className="annotation-panel">
      <div className="dropdown">
        <label htmlFor="location-list">Location</label>
        <select id="location-list">
          <option value="UPPER JAW">UPPER JAW</option>
          <option value="LOWER JAW">LOWER JAW</option>
        </select>
      </div>
      
      <div className="dropdown">
        <label htmlFor="annotation-list">Annotation List</label>
        <select id="annotation-list" onChange={handleAnnotationChange}>
          {annotations.map((annotation, index) => (
            <option key={index} value={annotation.name}>
              {annotation}
            </option>
          ))}
        </select>
      </div>

      {showAddInput && (
        <form onSubmit={handleAddAnnotation} >
          <input
            type="text"
            value={newAnnotation}
            onChange={(e) => setNewAnnotation(e.target.value)}
            placeholder="Enter new annotation"
            className="custom-input"
          />
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
          />
          <button type="submit" className="custom-button">Add</button>
        </form>
      )}

      <button onClick={() => setShowAnnotationList(!showAnnotationList)}>
        {showAnnotationList ? 'Hide' : '🖊'}
      </button>
     {/* Display list of annotations with a remove button */}
     {showAnnotationList && (
  <ul className="annotation-list">
    {annotations.slice(0, annotations.length - 1).map((annotation, index) => (
      <li key={index} className="annotation-item">
        {/* 双击进入编辑模式 */}
        {editingIndex === index ? (
          <input
            type="text"
            value={editedAnnotation}
            onChange={(e) => setEditedAnnotation(e.target.value)}
            onBlur={() => handleEditSave(index)} // 失去焦点时保存
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleEditSave(index); // 按下Enter时保存
            }}
          />
        ) : (
          <span onDoubleClick={() => handleDoubleClick(index, annotation)}>
            {annotation}
          </span>
        )}
        <button
          className="remove-button"
          onClick={() => handleRemoveAnnotation(annotation)}
        >
          Remove
        </button>

                  <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
          />
      </li>
    ))}
  </ul>
)}

    
      <div className="tooth-list">
        {teeth.map((tooth) => (
          <div key={tooth.id} className="tooth-item">
            <span>Tooth {tooth.id}</span>
            <div className="circle" style={{ backgroundColor: tooth.color }}></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnnotationPanel;
