import {Html, useProgress} from "@react-three/drei";

const Loader = () => {
    const {progress} = useProgress()

    return (
        <Html center>
            <span style={{color: "white"}}>
            Loading... {Math.floor(progress)}%
            </span>
        </Html>
    );
};
//{Math.floor(progress)} % loaded
export default Loader;