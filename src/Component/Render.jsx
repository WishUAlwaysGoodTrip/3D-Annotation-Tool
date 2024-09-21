import React, { useEffect } from 'react';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import useToolbarStore from '../stores/useToolbarStore.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree, CONTAINED, INTERSECTED, NOT_INTERSECTED} from 'three-mesh-bvh';
import { GUI } from 'lil-gui';
// 将 BVH 加速结构的算法方法绑定到 Three.js
THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

// 全局变量声明
let targetMesh;
let scene, camera, renderer, controls;
let cursorCircle, cursorCircleMaterial;
let isPainting = false;
let threeMode = 'dragging'; // 默认模式为拖拽
let gui; // 全局 GUI 变量
let annotationColors = {}; // 保存每个注释的颜色数据
let anotationlistname
const Render = ({file, brushColor, annotationName}) => {
  const { mode } = useToolbarStore();
  useEffect(() => {
    init(); // 初始化 Three.js 场景
    window.addEventListener('resize', onWindowResize);

    // 清除事件监听器和 Three.js 渲染器
    return () => {
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      if (renderer) document.body.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => { 
    threeMode = mode;
    updateControls(); // 根据新的 mode 更新控制
    updateEventListeners(); // 更新事件监听器
  }, [mode]);

     // 监听 file 的变化并加载 STL 模型
  useEffect(() => {
    if (file) {
      loadModel(file); // 加载传入的 STL 文件
    }
  }, [file]); // 当 file 变化时调用

  useEffect(() => {
    if (brushColor) {
      console.log("Brush Color Render:", brushColor); // 调试输出
      updatePaintColor(brushColor); // 更新绘制颜色
    }

    if (annotationName) {
      console.log("Annotation Name Render:", annotationName); // 调试输出
      anotationlistname = annotationName;
      restoreAnnotationColors(annotationName); // 恢复注释的颜色
    }
  }, [brushColor, annotationName]); // 当 brushColor 或 annotationName 变化时调用
  
  return null; // 不需要 React 组件的 DOM 输出，因为渲染完全由 Three.js 控制
};

// 初始化场景和 Three.js 渲染器
function init() {
  scene = new THREE.Scene();

  // 设置相机
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 50, 100);

  // 设置渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x263238, 1);
  renderer.outputEncoding = THREE.sRGBEncoding;
  document.body.appendChild(renderer.domElement);

  // 设置相机控制器
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = true;
  controls.zoomSpeed = 1.0;
  controls.enableRotate = true;
  controls.rotateSpeed = 2.0; // 提高旋转速度
  controls.enablePan = true;
  controls.screenSpacePanning = false; // 确保拖拽方向正确

  // 解除极限角度限制
  controls.minPolarAngle = 0; // 最小极限角度
  controls.maxPolarAngle = Math.PI; // 最大极限角度

  // 允许水平旋转无限制
  controls.minAzimuthAngle = -Infinity; 
  controls.maxAzimuthAngle = Infinity;

  // 设置惯性阻尼
  controls.enableDamping = true; // 启用惯性阻尼
  controls.dampingFactor = 0.1; // 阻尼系数

  // 禁用默认的旋转目标限制
  controls.target.set(0, 0, 0); // 将目标点设置为模型的中心
  controls.enableRotate = true;

  controls.update(); // 更新控制器

  // 添加光源
  const mainLight = new THREE.DirectionalLight(0xffffff, 0.5);
  mainLight.position.set(1, 1, 1);
  scene.add(mainLight);
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
  fillLight.position.set(-5, -5, -5);
  scene.add(fillLight);
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));

  createCursorCircle(); // 创建指示器
  animate(); // 启动动画循环
  addGUI(); // 添加 GUI 控制

  // 添加事件监听器
  updateEventListeners();
}

// 加载 STL 模型
function loadModel(file) {
  const loader = new STLLoader();
  const fileURL = URL.createObjectURL(file); // 将文件转换为URL
  if (targetMesh) {
    scene.remove(targetMesh);
    targetMesh.geometry.dispose();
    targetMesh.material.dispose();
    targetMesh = null;
  }
  loader.load(fileURL, function (geometry) {
    geometry.computeBoundsTree();

    // 检查几何体是否已有颜色属性，如果有，直接使用
    let colorAttr = geometry.getAttribute('color');
    if (!colorAttr) {
      // 如果没有颜色属性，初始化为白色
      const colorArray = new Uint8Array(geometry.attributes.position.count * 3);
      colorArray.fill(255); // 设置为白色
      colorAttr = new THREE.BufferAttribute(colorArray, 3, true);
      geometry.setAttribute('color', colorAttr);
    }

    // 保存原始颜色（无论是已有的还是新建的）
    const originalColors = new Float32Array(colorAttr.array.length);
    for (let i = 0; i < colorAttr.array.length; i++) {
      originalColors[i] = colorAttr.array[i] / 255; // 转换为 0-1 范围
    }
    geometry.userData.originalColors = originalColors; // 保存到 userData 中

    // 创建材质并启用顶点颜色
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0,
      vertexColors: true,
    });

    // 创建网格对象
    targetMesh = new THREE.Mesh(geometry, material);

    // 计算模型的边界盒并将其居中
    const boundingBox = new THREE.Box3().setFromObject(targetMesh);
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    targetMesh.position.sub(center);
    targetMesh.rotation.x = -Math.PI / 2; // 绕 X 轴旋转 90 度

    // 再次调整位置以确保模型仍然在中心
    boundingBox.setFromObject(targetMesh);
    boundingBox.getCenter(center);
    targetMesh.position.sub(center);

    scene.add(targetMesh);
  }, undefined, function (error) {
    console.error('An error occurred while loading the STL file:', error);
  });
}


