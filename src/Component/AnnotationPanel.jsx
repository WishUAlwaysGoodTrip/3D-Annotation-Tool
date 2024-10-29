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
// AnnotationPanel component: used to display and manage annotation panels, allowing users to add, delete, and edit tooth annotations
const AnnotationPanel = ({ onColorChange, onToothColorChange, onTeethDataChange, file}) => {

  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const [annotations, setAnnotations] = useState([
    { name: 'ADD...', color: '#af2828' }
  ]);
  const [listHeight, setListHeight] = useState(window.innerHeight * 0.55);
  const [selectedToothId, setSelectedToothId] = useState(null);
  const [newAnnotation, setNewAnnotation] = useState('');
  const [newColor, setNewColor] = useState('#af2828');
  const [showAddInput, setShowAddInput] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); 
  const [editedAnnotation, setEditedAnnotation] = useState('');
  const [showAnnotationList, setShowAnnotationList] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [highlightedTeeth, setHighlightedTeeth] = useState(new Set()); // Store highlighted tooth IDs
  const [isEditing, setIsEditing] = useState(false); 
  const [teeth, setTeeth] = useState(() =>
    Array.from({ length: 16 }, (_, i) => ({
      id: i + 1,
      color: '#ffffff', // Default color
      annotations: [],
    }))
  );

  const togglePanelVisibility = () => {
    setIsPanelVisible(!isPanelVisible);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault(); // Prevent default tab behavior
        setSelectedToothId((prevId) => {
          const nextId = prevId === null ? 1 : (prevId % teeth.length) + 1; // Loop selection
          handleToothAction(nextId); // Trigger click event
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
      // Create an AnnotateStore instance
      annotationStore = createAnnotationStore(file.name);
      if (annotationStore) {
        // Retrieve toothPaintData
        const storedToothPaintData = annotationStore.get('toothPaintData') || {};
        console.log('Stored Tooth Paint Data:', storedToothPaintData);
  
        // Retrieve annotations from the storage
        const storedAnnotations = Object.values(storedToothPaintData).flatMap(
          (tooth) => tooth.annotations || []
        );
  
        // Merge annotations from storage to avoid duplication and ensure initial values of 'ADD...' Not included in the merge
        const combinedAnnotations = [...new Set(storedAnnotations.filter(
          (storedAnnotation) => storedAnnotation !== 'ADD...' && storedAnnotation !== null
        ))];

        setAnnotations([...combinedAnnotations.map((annotation) => ({
          name: annotation,
          color: '#af2828', // Default color, color information can be obtained from elsewhere if needed
        })), { name: 'ADD...', color: '#af2828' }]);

         // Format tee data
         const formattedTeethData = Array.from({ length: 16 }, (_, i) => {
          const toothId = i + 1;
          const storedToothData = storedToothPaintData[toothId] || {};
          return {
            id: toothId,
            color: storedToothData.paintData?.[0]?.color 
              ? `#${((1 << 24) + (storedToothData.paintData[0].color.r << 16) + (storedToothData.paintData[0].color.g << 8) + storedToothData.paintData[0].color.b).toString(16).slice(1)}` 
              : '#ffffff', // Take the first color from PaintData as the default color and format it as # RRGGBB
            annotations: storedToothData.annotations || [], // If there are no annotations in the storage, use an empty array
          };
        });
  
        // Update teeth status
        setTeeth(formattedTeethData);
        console.log('Formatted Teeth Data:', formattedTeethData);

        // Update highlightedTeeth based on the value of paintData
        const newHighlightedTeeth = new Set();
        for (const toothId in storedToothPaintData) {
          if (storedToothPaintData[toothId].paintData && storedToothPaintData[toothId].paintData.length > 0) {
            newHighlightedTeeth.add(toothId);
          }
        }
        setHighlightedTeeth(newHighlightedTeeth); // Update highlightedTeeth

      }
    }
  }, [file]);

  const handleEditButtonClick = () => {
    setIsEditing(!isEditing); // Switch editing mode
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
    setSelectedToothId(null); // Deselect deleted teeth
  };


  useEffect(() => {
    const handleWindowResize = () => {
      setListHeight(window.innerHeight * 0.55); 
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

    // Pass the data to the parent component every time the teeth data changes
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
        onColorChange(selectedAnn.color, selectedAnn.name); // Call callback function, pass color and name
      }
    }
  };
  
  const handleColorChange = (index, color) => {
    const updatedAnnotations = [...annotations];
    updatedAnnotations[index].color = color;
    setAnnotations(updatedAnnotations);
  
    // Check if the currently selected annotation name matches, and then update the color
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

          // If there are currently selected annotations, add them to the teeth annotation
          if (selectedAnnotation && selectedAnnotation.name !== 'ADD...' && !updatedTooth.annotations.includes(selectedAnnotation.name)) {
            updatedTooth.annotations.push(selectedAnnotation.name);
          }
          

          return updatedTooth;
        }
        return tooth;
      });
    });

    setSelectedToothId(id);
    // console.log('selectedAnnotation', selectedAnnotation);

    // Pass the tooth ID and new color to the parent component (Render component)                         
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
    onColorChange(newAnnotationObj.color, newAnnotationObj.name); // Call callback function when adding comments
  }
};
  
  const handleRemoveAnnotation = (annotationToRemove) => {
    setAnnotations(annotations.filter(annotation => annotation.name !== annotationToRemove.name));
    setSelectedAnnotation(null); // Cancel the currently selected comment
  };
  
  // Start editing comments
  const handleDoubleClick = (index, annotation) => {
    setEditingIndex(index); 
    setEditedAnnotation(annotation); 
  };
  const handleEditSave = (index) => {
    const updatedAnnotations = [...annotations];
    // Update annotation name and keep color unchanged
    updatedAnnotations[index] = { name: editedAnnotation, color: updatedAnnotations[index].color };
    setAnnotations(updatedAnnotations);
    setEditingIndex(null); 

    // Update the color to the edited annotation color
    onColorChange(updatedAnnotations[index].color);
    setSelectedAnnotation(updatedAnnotations[index]);
  };
  

  return (
    <div>
      {isPanelVisible ? (
        <div className="annotation-panel">
          <button onClick={togglePanelVisibility} className="toggle-panel-button">
            {">"}
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
                <span style={{ backgroundColor: highlightedTeeth.has(tooth.id.toString()) ? '#d3d3d3' : '' }}>Tooth {tooth.id}</span>
                
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
          {'<'}
        </button>
      )}
    </div>
  );
};


export default AnnotationPanel;