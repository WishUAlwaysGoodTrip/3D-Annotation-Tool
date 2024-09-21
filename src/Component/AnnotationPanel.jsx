import React, { useState, useEffect } from 'react';
import '../AnnotationPanel.css'; // Assuming you'll create a CSS file for the styles

const AnnotationPanel = ({ onColorChange,onToothColorChange }) => {
  const [annotations, setAnnotations] = useState([
    { name: 'ADD...', color: '#af2828' }
  ]);
  const [selectedToothId, setSelectedToothId] = useState(null);
  const [newAnnotation, setNewAnnotation] = useState('');
  const [newColor, setNewColor] = useState('#af2828');
  const [showAddInput, setShowAddInput] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // 保存正在编辑的注释索引
  const [editedAnnotation, setEditedAnnotation] = useState(''); // 保存编辑中的注释名称
  const [clickTimer, setClickTimer] = useState(null); // 用于区分单击和双击
  const [showAnnotationList, setShowAnnotationList] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [teeth, setTeeth] = useState([
    { id: 1, color: '#ffffff' },
    { id: 2, color: '#ffffff' },
    { id: 3, color: '#ffffff' },
    { id: 4, color: '#ffffff' },
    { id: 5, color: '#ffffff' },
    { id: 6, color: '#ffffff' },
    { id: 7, color: '#ffffff' },
    { id: 8, color: '#ffffff' },
    { id: 9, color: '#ffffff' },
    { id: 10, color: '#ffffff' },
    { id: 11, color: '#ffffff' },
    { id: 12, color: '#ffffff' },
    { id: 13, color: '#ffffff' },
    { id: 14, color: '#ffffff' },
    { id: 15, color: '#800080' }, // Pre-set color example
    { id: 16, color: '#555555' }  // Pre-set color example
  ]);
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
        onColorChange(selectedAnn.color, selectedAnn.name); // 调用回调函数，传递颜色和名字
      }
    }
  };
  
  const handleColorChange = (index, color) => {
    const updatedAnnotations = [...annotations];
    updatedAnnotations[index].color = color;
    setAnnotations(updatedAnnotations);
  
    // 检查当前选择的注释名称是否匹配，然后更新颜色
    if (selectedAnnotation && updatedAnnotations[index].name === selectedAnnotation.name) {
      onColorChange(color, updatedAnnotations[index].name);
    }
  };
  
  const handleToothAction = (id, newColor = null) => {
    // 如果传入 newColor 表示是颜色修改，否则是点击事件
    const updatedTeeth = teeth.map(tooth =>
      tooth.id === id ? { ...tooth, color: newColor || tooth.color } : tooth
    );
    setTeeth(updatedTeeth);
  
     // 更新选中的牙齿ID
     setSelectedToothId(id);
     
    // 如果有新的颜色则传递颜色，否则传递当前牙齿的颜色
    const colorToPass = newColor || updatedTeeth.find(tooth => tooth.id === id).color;
    
    // 传递牙齿ID和新颜色给父组件（Render组件）
    onToothColorChange(id, colorToPass);
  };
  

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
      <div className="tooth-list">
        {teeth.map((tooth) => (
          <div 
            key={tooth.id} 
            className={`tooth-item ${tooth.id === selectedToothId ? 'selected' : ''}`}  // 添加 selected 类
            onClick={() => handleToothAction(tooth.id)}  // 只传递牙齿ID，不传递新颜色
            >
            <span>Tooth {tooth.id}</span>
            <input
              type="color"
              value={tooth.color}
              onChange={(e) => handleToothAction(tooth.id, e.target.value)}  // 传递牙齿ID和新的颜色
              className="teeth-color" 
            />
            {/* <div className="circle" style={{ backgroundColor: tooth.color }}></div> */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnnotationPanel;