// 创建指示器圆形
function createCursorCircle() {
  const geometry = new THREE.CircleGeometry(5, 32);
  cursorCircleMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.5 });
  cursorCircle = new THREE.Mesh(geometry, cursorCircleMaterial);

  cursorCircle.position.z = 1; // 初始位置
  scene.add(cursorCircle);
}

// 更新指示器圆形的朝向
function updateCursorCircleOrientation() {
  const cameraDirection = new THREE.Vector3();
  camera.getWorldDirection(cameraDirection);

  cursorCircle.lookAt(camera.position.clone().add(cameraDirection));
}

// 窗口大小调整事件处理
function onWindowResize() {
  if (camera && renderer) {
    // 更新相机的宽高比
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // 更新渲染器大小
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

// 鼠标移动事件处理
function onPointerMove(e) {
  if (threeMode === 'painting' || threeMode === 'erasing') {
    const mouse = new THREE.Vector2();
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // 检查 targetMesh 是否已定义
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



// 鼠标按下事件处理
function onPointerDown(e) {
  if ((threeMode === 'painting' || threeMode === 'erasing') && e.button === 0) { // 左键
    isPainting = true;
  }
}

// 鼠标松开事件处理
function onPointerUp(e) {
  if ((threeMode === 'painting' || threeMode === 'erasing') && e.button === 0) { // 左键
    isPainting = false;
  }
}

// 绘制选定区域
let paintColor = new THREE.Color(255, 0, 0); // 默认绘制颜色为红色

function paintIntersectedArea(intersect, annotationName) {

  const indices = [];
  const tempVec = new THREE.Vector3();

  const inverseMatrix = new THREE.Matrix4();
  inverseMatrix.copy(targetMesh.matrixWorld).invert();

  const circleRadius = cursorCircle.scale.x * 5; // 使用指示器的缩放比例调整绘制半径
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

  const colorAttr = targetMesh.geometry.getAttribute('color');

  // 如果当前注释名称没有记录，则初始化一个新的记录
  if (!annotationColors[annotationName]) {
    annotationColors[annotationName] = new Set(); // 用 Set 存储已涂色的索引
  }

  for (let i = 0, l = indices.length; i < l; i++) {
    const index = targetMesh.geometry.index.getX(indices[i]);
    colorAttr.setXYZ(index, paintColor.r * 255, paintColor.g * 255, paintColor.b * 255);

    // 将绘制的区域保存到注释名称的记录中
    annotationColors[annotationName].add(index);
  }
  colorAttr.needsUpdate = true; // 通知 Three.js 更新颜色
}

function restoreAnnotationColors(annotationName) {
  const colorAttr = targetMesh.geometry.getAttribute('color');

  // 如果 colorAttr 不存在，直接返回，防止错误
  if (!colorAttr) {
    console.warn('No color attribute found on geometry.');
    return;
  }

  // 将所有顶点颜色重置为白色
  console.log("Restoring annotation colors for:", colorAttr); // 调试输出

  for (let i = 0; i < colorAttr.count; i++) {
    colorAttr.setXYZ(i, 1, 1, 1); // 正确设置为白色（范围为 0 到 1）
  }

  // 如果有指定的注释颜色需要恢复
  if (annotationColors[annotationName]) {
    annotationColors[annotationName].forEach(index => {
      colorAttr.setXYZ(index, paintColor.r * 255, paintColor.g * 255, paintColor.b * 255);
    });
  }

  colorAttr.needsUpdate = true; // 通知 Three.js 更新颜色
}


// 更新绘制颜色
function updatePaintColor(color) {
  // 如果 color 是字符串（如 #ffffff），需要将其转换为 THREE.Color
  if (typeof color === 'string') {
    paintColor.set(color); // 使用传入的颜色更新 paintColor
    paintColor.set(color);

    const r = Math.round(paintColor.r * 255);
    const g = Math.round(paintColor.g * 255);
    const b = Math.round(paintColor.b * 255);

    paintColor.setRGB(r, g, b);  
  } else {
    paintColor.set(color);

    const r = Math.round(paintColor.r * 255);
    const g = Math.round(paintColor.g * 255);
    const b = Math.round(paintColor.b * 255);

    paintColor.setRGB(r, g, b);  
  }
}

function eraseIntersectedArea(intersect) {
  const indices = [];
  const tempVec = new THREE.Vector3();

  // 获取目标物体的逆矩阵
  const inverseMatrix = new THREE.Matrix4();
  inverseMatrix.copy(targetMesh.matrixWorld).invert();

  // 使用指示器的缩放比例调整擦除半径
  const circleRadius = cursorCircle.scale.x * 5;
  const sphere = new THREE.Sphere();
  sphere.center.copy(intersect.point).applyMatrix4(inverseMatrix);
  sphere.radius = circleRadius;

  // 使用 BVH 树进行空间查询
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

  // 获取几何体的颜色属性和保存的原始颜色
  const colorAttr = targetMesh.geometry.getAttribute('color');
  const originalColors = targetMesh.geometry.userData.originalColors;

  // 恢复原始颜色
  for (let i = 0, l = indices.length; i < l; i++) {
    const index = targetMesh.geometry.index.getX(indices[i]);
    colorAttr.setXYZ(
      index,
      originalColors[index * 3],
      originalColors[index * 3 + 1],
      originalColors[index * 3 + 2]
    );

    // 删除记录中的已擦除部分
    if (annotationColors[anotationlistname]) {
      annotationColors[anotationlistname].delete(index);
    }
  }
  colorAttr.needsUpdate = true; // 通知 Three.js 更新颜色
}



function addGUI() {
  if (gui) {
    gui.destroy(); // 如果已有 GUI 实例，销毁旧实例
  }

  gui = new GUI(); // 创建新的 GUI 实例
  const params = {
    threeMode: 'dragging',
    cursorOpacity: cursorCircleMaterial.opacity,
    cursorColor: cursorCircleMaterial.color.getHex(),
    cursorSize: 2,
    renderColor: `#${paintColor.getHexString()}`, // 设置绘制颜色
  };

  // 只创建 "Cursor Circle" 和 "Render Color" 控件，而不包括模式切换控件
  const cursorFolder = gui.addFolder('Cursor Circle');
  cursorFolder
    .add(params, 'cursorOpacity', 0, 1)
    .name('Opacity')
    .onChange((value) => (cursorCircleMaterial.opacity = value));
  cursorFolder
    .addColor(params, 'cursorColor')
    .name('Color')
    .onChange((value) => cursorCircleMaterial.color.setHex(value));
  cursorFolder
    .add(params, 'cursorSize', 1, 20)
    .name('Size')
    .onChange((value) => {
      cursorCircle.scale.set(value / 5, value / 5, value / 5);
    });
  cursorFolder.close(); // 确保 "Cursor Circle" 文件夹默认展开 

  // const renderFolder = gui.addFolder('Render Color');
  // renderFolder
  //   .addColor(params, 'renderColor')
  //   .name('Render Color')
  //   .onChange((value) => {
  //     paintColor.set(value);

  //     const r = Math.round(paintColor.r * 255);
  //     const g = Math.round(paintColor.g * 255);
  //     const b = Math.round(paintColor.b * 255);

  //     paintColor.setRGB(r, g, b);
  //   });
  // renderFolder.open();
}

// 更新控制
function updateControls() {
  if (threeMode === 'dragging') {
    controls.enableRotate = true; // 允许旋转
    controls.enableZoom = true;   // 允许缩放
    controls.enablePan = true;    // 允许平移
    console.log("render drag")
  } else {
    controls.enableRotate = false; // 禁止旋转
    controls.enableZoom = false;   // 禁止缩放
    controls.enablePan = false;    // 禁止平移
  }
}

// 更新事件监听器
function updateEventListeners() {
  if (threeMode === 'painting' || threeMode === 'erasing') {
    // 在绘画和擦除模式下都添加事件监听器
    window.addEventListener('pointermove', onPointerMove, false);
    window.addEventListener('pointerdown', onPointerDown, false);
    window.addEventListener('pointerup', onPointerUp, false);
    console.log(`render ${threeMode}`); // 输出当前模式

  } else {
    // 在其他模式下移除事件监听器
    window.removeEventListener('pointermove', onPointerMove, false);
    window.removeEventListener('pointerdown', onPointerDown, false);
    window.removeEventListener('pointerup', onPointerUp, false);

    // 恢复默认光标
    document.body.style.cursor = 'default';
  }
}

// 动画循环
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  updateCursorCircleOrientation();
}

export default Render;
