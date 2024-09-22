import React, { useState, useEffect } from 'react';
import '../AnnotationPanel.css'; // Assuming you'll create a CSS file for the styles

const AnnotationPanel = ({ onColorChange }) => {
  const [annotations, setAnnotations] = useState([
    { name: 'ADD...', color: '#af2828' }
  ]);
  const [newAnnotation, setNewAnnotation] = useState('');
  const [newColor, setNewColor] = useState('#af2828');
  const [showAddInput, setShowAddInput] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // 保存正在编辑的注释索引
  const [editedAnnotation, setEditedAnnotation] = useState(''); // 保存编辑中的注释名称
  const [showAnnotationList, setShowAnnotationList] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [jaw, setJaw] = useState('UPPER JAW'); // Currently selected jaw
  const [upperJawTeeth, setUpperJawTeeth] = useState([]);
  const [lowerJawTeeth, setLowerJawTeeth] = useState([]);
  const [annotationColors, setAnnotationColors] = useState({}); 
  const [newToothName, setNewToothName] = useState(''); // Input for tooth name
  const [error, setError] = useState(''); // Error message for duplicate tooth names
  const [annotationTeethState, setAnnotationTeethState] = useState({});

  const handleJawChange = (e) => {
    setJaw(e.target.value);
  };
  

  const handleToothClick = (toothId) => {
    setSelectedTooth(toothId);
    if (selectedAnnotation) {
      applyColor(selectedAnnotation.color);
    }
  };

  const handlePaintTooth = (color) => {
    const teeth = jaw === 'UPPER JAW' ? upperJawTeeth : lowerJawTeeth;
    const updatedTeeth = teeth.map(tooth =>
      tooth.id === selectedTooth ? { ...tooth, color } : tooth
    );

    if (jaw === 'UPPER JAW') {
      setUpperJawTeeth(updatedTeeth);
    } else {
      setLowerJawTeeth(updatedTeeth);
    }
  };

  const applyColor = (color) => {
    handlePaintTooth(color);
    onColorChange(color, `Tooth ${selectedTooth}`);
  };

  const handleAddTooth = () => {
    
    // Check if the tooth name is unique across both jaws
    const allTeeth = [...upperJawTeeth, ...lowerJawTeeth];
    const isDuplicate = allTeeth.some(tooth => tooth.name === newToothName);

    if (isDuplicate || newToothName.trim() === '') {
      setError('Tooth name must be unique and not empty!');
      return;
    }

    const newToothId = jaw === 'UPPER JAW' 
    ? upperJawTeeth.length + 1  
    : lowerJawTeeth.length + 100001;  


    const newTooth = { id: newToothId, name: newToothName, color: '#ffffff' };
    setError(''); // Clear any previous errors

    if (jaw === 'UPPER JAW') {
      setUpperJawTeeth([...upperJawTeeth, newTooth]);
    } else {
      setLowerJawTeeth([...lowerJawTeeth, newTooth]);
    }

    setNewToothName(''); 
  };

  const handleRemoveTooth = (toothId) => {
    if (jaw === 'UPPER JAW') {
      setUpperJawTeeth(upperJawTeeth.filter(tooth => tooth.id !== toothId)); // 从上颌中移除牙齿
    } else {
      setLowerJawTeeth(lowerJawTeeth.filter(tooth => tooth.id !== toothId)); // 从下颌中移除牙齿
    }
  
    // 如果被删除的牙齿是当前选中的，重置选中的牙齿
    if (selectedTooth === toothId) {
      setSelectedTooth(null);
    }
  };

  useEffect(() => {
    if (annotations.length === 1 && annotations[0].name === 'ADD...') {
      setShowAddInput(true);
    }
  }, [annotations]);

  const handleAnnotationChange = (e) => {
    const selected = e.target.value;
    const selectedAnn = annotations.find(annotation => annotation.name === selected);
    setSelectedAnnotation(selectedAnn);
  
    if (selected === 'ADD...') {
      setShowAddInput(true);
    } else {
      setShowAddInput(false);
      if (selectedAnn) {

        // 加载选中的注释的牙齿状态
        const currentTeethState = annotationTeethState[selectedAnn.name] || {};
        setUpperJawTeeth(currentTeethState.upperJaw || []);
        setLowerJawTeeth(currentTeethState.lowerJaw || []);
        onColorChange(selectedAnn.color, selectedAnn.name); // 调用回调函数，传递颜色和名字
      }
    }
  };

  // 保存当前注释的牙齿状态
  const saveTeethState = () => {
    if (selectedAnnotation) {
      setAnnotationTeethState({
        ...annotationTeethState,
        [selectedAnnotation.name]: {
          upperJaw: upperJawTeeth,
          lowerJaw: lowerJawTeeth
        }
      });
    }
  };

  // 每次牙齿或注释状态改变时保存状态
  useEffect(() => {
    saveTeethState();
  }, [upperJawTeeth, lowerJawTeeth]); 

  
  const handleColorChange = (index, color) => {
    const updatedAnnotations = [...annotations];
    updatedAnnotations[index].color = color;
    setAnnotations(updatedAnnotations);
  
    // 检查当前选择的注释名称是否匹配，然后更新颜色
    if (selectedAnnotation && updatedAnnotations[index].name === selectedAnnotation.name) {
      onColorChange(color, updatedAnnotations[index].name);
    }
  };

  const saveAnnotationColors = () => {
    if (selectedAnnotation) {
      const teeth = jaw === 'UPPER JAW' ? upperJawTeeth : lowerJawTeeth;
      const currentColors = {};
      teeth.forEach(tooth => {
        currentColors[tooth.id] = tooth.color;
      });

      setAnnotationColors({
        ...annotationColors,
        [selectedAnnotation.name]: currentColors,
      });
    }
  };

  useEffect(() => {
    saveAnnotationColors();
  }, [upperJawTeeth, lowerJawTeeth]);
  


const handleAddAnnotation = (e) => {
  e.preventDefault();
  if (newAnnotation.trim() !== '') {
    const newAnnotationObj = { name: newAnnotation, color: newColor };
    setAnnotations([...annotations.slice(0, annotations.length - 1), newAnnotationObj, { name: 'ADD...', color: '#ffffff' }]);
    setNewAnnotation('');
    setNewColor('#af2828');
    setShowAddInput(false);
    setSelectedAnnotation(newAnnotationObj);
    onColorChange(newAnnotationObj.color, newAnnotationObj.name); // 添加注释时，调用回调函数
  }
};
  

  const handleRemoveAnnotation = (annotationToRemove) => {
    setAnnotations(annotations.filter(annotation => annotation.name !== annotationToRemove.name));
    setSelectedAnnotation(null); // 取消当前选择的注释
  };
  
    // 开始编辑注释
  const handleDoubleClick = (index, annotation) => {
    setEditingIndex(index); // 设置正在编辑的注释索引
    setEditedAnnotation(annotation); // 设置要编辑的注释
  };
  const handleEditSave = (index) => {
    const updatedAnnotations = [...annotations];
    // 更新注释名称和保持颜色不变
    updatedAnnotations[index] = { name: editedAnnotation, color: updatedAnnotations[index].color };
    setAnnotations(updatedAnnotations);
    setEditingIndex(null); // 完成编辑，重置编辑状态

    // 更新颜色为编辑后的注释颜色
    onColorChange(updatedAnnotations[index].color);
    setSelectedAnnotation(updatedAnnotations[index]);
  };
  
  return (
    <div className="annotation-panel">
    <div className="dropdown">
      <label htmlFor="location-list">Location</label>
      <select id="location-list" onChange={handleJawChange}>
        <option value="UPPER JAW">UPPER JAW</option>
        <option value="LOWER JAW">LOWER JAW</option>
      </select>
    </div>
      
      <div className="dropdown">
        <label htmlFor="annotation-list">Annotation List</label>
        <select id="annotation-list" onChange={handleAnnotationChange}>
  {annotations.map((annotation, index) => (
    <option key={index} value={annotation.name}>
      {annotation.name}
    </option>
  ))}
</select>
      </div>
      {showAddInput && (
  <form onSubmit={handleAddAnnotation}>
    <div className="form-row">
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
        className="color1"
      />
    </div>
    <button type="submit" className="submit-button">Yes</button>
  </form>
)}


    {!showAddInput && (
      <button className="edit-button" onClick={() => setShowAnnotationList(!showAnnotationList)}>
          {showAnnotationList ? 'Hide' : 'Edit'}
      </button>
    )}

     {/* Display list of annotations with a remove button */}
     {showAnnotationList && (
  <ul className="annotation-list">
  {annotations.slice(0, annotations.length - 1).map((annotation, index) => (
    <li key={index} className="annotation-item">
      {editingIndex === index ? (
        <input
          type="text"
          value={editedAnnotation}
          onChange={(e) => setEditedAnnotation(e.target.value)}
          onBlur={() => handleEditSave(index)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleEditSave(index);
          }}
        />
      ) : (
        <span 
        className="truncate-text"
        title={annotation.name} 
        onDoubleClick={() => handleDoubleClick(index, annotation.name)}>
          {annotation.name}
        </span>
      )}
      <input
        type="color"
        value={annotation.color}
        onChange={(e) => handleColorChange(index, e.target.value)}

      />
      <button className="remove-button" onClick={() => handleRemoveAnnotation(annotation)}>
      Remove
      </button>

    </li>
  ))}
</ul>

)}

<div className="tooth-section">
        <h3>{jaw}</h3>
        <ul className="tooth-list">
          {(jaw === 'UPPER JAW' ? upperJawTeeth : lowerJawTeeth).map((tooth) => (
            <li
              key={tooth.id}
              className={`tooth-item ${selectedTooth === tooth.id ? 'selected' : ''}`}
              onClick={() => handleToothClick(tooth.name)}
            >
              {tooth.name}
              <button
                className="remove-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTooth(tooth.id);
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>

        {/* Add Tooth Section */}
        <div className="add-tooth-section">
          <input
            type="text"
            value={newToothName}
            onChange={(e) => setNewToothName(e.target.value)}
            placeholder="Enter tooth name"
            className="custom-input"
          />
          <button onClick={handleAddTooth} className="add-button">Add Tooth</button>
          {error && <p className="error-message">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default AnnotationPanel;


