import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree, CONTAINED, INTERSECTED, NOT_INTERSECTED } from 'three-mesh-bvh';
import { GUI } from 'lil-gui';

THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
let targetMesh;
let scene, camera, renderer, controls;
let cursorCircle, cursorCircleMaterial;
let isPainting = false;
let mode = 'dragging'; // Default mode

function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Set camera position
    camera.position.set(0, 50, 100);

    // Set camera rotation
    camera.rotation.set(Math.PI / 2, 0, 0); // Example: look down slightly

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x263238, 1);
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    const light = new THREE.DirectionalLight(0xffffff, 0.5);
    light.position.set(1, 1, 1);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    setupFileUpload();
    createCursorCircle();
    animate();

    // Call addGUI to initialize the GUI
    addGUI();

   
}


function setupFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const uploadButton = document.getElementById('uploadButton');

    // Trigger the file input click when the upload button is clicked
    uploadButton.addEventListener('click', () => {
        fileInput.click();
    });

    // Listen for file selection
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && file.name.endsWith('.stl')) {
            const fileURL = URL.createObjectURL(file);
            loadModel(fileURL); // Pass the selected file to the loadModel function
        } else {
            console.error('Please upload a valid STL file.');
        }
    });
}
function loadModel(stlPath) {
    const loader = new STLLoader();
    if (targetMesh) {
        scene.remove(targetMesh);
        targetMesh.geometry.dispose();
        targetMesh.material.dispose(); 
        targetMesh = null; 
    }
    loader.load(stlPath, function (geometry) {
        geometry.computeBoundsTree();

        const colorArray = new Uint8Array(geometry.attributes.position.count * 3);
        colorArray.fill(255);
        const colorAttr = new THREE.BufferAttribute(colorArray, 3, true);
        colorAttr.setUsage(THREE.DynamicDrawUsage);
        geometry.setAttribute('color', colorAttr);

        const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0, vertexColors: true });
        targetMesh = new THREE.Mesh(geometry, material);
        scene.add(targetMesh);
    }, undefined, function (error) {
        console.error('An error occurred while loading the STL file:', error);
    });
}

function createCursorCircle() {
    const geometry = new THREE.CircleGeometry(5, 32);
    cursorCircleMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.5 });
    cursorCircle = new THREE.Mesh(geometry, cursorCircleMaterial);
    cursorCircle.position.z = 1; // Ensure it's in front of the scene
    scene.add(cursorCircle);
}

function onPointerMove(e) {
    if (mode === 'painting') {
        const mouse = new THREE.Vector2();
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObject(targetMesh, true);
        if (intersects.length > 0) {
            const intersect = intersects[0];
            cursorCircle.position.copy(intersect.point);

            if (isPainting) {
                paintIntersectedArea(intersect);
            }
        } else {
            cursorCircle.position.set(10000, 10000, 10000); // Move out of view
        }
    }
}

function onPointerDown(e) {
    if (mode === 'painting' && e.button === 0) { // Left mouse button
        isPainting = true;
    }
}

function onPointerUp(e) {
    if (mode === 'painting' && e.button === 0) { // Left mouse button
        isPainting = false;
    }
}

let paintColor = new THREE.Color(1, 0, 0); // 默认颜色为红色

function paintIntersectedArea(intersect) {
    const indices = [];
    const tempVec = new THREE.Vector3();

    const inverseMatrix = new THREE.Matrix4();
    inverseMatrix.copy(targetMesh.matrixWorld).invert();

    const circleRadius = cursorCircle.scale.x * 5; // 使用cursorCircle的缩放比例来调整绘制半径
    const sphere = new THREE.Sphere();
    sphere.center.copy(intersect.point).applyMatrix4(inverseMatrix);
    sphere.radius = circleRadius;

    targetMesh.geometry.boundsTree.shapecast({
        intersectsBounds: box => {
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
    colorAttr.needsUpdate = true;
}


function addGUI() {
    const gui = new GUI();
    const params = {
        mode: 'dragging',
        cursorOpacity: cursorCircleMaterial.opacity,
        cursorColor: cursorCircleMaterial.color.getHex(),
        cursorSize: 5,
        renderColor: paintColor.getHex() // 这是用于设置绘制颜色的参数
    };

    gui.add(params, 'mode', ['painting', 'dragging']).name('Mode').onChange(value => {
        mode = value;
        updateControls();
        updateEventListeners();
    });

    const cursorFolder = gui.addFolder('Cursor Circle');
    cursorFolder.add(params, 'cursorOpacity', 0, 1).name('Opacity').onChange(value => cursorCircleMaterial.opacity = value);
    cursorFolder.addColor(params, 'cursorColor').name('Color').onChange(value => cursorCircleMaterial.color.setHex(value));
    cursorFolder.add(params, 'cursorSize', 1, 20).name('Size').onChange(value => {
        cursorCircle.scale.set(value / 5, value / 5, value / 5);
    });
    cursorFolder.open();

    const renderFolder = gui.addFolder('Render Color');
    renderFolder.addColor(params, 'renderColor').name('Render Color').onChange(value => {
        if (typeof value === 'string') {
            paintColor.set(value); // Handle string color values
        } else {
            paintColor.setHex(value); // Handle hex color values
        }
    });
    renderFolder.open();
}



function updateControls() {
    if (mode === 'dragging') {
        controls.enableRotate = true; // Allow rotation
        controls.enableZoom = true;   // Allow zoom
        controls.enablePan = true;    // Allow panning
    } else {
        controls.enableRotate = false; // Disable rotation
        controls.enableZoom = false;   // Disable zoom
        controls.enablePan = false;     // Disable panning
    }
}

function updateEventListeners() {
    if (mode === 'painting') {
        window.addEventListener('pointermove', onPointerMove, false);
        window.addEventListener('pointerdown', onPointerDown, false);
        window.addEventListener('pointerup', onPointerUp, false);
    } else {
        window.removeEventListener('pointermove', onPointerMove, false);
        window.removeEventListener('pointerdown', onPointerDown, false);
        window.removeEventListener('pointerup', onPointerUp, false);
    }
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

init();
