import React, { useEffect } from 'react';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import useToolbarStore from '../stores/useToolbarStore.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree, CONTAINED, INTERSECTED, NOT_INTERSECTED} from 'three-mesh-bvh';
import { GUI } from 'lil-gui';
import { update } from 'three/examples/jsm/libs/tween.module.js';
import { debounce } from 'lodash';
import Store from 'electron-store';
import path from 'path';
import {buildFaceAdjacencyMap, findShortestPath} from '../Util/findPathAStar.js';
const { ipcRenderer } = window.require('electron');


// Generate a corresponding Store instance based on the STL file name
function createAnnotationStore(stlFilename) {
  const filenameWithoutExtension = path.basename(stlFilename, '.stl');
  return new Store({
    name: filenameWithoutExtension,
    cwd: path.join(process.cwd(), 'public', 'datasettest'),
  });
}

// Bind the algorithm method of BVH acceleration structure to Three.js
THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

let targetMesh;
let scene, camera, renderer, controls;
let cursorCircle, cursorCircleMaterial;
let isPainting = false;
let threeMode = 'dragging'; // The default mode is drag and drop
let gui; 
let annotationColors = {}; // Save color data for each annotation
let toothPaintData = {}; // Save the color data corresponding to each tooth ID
let anotationlistname
let selectedToothId; // The currently selected tooth ID
let selectedPoint;
let annotationStore;
let selectedPoints = []; // Array to store all highlight points
let selectedFaceLines = [];
let previousSelectedFace = null;
let previousToothId = null;
let previousToothColor = null;
let adjacencyMap = null;
let paintColor = new THREE.Color(255, 0, 0); // The default color for drawing is red
let edgeLines = null; //edge lines in paint mode


