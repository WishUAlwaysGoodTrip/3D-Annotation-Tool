import {Suspense, useState} from 'react';
import {OrbitControls, PerspectiveCamera} from '@react-three/drei'
import Loader from "./components/Loader";
import Editor from "./components/Editor";
import {Canvas} from "@react-three/fiber";
import {Object3D, Vector3} from "three";
import {Panel} from "./components/Panel";


function App() {
    //const [selected, setSelected] = useState<Object3D[]>()
    const [selectedVertices, setSelectedVertices] = useState<Vector3[]>([])

    return (
        <div className='App'>
            <Canvas style={{backgroundColor: 'white'}}>
                <Suspense fallback={<Loader/>}>
                    <PerspectiveCamera makeDefault fov={60} aspect={window.innerWidth / window.innerHeight}
                                       position={[3, 0.15, 3]} near={1} far={5000} position-z={600}>
                    </PerspectiveCamera>
                    <Editor /*setSelected={setSelected} */
                        setSelectedVertices={setSelectedVertices}
                    />
                    <directionalLight color={0xffddcc} position={[1, 0.75, 0.5]} intensity={2.0}/>
                    <directionalLight color={0xccccff} position={[-1, 0.75, -0.5]} intensity={2.0}/>
                    <ambientLight intensity={1.0}/>
                </Suspense>
                <OrbitControls/>
            </Canvas>
            <Panel /*selected={selected}*/ selectedVertices={selectedVertices}/>
        </div>
    );
}

export default App
