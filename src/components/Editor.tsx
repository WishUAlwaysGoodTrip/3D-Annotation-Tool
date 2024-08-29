import React, {FC, Suspense, useRef, useEffect, useState} from 'react';
import {Center, Select} from "@react-three/drei";
import {useLoader, useThree, useFrame, ThreeEvent} from "@react-three/fiber";
import {STLLoader} from "three/examples/jsm/loaders/STLLoader";
import Loader from "./Loader";
import {Raycaster, Vector2, Vector3, Mesh, BufferGeometry, BatchedMesh} from 'three';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';

BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
Mesh.prototype.raycast = acceleratedRaycast;

// @ts-ignore
BatchedMesh.prototype.computeBoundsTree = computeBoundsTree;
// @ts-ignore
BatchedMesh.prototype.disposeBoundsTree = disposeBoundsTree;
BatchedMesh.prototype.raycast = acceleratedRaycast;

const files = ['teeth-new-top.stl']
const color = ['#9c9ea1']
const opacity = [1]



interface Props {
    //setSelected: (objects: Object3D[]) => void;
    setSelectedVertices: (vertices: Vector3[]) => void;
}

const Editor: FC<Props> = ({ /*setSelected,*/ setSelectedVertices }) => {
    //const stl = useLoader(STLLoader, ['teeth-new-top.stl'])
    const group = useRef<any>(null!)
    const { scene, camera, gl } = useThree();
    const raycaster = useRef(new Raycaster());

    const [stl, setStl] = useState<BufferGeometry | null>(null);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        const loader = new STLLoader();
        loader.load(
            files[0],
            (geometry) => setStl(geometry),
            undefined,
            (error) => setError(error.message)
        );
    }, []);

    if (error) {
        return <div style={{ color: 'red' }}>Error loading model: {error}</div>;
    }
    if (!stl) {
        return <Loader />;
    }




    
    const handleClick = (event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
    
        raycaster.current.setFromCamera(
            new Vector2(
                (event.nativeEvent.clientX / window.innerWidth) * 2 - 1,
                -(event.nativeEvent.clientY / window.innerHeight) * 2 + 1
            ),
            camera
        );

        const intersects = raycaster.current.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
            //setSelected([selectedObject]);
            const intersect = intersects[0];
            if (intersect.face && intersect.object instanceof Mesh) {
                const vertex = new Vector3().fromBufferAttribute(
                    intersect.object.geometry.attributes.position,
                    intersect.face.a
                );
            setSelectedVertices([vertex]);
            } else {
            setSelectedVertices([]);
            }
        } else {
            //setSelected([]);
            setSelectedVertices([]);
        }
    };

     return (
        <Suspense fallback={<Loader/>}>
            <Center>
                <group rotation={[-Math.PI / 2, 0, 0]} dispose={null} ref={group} onClick={handleClick}>
                    <mesh scale={1.2} castShadow receiveShadow>
                        <primitive attach="geometry" object={stl}></primitive>
                        <meshStandardMaterial color={color[0]} opacity={opacity[0]} transparent/>
                    </mesh>
                </group>
            </Center>
        </Suspense>
    ) 
}

export default Editor;