const Render = ({file, brushColor, annotationName, toothColor, toothId, teethData}) => {
  const { mode, wireFrame } = useToolbarStore();
  const { cursorOpacity, cursorColor, cursorSize,  cursorShape } = useToolbarStore();

  const updateOpacity = debounce((opacity) => {
    if (cursorCircleMaterial) {
      cursorCircleMaterial.opacity = opacity;
    }
  }, 100);

  const updateColor = debounce((color) => {
    if (cursorCircleMaterial) {
      cursorCircleMaterial.color.set(color);
    }
  }, 100);

  const updateSize = debounce((size) => {
    if (cursorCircle) {
      cursorCircle.scale.set(size / 5, size / 5, size / 5);
    }
  }, 100);

  const updateCursorShape = (shape) => {
    if (cursorCircle) {
      scene.remove(cursorCircle);  
    }
    createCursorCircle(shape); 
  };
  

  useEffect(() => {
    init(); 
    window.addEventListener('resize', onWindowResize);

    // Clear event listener and Three.js renderer
    return () => {
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      if (renderer) document.body.removeChild(renderer.domElement);

      clearHighlightPoints()
    };
  }, []);

  useEffect(() => { 
    threeMode = mode;
    updateControls(); 
    updateEventListeners(); 
  }, [mode]);


  useEffect(() => {
    if (file) {
      annotationStore = createAnnotationStore(file.name);
      if (annotationStore) {
        annotationColors = annotationStore.get('annotationColors') || {};
        toothPaintData = annotationStore.get('toothPaintData') || {};
  
        // Ensure that 'toothPaintData' conforms to the new structure
        Object.keys(toothPaintData).forEach((toothId) => {
          const data = toothPaintData[toothId];
          if (!data.annotations) {
            data.annotations = [];
          }
          if (!data.paintData) {
            data.paintData = [];
          }
          if (!data.faceLinesData) {
            data.faceLinesData = [];
          }
        });
  
        loadModel(file); // Load the incoming STL file
      } else {
        console.warn('Failed to create annotationStore');
      }
    }
  }, [file]);
  


  useEffect(() => {
    if (annotationName) {
      anotationlistname = annotationName;
      // restoreAnnotationColors(annotationName);
      restoreAnnotation(annotationName,teethData); // Restore the color of annotations
    }
  }, [annotationName]); // Call when brushColor or annotationName changes

  useEffect(() => {
    if (toothId) {
      if (previousToothId !== toothId) {
        // If the ID changes, execute the function to restore the original color
        selectedToothId = toothId;
        updatePaintColor(toothColor); // Update drawing color
        restoreToothColors(selectedToothId); // Restore coloring
        restoreLineSelections(selectedToothId)
        console.log("ID changed, restoring tooth color:", toothColor, selectedToothId);
      } else if (previousToothColor !== toothColor) {
        // If the color changes but the ID remains unchanged, execute a new color update function
        updatePaintColor(toothColor); // Update drawing color
        restoreToothWithNewColor(toothId); // Coloring teeth with new colors
        restoreLineSelections(toothId)
        console.log("Color changed, updating tooth with new color:", toothColor, toothId);
      }
  
      // Update previewToothId and previewToothColor
      previousToothId = toothId;
      previousToothColor = toothColor;
    }
  }, [toothColor, toothId]); // Call when toothColor or toothId changes

  useEffect(() => {

    // Traverse teethData and merge annotations into toothPaintData
    teethData.forEach((tooth) => {
      const { id, annotations } = tooth;
      // Initialize or retrieve the existing annotation names from toothPaintData
      if (!toothPaintData[id]) {
        toothPaintData[id] = {
          annotations: [],
          paintData: [],
          faceLinesData: []
        };
      }
    
      // Use a Set to store unique annotation names
      const existingAnnotationNames = new Set(toothPaintData[id].annotations);
      // Add each annotation name from teethData to the Set
      annotations.forEach((name) => existingAnnotationNames.add(name));
      // Convert Set back to an array and store it in toothPaintData
      toothPaintData[id].annotations = Array.from(existingAnnotationNames).filter(name => name !== undefined);
    });
    console.log('Tooth paint data:', toothPaintData);
  }, [teethData]); // Call when teethData changes
  
  

  useEffect(() => {
    // Save data event handling function
    function handleSaveData() {
      // Save data to persistent storage
      if (annotationStore) {
        annotationStore.set('toothPaintData', toothPaintData); // Save new data structure
          
        console.log('Annotation and tooth paint data saved.');
        ipcRenderer.send('save-complete');
      } else {
        console.warn('annotationStore is not defined. Data cannot be saved.');
      }
    }

    ipcRenderer.on('save-data', handleSaveData);
  
    return () => {
      ipcRenderer.removeListener('save-data', handleSaveData);
    };
  }, [annotationStore, toothPaintData]);
  
  // Use useEffect to listen to cursorOpacity and call debounce function
  useEffect(() => {
    updateOpacity(cursorOpacity);
  }, [cursorOpacity]);

  useEffect(() => {
    updateColor(cursorColor);
  }, [cursorColor]);

  useEffect(() => {
    updateSize(cursorSize);
  }, [cursorSize]);

//  useEffect(() => {
//    if (cursorShape) {
//      updateCursorShape(cursorShape);  
//    }
//  }, [cursorShape]); 

  // Monitor changes in cursorShape while keeping other states unchanged
  useEffect(() => {
    if (cursorShape) {
      updateCursorShape(cursorShape);  // Only update cursor shape
    }
    // Manually call updateOpacity, updateColor, and updateSize to ensure that these properties remain unchanged
    updateOpacity(cursorOpacity);
    updateColor(cursorColor);
    updateSize(cursorSize);
}, [cursorShape]);  // Monitor changes in cursorShape

  useEffect(() => {
    if(targetMesh){
      updateEdgeLines();
    }
  }, [wireFrame]);


  return null; // No need for DOM output from React components, as rendering is completely controlled by Three.js
};



