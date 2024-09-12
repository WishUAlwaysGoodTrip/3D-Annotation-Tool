import React, { useEffect } from 'react';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import useModeStore from '../stores/useModeStore';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  acceleratedRaycast, 
  computeBoundsTree, 
  disposeBoundsTree, 
  CONTAINED, 
  INTERSECTED, 
  NOT_INTERSECTED 
} from 'three-mesh-bvh';
import { GUI } from 'lil-gui';

const Render = ({file}) => {
  const { mode } = useModeStore();
  useEffect(() => {
    init(); // 初始化 Three.js 场景

    // 清除事件监听器和 Three.js 渲染器
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      if (renderer) document.body.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => { 
    threeMode = mode;
    console.log("render mode change")
    updateControls(); // 根据新的 mode 更新控制
    updateEventListeners(); // 更新事件监听器
  }, [mode]);
   // 仅在 incomingMode 变化时运行

     // 监听 file 的变化并加载 STL 模型
  useEffect(() => {
    if (file) {
      loadModel(file); // 加载传入的 STL 文件
    }
  }, [file]); // 当 file 变化时调用
  return null; // 不需要 React 组件的 DOM 输出，因为渲染完全由 Three.js 控制
};

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
  const fileURL = URL.createObjectURL(file);  // 将文件转换为URL
  if (targetMesh) {
    scene.remove(targetMesh);
    targetMesh.geometry.dispose();
    targetMesh.material.dispose(); 
    targetMesh = null; 
  }
  loader.load(fileURL, function (geometry) {
    geometry.computeBoundsTree();

    // 初始化颜色属性
    const colorArray = new Uint8Array(geometry.attributes.position.count * 3);
    colorArray.fill(255); // 使用白色作为初始颜色
    const colorAttr = new THREE.BufferAttribute(colorArray, 3, true);
    colorAttr.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('color', colorAttr);

    // 创建材质并启用顶点颜色
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0,
      vertexColors: true, // 使用顶点颜色
    });

    // 创建网格对象
    targetMesh = new THREE.Mesh(geometry, material);

    // 计算模型的边界盒并将其居中
    const boundingBox = new THREE.Box3().setFromObject(targetMesh);
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    targetMesh.position.sub(center);
        // 旋转模型
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

// 鼠标移动事件处理
function onPointerMove(e) {
  if (threeMode === 'painting') {
    const mouse = new THREE.Vector2();
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(targetMesh, true);
    if (intersects.length > 0) {
      const intersect = intersects[0];
      cursorCircle.position.copy(intersect.point);
          // 隐藏光标
      document.body.style.cursor = 'none'; 

      if (isPainting) {
        paintIntersectedArea(intersect);
      }
    } else {
      cursorCircle.position.set(10000, 10000, 10000); // 将指示器移动到视野外
      document.body.style.cursor = 'default'; 
    }

    updateCursorCircleOrientation();
  }
}

// 鼠标按下事件处理
function onPointerDown(e) {
  if (threeMode === 'painting' && e.button === 0) { // 左键
    isPainting = true;
  }
}

// 鼠标松开事件处理
function onPointerUp(e) {
  if (threeMode === 'painting' && e.button === 0) { // 左键
    isPainting = false;
  }
}

// 绘制选定区域
let paintColor = new THREE.Color(255, 0, 0); // 默认绘制颜色为红色

function paintIntersectedArea(intersect) {
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
  for (let i = 0, l = indices.length; i < l; i++) {
    const index = targetMesh.geometry.index.getX(indices[i]);
    colorAttr.setXYZ(index, paintColor.r * 255, paintColor.g * 255, paintColor.b * 255);
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
  cursorFolder.open(); // 确保 "Cursor Circle" 文件夹默认展开

  const renderFolder = gui.addFolder('Render Color');
  renderFolder
    .addColor(params, 'renderColor')
    .name('Render Color')
    .onChange((value) => {
      paintColor.set(value);

      const r = Math.round(paintColor.r * 255);
      const g = Math.round(paintColor.g * 255);
      const b = Math.round(paintColor.b * 255);

      paintColor.setRGB(r, g, b);
    });
  renderFolder.open();
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
  if (threeMode === 'painting') {
    window.addEventListener('pointermove', onPointerMove, false);
    window.addEventListener('pointerdown', onPointerDown, false);
    window.addEventListener('pointerup', onPointerUp, false);
    console.log("render painting")

  } else {
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
