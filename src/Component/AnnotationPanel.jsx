import React, { useState, useEffect } from 'react';
import '../AnnotationPanel.css'; // Assuming you'll create a CSS file for the styles
import { ipcRenderer } from 'electron';
import fs from 'fs';
import path from 'path';

const AnnotationPanel = ({ onColorChange, onToothColorChange, onTeethDataChange}) => {
  const [annotations, setAnnotations] = useState([
    { name: 'ADD...', color: '#af2828' }
  ]);
  const [dirname, setDirname] = useState('');
  const [filename, setFilename] = useState('');
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
  const [teeth, setTeeth] = useState([
    { id: 1, color: '#ffffff', annotations: [] },
    { id: 2, color: '#ffffff', annotations: [] },
    { id: 3, color: '#ffffff', annotations: [] },
    { id: 4, color: '#ffffff', annotations: [] },
    { id: 5, color: '#ffffff', annotations: [] },
    { id: 6, color: '#ffffff', annotations: [] },
    { id: 7, color: '#ffffff', annotations: [] },
    { id: 8, color: '#ffffff', annotations: [] },
    { id: 9, color: '#ffffff', annotations: [] },
    { id: 10, color: '#ffffff', annotations: [] },
    { id: 11, color: '#ffffff', annotations: [] },
    { id: 12, color: '#ffffff', annotations: [] },
    { id: 13, color: '#ffffff', annotations: [] },
    { id: 14, color: '#ffffff', annotations: [] },
    { id: 15, color: '#ffffff', annotations: [] }, 
    { id: 16, color: '#ffffff', annotations: [] }  
  ]);

  useEffect(() => {
    const handleFileSelected = (event, fileData) => {
      setFilename(fileData.name)
    };

    // 监听 'file-selected' 事件
    ipcRenderer.on('file-selected', handleFileSelected);

    // 在组件卸载时移除监听
    return () => {
      ipcRenderer.removeListener('file-selected', handleFileSelected);
    };
  }, []);


  useEffect(() => {
    const dir = ipcRenderer.sendSync('get-dirname');  // 同步请求 __dirname
    setDirname(dir);  // 设置状态以存储 dirname
  }, []);


  useEffect(() => {
    // 读取 JSON 文件并检查牙齿是否存在
    const jsonFilePath = path.join(dirname, 'public', 'datasettest', filename.replace(".stl",".json"));
    console.log(jsonFilePath)
    // 读取 JSON 文件
    fs.readFile(jsonFilePath, 'utf-8', (err, data) => {
      if (err) {
        console.error('Error reading JSON file:', err);
        return;
      }

      const annotations = JSON.parse(data);
      setAnnotations(getAnnotationsFromData(annotations));
      checkTeethExistence(annotations); // 检查牙齿是否存在
    });
  }, [filename]);

  const checkTeethExistence = (data) => {
    const existingTeeth = new Set();

    // Check if toothPaintData exists in the input data
    if (data.toothPaintData) {
      // 遍历 toothPaintData，检查每个牙齿是否有颜色数据
      for (const toothId in data.toothPaintData) {
        console.log(toothId)
        if (data.toothPaintData.hasOwnProperty(toothId)) {
          const paintEntries = data.toothPaintData[toothId];
          
          // Check if there are any entries for this tooth ID
          if (Array.isArray(paintEntries) && paintEntries.length > 0) {
            existingTeeth.add(toothId); // 将存在的牙齿 ID 添加到集合中
          }
        }
      }
    }
      setHighlightedTeeth(existingTeeth); // 更新高亮牙齿的状态
    };

    useEffect(() => {
      console.log('Updated highlightedTeeth:', highlightedTeeth);
    }, [highlightedTeeth]);

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


    const getAnnotationsFromData = (data) => {
      const newAnnotations = Object.keys(data.annotationColors).map(key => ({
        name: key,
        color: data.annotationColors[key].color || '#af2828' // Default color if not specified
      }));
  
      // Add "ADD..." annotation at the end
      newAnnotations.push({ name: 'ADD...', color: '#af2828' });
      return newAnnotations;
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
      <div className="tooth-list" style={{ maxHeight: `${listHeight}px` }}>
        {teeth.map((tooth) => {
          console.log(highlightedTeeth)
          console.log(tooth.id)
          return(
          <div 
            key={tooth.id} 
            className={`tooth-item ${tooth.id === selectedToothId ? 'selected' : ''} `}  // 添加 selected 类
            onClick={() => handleToothAction(tooth.id)}  // 只传递牙齿ID，不传递新颜色
            
          >
            <span style={{ color: highlightedTeeth.has(tooth.id.toString()) ? 'green' : '' }}>Tooth {tooth.id}</span>
            <input
              type="color"
              value={tooth.color}
              onChange={(e) => handleToothAction(tooth.id, e.target.value)}  // 传递牙齿ID和新的颜色
              className="teeth-color" 

            />
          </div>
          );
      })}
      </div>
    </div>
  );
};

export default AnnotationPanel;