// Initialize the scene and Three.js renderer
function init() {
  scene = new THREE.Scene();

  // Set camera
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 50, 100);

  // Set up renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x263238, 1);
  renderer.outputEncoding = THREE.sRGBEncoding;
  document.body.appendChild(renderer.domElement);

  // Set camera controller
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = true;
  controls.zoomSpeed = 1.0;
  controls.enableRotate = true;
  controls.rotateSpeed = 2.0; // Increase rotation speed
  controls.enablePan = true;
  controls.screenSpacePanning = false; // Ensure that the drag direction is correct

  // Release the limit angle restriction
  controls.minPolarAngle = 0; 
  controls.maxPolarAngle = Math.PI; 

  // Allow unlimited horizontal rotation
  controls.minAzimuthAngle = -Infinity; 
  controls.maxAzimuthAngle = Infinity;

  // Set inertia damping
  controls.enableDamping = true; 
  controls.dampingFactor = 0.1; 

  // Disable default rotation target restrictions
  controls.target.set(0, 0, 0); // Set the target point as the center of the model
  controls.enableRotate = true;

  controls.update(); 

  // Add light source
  const mainLight = new THREE.DirectionalLight(0xffffff, 0.5);
  mainLight.position.set(1, 1, 1);
  scene.add(mainLight);
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
  fillLight.position.set(-5, -5, -5);
  scene.add(fillLight);
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));

  createCursorCircle(); // Create indicator
  animate(); 
  // addGUI(); 

  updateEventListeners();
}

// Load STL model
function loadModel(file) {
  const loader = new STLLoader();
  const fileURL = URL.createObjectURL(file); // Convert files to URLs
  if (targetMesh) {
    scene.remove(targetMesh);
    targetMesh.geometry.dispose();
    targetMesh.material.dispose();
    targetMesh = null;
  }
  loader.load(fileURL, function (geometry) {
    geometry.computeBoundsTree();

    // Check if the geometry already has color attributes, and if so, use them directly
    let colorAttr = geometry.getAttribute('color');
    if (!colorAttr) {
      // If there is no color attribute, initialize to white
      const colorArray = new Uint8Array(geometry.attributes.position.count * 3);
      colorArray.fill(255); 
      colorAttr = new THREE.BufferAttribute(colorArray, 3, true);
      geometry.setAttribute('color', colorAttr);
    }

    // Save the original color (whether existing or newly created)
    const originalColors = new Float32Array(colorAttr.array.length);
    for (let i = 0; i < colorAttr.array.length; i++) {
      originalColors[i] = colorAttr.array[i] / 255; 
    }
    geometry.userData.originalColors = originalColors; // Save to userData
    
    // Create materials and enable vertex colors
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0,
      vertexColors: true,
    });

    // Create a grid object
    targetMesh = new THREE.Mesh(geometry, material);
    adjacencyMap = buildFaceAdjacencyMap(geometry);

    // Calculate the boundary box of the model and center it
    const boundingBox = new THREE.Box3().setFromObject(targetMesh);
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    targetMesh.position.sub(center);

    targetMesh.rotation.x = -Math.PI / 2; // Rotate 90 degrees around the X-axis
    // Adjust the position again to ensure that the model is still centered
    boundingBox.setFromObject(targetMesh);
    boundingBox.getCenter(center);
    targetMesh.position.sub(center);

    scene.add(targetMesh);

    // After the model is loaded, restore the annotations and tooth color
    if (annotationColors) {
      Object.keys(annotationColors).forEach((annotationName) => {
        // restoreAnnotationColors(annotationName);
        // restoreAnnotation(annotationName,teethData); 
      });
    }

    if (toothPaintData && selectedToothId) {
      restoreToothColors(selectedToothId);
    }
  }, undefined, function (error) {
    console.error('An error occurred while loading the STL file:', error);
  });
}
// 绘制选定区域
function paintIntersectedArea(intersect, annotationName) {
  const indices = [];
  const tempVec = new THREE.Vector3();

  const inverseMatrix = new THREE.Matrix4();
  inverseMatrix.copy(targetMesh.matrixWorld).invert();

  const circleRadius = cursorCircle.scale.x * 5; 
  const sphere = new THREE.Sphere();
  sphere.center.copy(intersect.point).applyMatrix4(inverseMatrix);
  sphere.radius = circleRadius;

  targetMesh.geometry.boundsTree.shapecast({
    intersectsBounds: (box) => {
      const intersects = sphere.intersectsBox(box);
      return intersects ? INTERSECTED : NOT_INTERSECTED;
    },
    intersectsTriangle: (tri, i, contained) => {
      if (contained || tri.intersectsSphere(sphere)) {
        const i3 = 3 * i;
        indices.push(i3, i3 + 1, i3 + 2);
      }
      return false;
    }
  });

  const colorAttr = targetMesh.geometry.getAttribute('color');

  // Ensure annotationColors[annotationName] is a Set
  if (!(annotationColors[annotationName] instanceof Set)) {
    annotationColors[annotationName] = new Set();
  }

  // Check if annotationName is already in annotations, if not, add it
  if (!toothPaintData[selectedToothId].annotations.includes(annotationName)) {
    toothPaintData[selectedToothId].annotations.push(annotationName);
  }

  // Check if there's an existing entry with the same color
  let colorEntry = toothPaintData[selectedToothId].paintData.find(
    entry => entry.color.r === paintColor.r && entry.color.g === paintColor.g && entry.color.b === paintColor.b
  );

  // If no existing entry is found, create a new one
  if (!colorEntry) {
    colorEntry = {
      indices: [],
      color: {
        r: paintColor.r,
        g: paintColor.g,
        b: paintColor.b
      }
    };
    toothPaintData[selectedToothId].paintData.push(colorEntry);
  }

  // Add all indices to the color entry
  for (let i = 0, l = indices.length; i < l; i++) {
    const index = targetMesh.geometry.index.getX(indices[i]);
    colorAttr.setXYZ(index, paintColor.r * 255, paintColor.g * 255, paintColor.b * 255);
    colorEntry.indices.push(index);
  }
  

  colorAttr.needsUpdate = true; // Notify Three.js to update colors
}

