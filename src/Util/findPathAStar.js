//findPathAStar.js
import * as THREE from 'three';

export function buildFaceAdjacencyMap(geometry) {
    const adjacencyMap = {};

    const position = geometry.attributes.position;
    const indexAttr = geometry.index;
    const faceCount = indexAttr ? indexAttr.count / 3 : position.count / 9;

    const vertexToFaceMap = {};

    // Define a function to obtain the keys of vertices, use coordinates, and handle accuracy issues
    function getVertexKey(index) {
        const x = position.getX(index);
        const y = position.getY(index);
        const z = position.getZ(index);
        const precision = 8;
        const key = `${x.toFixed(precision)}_${y.toFixed(precision)}_${z.toFixed(precision)}`;
        return key;
    }

    // Step 1: Establish a mapping relationship between each vertex and a face based on the vertex's position
    for (let faceIndex = 0; faceIndex < faceCount; faceIndex++) {
        let aIndex, bIndex, cIndex;

        if (indexAttr) {
            // Index Geometry
            aIndex = indexAttr.getX(faceIndex * 3);
            bIndex = indexAttr.getX(faceIndex * 3 + 1);
            cIndex = indexAttr.getX(faceIndex * 3 + 2);
        } else {
            // Non indexed geometry
            aIndex = faceIndex * 3;
            bIndex = faceIndex * 3 + 1;
            cIndex = faceIndex * 3 + 2;
        }

        const aKey = getVertexKey(aIndex);
        const bKey = getVertexKey(bIndex);
        const cKey = getVertexKey(cIndex);

        [aKey, bKey, cKey].forEach(vertexKey => {
            if (!vertexToFaceMap[vertexKey]) {
                vertexToFaceMap[vertexKey] = [];
            }
            vertexToFaceMap[vertexKey].push(faceIndex);
        });

        // Initialize adjustyMap [faceIndex] as an empty array
        adjacencyMap[faceIndex] = [];
    }

    // Step 2: Traverse each face and check which faces are adjacent (sharing two vertices=adjacent edges)
    for (let faceIndex = 0; faceIndex < faceCount; faceIndex++) {
        let aIndex, bIndex, cIndex;

        if (indexAttr) {
            aIndex = indexAttr.getX(faceIndex * 3);
            bIndex = indexAttr.getX(faceIndex * 3 + 1);
            cIndex = indexAttr.getX(faceIndex * 3 + 2);
        } else {
            aIndex = faceIndex * 3;
            bIndex = faceIndex * 3 + 1;
            cIndex = faceIndex * 3 + 2;
        }

        const aKey = getVertexKey(aIndex);
        const bKey = getVertexKey(bIndex);
        const cKey = getVertexKey(cIndex);

        const adjacentFaces = new Set();

        // Create a function to count the number of vertices shared by two faces
        function countSharedVertices(faceVertices, adjFaceIndex) {
            const sharedVertices = faceVertices.filter(vKey => vertexToFaceMap[vKey].includes(adjFaceIndex));
            return sharedVertices.length;
        }

        const faceVertices = [aKey, bKey, cKey];

        // Traverse the adjacent faces of each vertex and check if they share two vertices
        faceVertices.forEach(vertexKey => {
            vertexToFaceMap[vertexKey].forEach(adjFaceIndex => {
                if (adjFaceIndex !== faceIndex) {
                    const sharedVerticesCount = countSharedVertices(faceVertices, adjFaceIndex);
                    if (sharedVerticesCount === 2) {
                        adjacentFaces.add(adjFaceIndex);
                    }
                }
            });
        });

        adjacencyMap[faceIndex] = Array.from(adjacentFaces);

        // Debugging output, printing the adjacent relationships of the first few faces
        /*if (faceIndex < 10) {
            console.log(`Face ${faceIndex} has adjacent faces: ${Array.from(adjacentFaces)}`);
            if (adjacencyMap[faceIndex].length === 0) {
                console.warn(`Face ${faceIndex} has no adjacent faces!`);
            }
        }

         */
    }

    return adjacencyMap;
}

export function findShortestPath(startFaceIndex, endFaceIndex, geometry, adjacencyMap = buildFaceAdjacencyMap(geometry)) {
    console.log(`Starting A* from face ${startFaceIndex} to face ${endFaceIndex}`);
    const positionAttr = geometry.attributes.position;
    const indexAttr = geometry.index;
    const faceCount = indexAttr ? indexAttr.count / 3 : positionAttr.count / 9;

    //const adjacencyMap = buildFaceAdjacencyMap(geometry);
    console.log("Adjacency map built successfully.");

    const faceCentroids = new Array(faceCount);
    for (let i = 0; i < faceCount; i++) {
        let a, b, c;

        if (indexAttr) {
            a = indexAttr.getX(i * 3);
            b = indexAttr.getX(i * 3 + 1);
            c = indexAttr.getX(i * 3 + 2);
        } else {
            a = i * 3;
            b = i * 3 + 1;
            c = i * 3 + 2;
        }

        const vA = new THREE.Vector3().fromBufferAttribute(positionAttr, a);
        const vB = new THREE.Vector3().fromBufferAttribute(positionAttr, b);
        const vC = new THREE.Vector3().fromBufferAttribute(positionAttr, c);

        const centroid = new THREE.Vector3();
        centroid.add(vA).add(vB).add(vC).divideScalar(3);
        faceCentroids[i] = centroid;
    }
    console.log("Centroids calculated.");
    const openSet = new Set();
    openSet.add(startFaceIndex);

    const cameFrom = {};

    const gScore = {};
    const fScore = {};

    for (let i = 0; i < faceCount; i++) {
        gScore[i] = Infinity;
        fScore[i] = Infinity;
    }

    gScore[startFaceIndex] = 0;
    fScore[startFaceIndex] = heuristicCostEstimate(startFaceIndex, endFaceIndex);

    while (openSet.size > 0) {
        let current = null;
        let lowestFScore = Infinity;
        for (let faceIdx of openSet) {
            if (fScore[faceIdx] < lowestFScore) {
                lowestFScore = fScore[faceIdx];
                current = faceIdx;
            }
        }
        //console.log(`Currently evaluating face: ${current}`);
        if (current === endFaceIndex) {
            const path = reconstructPath(cameFrom, current);
            console.log(`Path found: ${path}`);
            return path;
        }

        openSet.delete(current);

        const neighbors = adjacencyMap[current];
        for (let neighbor of neighbors) {
            //const tentativeGScore = gScore[current] + 1;
            const neighborCentroid = faceCentroids[neighbor];
            const currentCentroid = faceCentroids[current];
            const distanceBetweenFaces = currentCentroid.distanceTo(neighborCentroid);
            const tentativeGScore = gScore[current] + distanceBetweenFaces;

            if (tentativeGScore < gScore[neighbor]) {
                cameFrom[neighbor] = current;
                gScore[neighbor] = tentativeGScore;
                fScore[neighbor] = gScore[neighbor] + heuristicCostEstimate(neighbor, endFaceIndex);

                if (!openSet.has(neighbor)) {
                    openSet.add(neighbor);
                }
            }
        }
    }
    console.log("No path found.");
    return [];

    function heuristicCostEstimate(faceAIndex, faceBIndex) {
        const centroidA = faceCentroids[faceAIndex];
        const centroidB = faceCentroids[faceBIndex];
        return centroidA.distanceTo(centroidB);
    }

    function reconstructPath(cameFrom, current) {
        const totalPath = [current];
        while (cameFrom[current] !== undefined) {
            current = cameFrom[current];
            totalPath.unshift(current);
        }
        return totalPath;
    }
}
