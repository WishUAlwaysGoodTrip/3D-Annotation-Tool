import {FC} from "react";
import {Object3D, Vector3} from "three";

interface Props {
    //selected: Object3D[] | undefined;
    selectedVertices: Vector3[];
}

export const Panel: FC<Props> = ({/*selected*/ selectedVertices}) => {

    return (
        <div style={{ position: 'absolute', top: 10, left: 10, color: 'white', backgroundColor: 'rgba(0,0,0,0.5)', padding: 10 }}>
          
          <h3>Vertics:</h3>
          {selectedVertices.length > 0 ? (
            <ul>
              {selectedVertices.slice(0, 5).map((vertex, index) => (
                <li key={index}>
                  x: {vertex.x.toFixed(2)}, y: {vertex.y.toFixed(2)}, z: {vertex.z.toFixed(2)}
                </li>
              ))}
              {selectedVertices.length > 5 && <li>... other {selectedVertices.length - 5} vertices</li>}
            </ul>
          ) : (
            <p>No Vertices Selected</p>
          )}
        </div>
      );
};

/*
export const useControls = (selected, props) => {
    const store = useCreateStore()
    const isFirst = selected[0] === store
    const materialProps = useControlsImpl(
        Object.keys(props).reduce(
            (acc, key) => ({
                ...acc,
                [key]: {
                    ...props[key],
                    transient: false,
                    onChange: (value, path, ctx) =>
                        !ctx.initial && isFirst && selected.length > 1 && selected.forEach((s, i) => i > 0 && s.setValueAtPath(path, value)),
                    render: (get) => selected.length === 1 || selected.every((store) => store.getData()[key])
                }
            }),
            {}
        ),
        {store},
        [selected]
    )
    return [store, materialProps]
}
*/