function restoreAnnotation(annotationName, teethData) {
  const colorAttr = targetMesh.geometry.getAttribute('color');
  console.log("Restoring annotation colors for:", annotationName); 
  console.log("Teeth Data:", teethData); 

  // Check if colorAttr exists
  if (!colorAttr) {
    console.warn('No color attribute found on geometry.');
    return;
  }

  // Reset all vertex colors to white
  for (let i = 0; i < colorAttr.count; i++) {
    colorAttr.setXYZ(i, 1, 1, 1); // Set to white
  }

  // Traverse each tooth data and restore color based on annotation names
  teethData.forEach((tooth) => {
    // Check if the teeth contain the specified annotation name
    if (tooth.annotations.includes(annotationName)) {
      const paintData = toothPaintData[tooth.id]?.paintData;
      
      if (Array.isArray(paintData)) {
        paintData.forEach(({ indices, color }) => {
          // Ensure that color exists and indices are an array
          if (color && Array.isArray(indices)) {
            indices.forEach((index) => {
              // Restore the color to the specified index position
              colorAttr.setXYZ(index, color.r * 255, color.g * 255, color.b * 255);
            });
          }
        });
      }
      restoreLineSelections(tooth.id);
    }

  });

  colorAttr.needsUpdate = true; 
}

function restoreToothColors(toothId) {
  const colorAttr = targetMesh.geometry.getAttribute('color');
  if (!colorAttr) return;

  for (let i = 0; i < colorAttr.count; i++) {
    colorAttr.setXYZ(i, 1, 1, 1); // 设置为白色
  }
  if (toothPaintData[toothId] && Array.isArray(toothPaintData[toothId].paintData)) {
    toothPaintData[toothId].paintData.forEach(({ indices, color }) => {
      indices.forEach((index) => {
        colorAttr.setXYZ(index, color.r * 255, color.g * 255, color.b * 255);
      });
    });
    colorAttr.needsUpdate = true;
  }
}

function restoreToothWithNewColor(toothId) {
  const colorAttr = targetMesh.geometry.getAttribute('color');
  if (!colorAttr) {
    console.warn('No color attribute found on geometry.');
    return;
  }

  // Clear the current color and restore it to white
  for (let i = 0; i < colorAttr.count; i++) {
    colorAttr.setXYZ(i, 1, 1, 1);
  }

  console.log("Restoring tooth colors for:", paintColor); 

  // If there is color data related to the current tooth ID, restore these data
  if (toothPaintData[toothId] && Array.isArray(toothPaintData[toothId].paintData)) {
    toothPaintData[toothId].paintData.forEach(({ indices, color }) => {
      if (Array.isArray(indices) && color) {
        indices.forEach((index) => {
          colorAttr.setXYZ(index, paintColor.r * 255, paintColor.g * 255, paintColor.b * 255);
        });
      }
    });
  }

  // Update the color information in 'paintData' to apply the new 'paintColor'`
  if (toothPaintData[toothId]) {
    toothPaintData[toothId].paintData = toothPaintData[toothId].paintData.map(({ indices }) => ({
      indices: indices,
      color: { r: paintColor.r, g: paintColor.g, b: paintColor.b }
    }));
  }
  colorAttr.needsUpdate = true;
}



