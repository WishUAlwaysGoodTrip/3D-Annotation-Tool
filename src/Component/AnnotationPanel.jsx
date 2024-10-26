import React, { useState, useEffect } from 'react';
import '../AnnotationPanel.css'; // Assuming you'll create a CSS file for the styles
import { ipcRenderer } from 'electron';
import fs from 'fs';
import path from 'path';
import Store from 'electron-store';

let annotationStore
function createAnnotationStore(filename) {
  const filenameWithoutExtension = path.basename(filename, '.stl');
  return new Store({
    name: filenameWithoutExtension,
    cwd: path.join(process.cwd(), 'public', 'datasettest'),
  });
}
const AnnotationPanel = ({ onColorChange, onToothColorChange, onTeethDataChange, file}) => {

  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const [annotations, setAnnotations] = useState([
    { name: 'ADD...', color: '#af2828' }
  ]);
  const [listHeight, setListHeight] = useState(window.innerHeight * 0.55); // 默认高度
  const [selectedToothId, setSelectedToothId] = useState(null);
  const [newAnnotation, setNewAnnotation] = useState('');
  const [newColor, setNewColor] = useState('#af2828');
  const [showAddInput, setShowAddInput] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // 保存正在编辑的注释索引
  const [editedAnnotation, setEditedAnnotation] = useState(''); // 保存编辑中的注释名称
  const [showAnnotationList, setShowAnnotationList] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [highlightedTeeth, setHighlightedTeeth] = useState(new Set()); // 用于存储高亮的牙齿ID
  const [isEditing, setIsEditing] = useState(false); 
  const [teeth, setTeeth] = useState(() =>
    Array.from({ length: 16 }, (_, i) => ({
      id: i + 1,
      color: '#ffffff', // 默认颜色
      annotations: [],
    }))
  );

  const togglePanelVisibility = () => {
    setIsPanelVisible(!isPanelVisible);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault(); // 防止默认的 Tab 行为
        setSelectedToothId((prevId) => {
          const nextId = prevId === null ? 1 : (prevId % teeth.length) + 1; // 循环选择
          handleToothAction(nextId); // 触发点击事件
          return nextId;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [teeth.length]);


  useEffect(() => {
    console.log('useEffect triggered');
    if (file) {
      // 创建 annotationStore 实例
      annotationStore = createAnnotationStore(file.name);
      if (annotationStore) {
        // 获取存储中的 toothPaintData
        const storedToothPaintData = annotationStore.get('toothPaintData') || {};
        console.log('Stored Tooth Paint Data:', storedToothPaintData);
  
        // 获取存储中的 annotations
        const storedAnnotations = Object.values(storedToothPaintData).flatMap(
          (tooth) => tooth.annotations || []
        );
  
        // 合并存储中的 annotations，避免重复，并确保初始值 'ADD...' 不被包含在合并中
        const combinedAnnotations = [...new Set(storedAnnotations.filter(
          (storedAnnotation) => storedAnnotation !== 'ADD...' && storedAnnotation !== null
        ))];

        setAnnotations([...combinedAnnotations.map((annotation) => ({
          name: annotation,
          color: '#af2828', // 默认颜色，如果需要可从其他地方获取颜色信息
        })), { name: 'ADD...', color: '#af2828' }]);

         // 格式化 teeth 数据
         const formattedTeethData = Array.from({ length: 16 }, (_, i) => {
          const toothId = i + 1;
          const storedToothData = storedToothPaintData[toothId] || {};
          return {
            id: toothId,
            color: storedToothData.paintData?.[0]?.color 
              ? `#${((1 << 24) + (storedToothData.paintData[0].color.r << 16) + (storedToothData.paintData[0].color.g << 8) + storedToothData.paintData[0].color.b).toString(16).slice(1)}` 
              : '#ffffff', // 从 paintData 中取第一个颜色作为默认颜色，格式化为 #RRGGBB
            annotations: storedToothData.annotations || [], // 如果存储中没有 annotations，使用空数组
          };
        });
  
        // 更新 teeth 状态
        setTeeth(formattedTeethData);
        console.log('Formatted Teeth Data:', formattedTeethData);

        // 根据 paintData 的值更新 highlightedTeeth
        const newHighlightedTeeth = new Set();
        for (const toothId in storedToothPaintData) {
          if (storedToothPaintData[toothId].paintData && storedToothPaintData[toothId].paintData.length > 0) {
            newHighlightedTeeth.add(toothId);
          }
        }
        setHighlightedTeeth(newHighlightedTeeth); // 更新 highlightedTeeth

      }
    }
  }, [file]);

  const handleEditButtonClick = () => {
    setIsEditing(!isEditing); // 切换编辑模式
  };

  const handleAddTooth = () => {
    setTeeth(prevTeeth => {
      // Get the next tooth ID as before
      const ids = prevTeeth.map(tooth => tooth.id).sort((a, b) => a - b);
      let newId = 1;
      for (let i = 0; i < ids.length; i++) {
        if (ids[i] !== i + 1) {
          newId = i + 1;
          break;
        } else {
          newId = ids.length + 1;
        }
      }
  
      const newTooth = {
        id: newId, // Using the smallest missing ID
        color: '#ffffff', // Default color
        annotations: [],
      };
  
      // Return a new sorted array of teeth
      return [...prevTeeth.concat(newTooth)].sort((a, b) => a.id - b.id);
    });
  };
  
  const handleRemoveTooth = (id) => {
    setTeeth(prevTeeth => prevTeeth.filter(tooth => tooth.id !== id));
    setSelectedToothId(null); // 取消选择被删除的牙齿
  };


  useEffect(() => {
    const handleWindowResize = () => {
      setListHeight(window.innerHeight * 0.55); // 根据窗口高度设置列表高度
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

    // 每次 teeth 数据变化时，将数据传递给父组件
    useEffect(() => {
      onTeethDataChange(teeth);
    }, [teeth]);

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
    setTeeth(prevTeeth => {
      return prevTeeth.map(tooth => {
        if (tooth.id === id) {
          const updatedTooth = {
            ...tooth,
            color: newColor || tooth.color,
            annotations: [...tooth.annotations]
          };

          // 如果当前有选择的注释，添加到牙齿注释中
          if (selectedAnnotation && selectedAnnotation.name !== 'ADD...' && !updatedTooth.annotations.some(ann => ann.name === selectedAnnotation.name)) {
            updatedTooth.annotations.push({
              name: selectedAnnotation.name,
              color: selectedAnnotation.color
            });
          }

          return updatedTooth;
        }
        return tooth;
      });
    });

    setSelectedToothId(id);
    console.log('selectedAnnotation', selectedAnnotation);

    // 传递牙齿ID和新颜色给父组件（Render组件）                         
    const tooth = teeth.find(tooth => tooth.id === id);
    const colorToPass = newColor || (tooth ? tooth.color : '#ffffff');
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
    <div>
      {isPanelVisible ? (
        <div className="annotation-panel">
          <button onClick={togglePanelVisibility} className="toggle-panel-button">
            -
          </button>
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
                    className="color-input-hidden"
                  />
                  <button className="remove-button" onClick={() => handleRemoveAnnotation(annotation)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        <div className="tooth-container">
          <div className="tooth-list" style={{ maxHeight: `${listHeight}px` }}>
            {teeth.map((tooth) => (
              <div 
                key={tooth.id} 
                className={`tooth-item ${tooth.id === selectedToothId ? 'selected' : ''}`} 
                onClick={() => handleToothAction(tooth.id)}
              >
                <input
                  type="color"
                  value={tooth.color}
                  onChange={(e) => handleToothAction(tooth.id, e.target.value)}
                  className="teeth-color" 
                />
                <span style={{ color: highlightedTeeth.has(tooth.id.toString()) ? 'green' : '' }}>Tooth {tooth.id}</span>
                
                {isEditing && (
                  <button className="remove-button" onClick={(e) => { e.stopPropagation(); handleRemoveTooth(tooth.id); }}>
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

          <div className="annotation-panel-footer">
            <button className="edit-button" onClick={handleEditButtonClick}>
              {isEditing ? 'Hide' : 'Edit'}
            </button>
            {isEditing && (
              <button className="edit-button" onClick={handleAddTooth}>
                Add Tooth
              </button>
            )}
        </div>
      </div>
      ): (
        <button onClick={togglePanelVisibility} className="show-panel-button">
          +
        </button>
      )}
    </div>
  );
};


export default AnnotationPanel;