// Update drawing color
function updatePaintColor(color) {
  // console.log("Update Paint Color:", color); 
  // If color is a string (such as # ffffff), it needs to be converted to THREE Color
  if (typeof color === 'string') {
    paintColor.set(color);
    // console.log("Paint Color:", paintColor); 
    const r = Math.round(paintColor.r * 255);
    const g = Math.round(paintColor.g * 255);
    const b = Math.round(paintColor.b * 255);

    paintColor.setRGB(r, g, b);  
    console.log("Paint Color:", paintColor);
    // console.log("Paint Color:", paintColor); 
  } else {
    paintColor = color;
    console.log("Paint Color1:", paintColor);
  }
}

// Erase the selected area to restore the original color of the object
function eraseIntersectedArea(intersect) {
  const indices = [];
  const tempVec = new THREE.Vector3();

  const inverseMatrix = new THREE.Matrix4();
  inverseMatrix.copy(targetMesh.matrixWorld).invert();

  const circleRadius = cursorCircle.scale.x * 5;
  const sphere = new THREE.Sphere();
  sphere.center.copy(intersect.point).applyMatrix4(inverseMatrix);
  sphere.radius = circleRadius;

  targetMesh.geometry.boundsTree.shapecast({
    intersectsBounds: (box) => {
      const intersects = sphere.intersectsBox(box);
      if (intersects) {
        const { min, max } = box;
        for (let x = 0; x <= 1; x++) {
          for (let y = 0; y <= 1; y++) {
            for (let z = 0; z <= 1; z++) {
              tempVec.set(
                x === 0 ? min.x : max.x,
                y === 0 ? min.y : max.y,
                z === 0 ? min.z : max.z
              );
              if (!sphere.containsPoint(tempVec)) {
                return INTERSECTED;
              }
            }
          }
          return CONTAINED;
        }
      }
      return intersects ? INTERSECTED : NOT_INTERSECTED;
    },
    intersectsTriangle: (tri, i, contained) => {
      if (contained || tri.intersectsSphere(sphere)) {
        const i3 = 3 * i;
        indices.push(i3, i3 + 1, i3 + 2);
      }
      return false;
    }
  });

  // Retrieve the color properties of the geometry and save the original color
  const colorAttr = targetMesh.geometry.getAttribute('color');
  const originalColors = targetMesh.geometry.userData.originalColors;

  // Use asynchronous batch updating of raw colors
  setTimeout(() => {
    const indicesToRemove = new Set(indices.map(index => targetMesh.geometry.index.getX(index)));
  
    // 批量更新所有索引的颜色
    indicesToRemove.forEach((idx) => {
      colorAttr.setXYZ(
        idx,
        originalColors[idx * 3],
        originalColors[idx * 3 + 1],
        originalColors[idx * 3 + 2]
      );
    });
  
    // 从 'paintData' 和 'faceLinesData' 中移除对应索引
    if (toothPaintData[selectedToothId]) {
      const paintData = toothPaintData[selectedToothId].paintData;
      if (Array.isArray(paintData)) {
        paintData.forEach((paint) => {
          paint.indices = paint.indices.filter((i) => !indicesToRemove.has(i));
        });
      }
  
      const faceLinesData = toothPaintData[selectedToothId].faceLinesData;
      if (Array.isArray(faceLinesData)) {
        faceLinesData.forEach((line) => {
          line.indices = line.indices.filter((i) => !indicesToRemove.has(i));
        });
      }
    }
  
    // 通知 Three.js 更新颜色
    colorAttr.needsUpdate = true;
  }, 0);
  

}

// Create indicator circles or rectangles
function createCursorCircle(cursorShape) {

  let geometry;

  if (cursorShape === 'circle') {
    geometry = new THREE.CircleGeometry(5, 32);  // Circle geometry
  } else if (cursorShape === 'rectangle') {
    geometry = new THREE.PlaneGeometry(10, 10);  // Rectangle geometry
  }

  cursorCircleMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.5, depthTest:false });
  cursorCircle = new THREE.Mesh(geometry, cursorCircleMaterial);
  cursorCircle.renderOrder =1;
  cursorCircle.position.z = 1; 
  scene.add(cursorCircle);
}

// Update the orientation of the indicator circle
function updateCursorCircleOrientation() {
  const cameraDirection = new THREE.Vector3();
  camera.getWorldDirection(cameraDirection);

  cursorCircle.lookAt(camera.position.clone().add(cameraDirection));
}

// Window size adjustment event handling
function onWindowResize() {
  if (camera && renderer) {
    // Update the aspect ratio of the camera
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

  }
}

// Mouse movement event handling
function onPointerMove(e) {
  if (threeMode === 'painting' || threeMode === 'erasing') {
    const mouse = new THREE.Vector2();
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Check if the targetMesh has been defined
    if (targetMesh) {
      const intersects = raycaster.intersectObject(targetMesh, true);
      if (intersects.length > 0) {
        const intersect = intersects[0];
        cursorCircle.position.copy(intersect.point);
        document.body.style.cursor = 'none';

        if (isPainting) {
          if (threeMode === 'painting') {
            paintIntersectedArea(intersect, anotationlistname);
          } else if (threeMode === 'erasing') {
            eraseIntersectedArea(intersect);
          }
        }
      } else {
        cursorCircle.position.set(10000, 10000, 10000);
        document.body.style.cursor = 'default';
      }
    }

    updateCursorCircleOrientation();
  }
}



// Mouse press event handling
function onPointerDown(e) {
  if ((threeMode === 'painting' || threeMode === 'erasing') && e.button === 0) { 
    isPainting = true;
    const mouse = new THREE.Vector2();
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Check if the click is on the model
    if (targetMesh) {
      const intersects = raycaster.intersectObject(targetMesh, true);
      if (intersects.length > 0) {
        const intersect = intersects[0];
        if (threeMode === 'painting') {
          paintIntersectedArea(intersect, anotationlistname); 
        } else if (threeMode === 'erasing') {
          eraseIntersectedArea(intersect); 
        }
      }
    }
  } else if(threeMode === 'point'&& e.button === 0){
    const mouse = new THREE.Vector2();
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Check if the click is on the model
    if (targetMesh) {
      const intersects = raycaster.intersectObject(targetMesh, true);
      if (intersects.length > 0) {
        const intersect = intersects[0];
        if (!e.ctrlKey) {
          clearHighlightPoints();
        }
        createHighlightPoint(intersect);
      }
    }
  } else if (threeMode === 'line' && e.button === 0) {
    const mouse = new THREE.Vector2();
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    if (targetMesh) {
      const intersects = raycaster.intersectObject(targetMesh, true);

      if (intersects.length > 0) {
        const intersect = intersects[0];
        const faceIndex = intersect.faceIndex; // Get the index of clicked faces

        // Coloring the clicked surface
        colorFace(faceIndex);

        if (previousSelectedFace != null && e.ctrlKey) {
          // If Ctrl is pressed, find the shortest path and color it
          const pathFaces = findShortestPath(previousSelectedFace, faceIndex, targetMesh.geometry, adjacencyMap);
          pathFaces.forEach(idx => {
            colorFace(idx);
          });
        }

        previousSelectedFace = faceIndex; // Update the previous selected face
      }
    }
  }
}


// Mouse Release Event Handling
function onPointerUp(e) {
  if ((threeMode === 'painting' || threeMode === 'erasing') && e.button === 0) { // 左键
    isPainting = false;
  }
}

function colorFace(faceIndex) {
  const colorAttr = targetMesh.geometry.getAttribute('color');
  if (!colorAttr) return;
  
  const indices = targetMesh.geometry.index;
  const i0 = indices.getX(faceIndex * 3);
  const i1 = indices.getX(faceIndex * 3 + 1);
  const i2 = indices.getX(faceIndex * 3 + 2);
  
  // Apply color to the face vertices
  colorAttr.setXYZ(i0, paintColor.r * 255, paintColor.g * 255, paintColor.b * 255);
  colorAttr.setXYZ(i1, paintColor.r * 255, paintColor.g * 255, paintColor.b * 255);
  colorAttr.setXYZ(i2, paintColor.r * 255, paintColor.g * 255, paintColor.b * 255);
  
  colorAttr.needsUpdate = true;
  
  // Check if an entry with the same color already exists in faceLinesData
  let colorEntry = toothPaintData[selectedToothId].faceLinesData.find(
    entry => entry.color.r === paintColor.r && entry.color.g === paintColor.g && entry.color.b === paintColor.b
  );
  
  // If no matching color entry exists, create a new one
  if (!colorEntry) {
    colorEntry = {
      indices: [], // Ensure this is initialized as an array
      color: {
        r: paintColor.r,
        g: paintColor.g,
        b: paintColor.b
      }
    };
    toothPaintData[selectedToothId].faceLinesData.push(colorEntry);
  }
  
  // Append indices of the current face to the existing color entry, if not already present
  const newIndices = [i0, i1, i2];
  newIndices.forEach(index => {
    if (!colorEntry.indices.includes(index)) {
      colorEntry.indices.push(index);
    }
  });
    
}


function restoreLineSelections(toothId) {
  if (!targetMesh.geometry) return;
  const colorAttr = targetMesh.geometry.getAttribute('color');
  if (!colorAttr) return;

  // Ensure `toothPaintData` and `faceLinesData` for the specified toothId exist
  const faceLinesData = toothPaintData[toothId]?.faceLinesData;
  if (faceLinesData && Array.isArray(faceLinesData)) {
    faceLinesData.forEach(({ indices, color }) => {
      // Loop through each stored index and set the color
      indices.forEach((index) => {
        colorAttr.setXYZ(index, paintColor.r * 255, paintColor.g * 255, paintColor.b * 255);
      });
    });

    colorAttr.needsUpdate = true; // Notify Three.js to update colors
  }
}



function clearHighlightPoints() {
  if (selectedPoints && selectedPoints.length > 0) {
    for (let i = 0; i < selectedPoints.length; i++) {
      scene.remove(selectedPoints[i]);
      selectedPoints[i].geometry.dispose();
      selectedPoints[i].material.dispose();
    }
    selectedPoints = [];
  }
}
function findNearestVertex(intersect) {
  const geometry = intersect.object.geometry;
  const positionAttribute = geometry.attributes.position;

  let closestVertex = new THREE.Vector3();
  let minDistance = Infinity;

  // Get the indices of the intersected face (triangle)
  const faceIndices = [
    intersect.face.a,
    intersect.face.b,
    intersect.face.c
  ];

  // Iterate over the vertices of the intersected face
  for (let i = 0; i < 3; i++) {
    const vertexIndex = faceIndices[i];
    const vertex = new THREE.Vector3().fromBufferAttribute(positionAttribute, vertexIndex);
    vertex.applyMatrix4(intersect.object.matrixWorld); // Apply world transformation

    const distance = intersect.point.distanceTo(vertex);
    if (distance < minDistance) {
      minDistance = distance;
      closestVertex.copy(vertex);
    }
  }

  return closestVertex;
}

function createHighlightPoint(intersect) {
  const positionAttribute = targetMesh.geometry.getAttribute("position");
  const indexAttribute = targetMesh.geometry.getIndex();

  let totalArea = 0;
  const faceCount = indexAttribute.count / 3; // Every 3 indices form a face

  // Traverse each face, calculate the area and accumulate it
  for (let i = 0; i < faceCount; i++) {
    const a = indexAttribute.getX(i * 3);
    const b = indexAttribute.getX(i * 3 + 1);
    const c = indexAttribute.getX(i * 3 + 2);

    const vA = new THREE.Vector3().fromBufferAttribute(positionAttribute, a);
    const vB = new THREE.Vector3().fromBufferAttribute(positionAttribute, b);
    const vC = new THREE.Vector3().fromBufferAttribute(positionAttribute, c);

    // Calculate the area of each face using the triangle area formula
    const area = new THREE.Triangle(vA, vB, vC).getArea();
    totalArea += area;
  }

  // Calculate the average surface area
  const averageFaceArea = totalArea / faceCount;
  const pointSize = Math.sqrt(averageFaceArea) * 0.2; // Adjust size using the square root ratio

  // Find the nearest vertex to the intersection point
  const nearestVertexPosition = findNearestVertex(intersect);

  // Create a new highlight point at the nearest vertex
  const geometry = new THREE.SphereGeometry(pointSize, 16, 16); // Adjust size as needed
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Adjust color as needed
  selectedPoint = new THREE.Mesh(geometry, material);
  selectedPoint.position.copy(nearestVertexPosition);
  scene.add(selectedPoint);

  selectedPoints.push(selectedPoint);
}

// Function to add or remove edge lines based on the current mode
function updateEdgeLines() {
  console.log(threeMode)
  if (!edgeLines) {
    // draw edges on the mesh
    edgeLines = addEdgesToScene(targetMesh);
  } else if (edgeLines) {
    // Remove edge lines
    targetMesh.remove(edgeLines); // Remove the edge lines from the mesh
    edgeLines.geometry.dispose(); // Dispose of geometry to free memory
    edgeLines.material.dispose(); // Dispose of material
    edgeLines = null; // Reset variable
  }
}

// Function to create edges for the scene
function addEdgesToScene() {
  const geometry = targetMesh.geometry;
  const positions = geometry.attributes.position;
  const edgesVertices = []; // Array to store all edges

  // Loop through each face to add edges
  for (let i = 0; i < positions.count; i += 3) {
    // Get the indices for each vertex in the face
    const v1 = new THREE.Vector3().fromBufferAttribute(positions, i);
    const v2 = new THREE.Vector3().fromBufferAttribute(positions, i + 1);
    const v3 = new THREE.Vector3().fromBufferAttribute(positions, i + 2);

    // Add lines for each edge of the triangle
    edgesVertices.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
    edgesVertices.push(v2.x, v2.y, v2.z, v3.x, v3.y, v3.z);
    edgesVertices.push(v3.x, v3.y, v3.z, v1.x, v1.y, v1.z);
  }

  // Create a BufferGeometry for edges
  const edgesGeometry = new THREE.BufferGeometry();
  edgesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(edgesVertices, 3));

  // Create material and line segments
  const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
  const completeEdges = new THREE.LineSegments(edgesGeometry, edgesMaterial);

  completeEdges.raycast = () => {}; // Disable raycasting on edges
  targetMesh.add(completeEdges); // Add edges to the mesh
  return completeEdges;
}

// update control
function updateControls() {
  if (threeMode === 'dragging') {
    controls.enableRotate = true; 
    controls.enableZoom = true; 
    controls.enablePan = true;   
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    }
    console.log("render drag")
  } else {
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.mouseButtons = {
      MIDDLE: THREE.MOUSE.ROTATE,
      RIGHT: THREE.MOUSE.PAN
    }
    controls.domElement.addEventListener('wheel', (event) => {
      event.preventDefault(); // 防止页面滚动
      controls.dollyIn(Math.pow(0.95, event.deltaY * 0.1));
      controls.update();
    });
  }
}

// Update event listener
function updateEventListeners() {
  window.removeEventListener('pointermove', onPointerMove, false);
  window.removeEventListener('pointerdown', onPointerDown, false);
  window.removeEventListener('pointerup', onPointerUp, false);

  if (threeMode === 'painting' || threeMode === 'erasing') {
    window.addEventListener('pointermove', onPointerMove, false);
    window.addEventListener('pointerdown', onPointerDown, false);
    window.addEventListener('pointerup', onPointerUp, false);
    console.log(`render ${threeMode}`);

  } else if (threeMode === 'point'|| threeMode === 'line') {
    //window.addEventListener('pointermove', onPointerMove, false);
    window.addEventListener('pointerdown', onPointerDown, false);
    document.body.style.cursor = 'default';
    console.log(`render ${threeMode}`); 
  } else {
    // In other modes, no special event handling is required, only the default cursor needs to be restored
    document.body.style.cursor = 'default';
  }
}

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  updateCursorCircleOrientation();
}

export default Render;
