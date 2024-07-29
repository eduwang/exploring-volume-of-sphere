import * as THREE from 'three';
import * as CANNON from "https://cdn.skypack.dev/cannon-es";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


document.addEventListener('DOMContentLoaded', () => {
    const start = async () => {
        // initialize Three.js scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        // Add light
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5).normalize();
        scene.add(directionalLight);

        // Initialize Cannon.js world
        const world = new CANNON.World();
        world.gravity.set(0, -20, 0);
        world.broadphase = new CANNON.NaiveBroadphase();
        world.solver.iterations = 10;

        // Create a group to hold the objects
        const arGroup = new THREE.Group();
        scene.add(arGroup);

        // Create and add the trapezoid prism
        const topWidth = 3;
        const bottomWidth = 2;
        const depth = 2;
        const height = 5;

        const vertices = [
            new CANNON.Vec3(-topWidth / 2, -height / 2, -depth / 2), // 0
            new CANNON.Vec3(topWidth / 2, -height / 2, -depth / 2), // 1
            new CANNON.Vec3(topWidth / 2, -height / 2, depth / 2), // 2
            new CANNON.Vec3(-topWidth / 2, -height / 2, depth / 2), // 3
            new CANNON.Vec3(-bottomWidth / 2, height / 2, -depth / 2), // 4
            new CANNON.Vec3(bottomWidth / 2, height / 2, -depth / 2), // 5
            new CANNON.Vec3(bottomWidth / 2, height / 2, depth / 2), // 6
            new CANNON.Vec3(-bottomWidth / 2, height / 2, depth / 2) // 7
        ];

        const faces = [
            [0, 1, 5, 4], // 앞쪽 면 (직사각형)
            [1, 2, 6, 5], // 오른쪽 면 (직사각형)
            [2, 3, 7, 6], // 뒤쪽 면 (직사각형)
            [3, 0, 4, 7], // 왼쪽 면 (직사각형)
            [0, 1, 2, 3], // 아래쪽 면 (사다리꼴)
            [4, 5, 6, 7] // 위쪽 면 (사다리꼴)
        ];

        const trapezoidShape = new CANNON.ConvexPolyhedron({ vertices, faces });
        const trapezoidBody = new CANNON.Body({ mass: 0 });
        trapezoidBody.addShape(trapezoidShape);
        trapezoidBody.position.set(0, 0, 0);
        trapezoidBody.quaternion.setFromEuler(0, 0, 0);
        world.addBody(trapezoidBody);

        visualizeCannonShape(arGroup, trapezoidBody, 0xff0000);

        // Add OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        camera.position.z = 10;

        // Function to visualize the Cannon.js shape in Three.js
        function visualizeCannonShape(group, body, color) {
            if (body.mesh) {
                group.remove(body.mesh);
            }

            body.shapes.forEach(shape => {
                let mesh;
                if (shape instanceof CANNON.ConvexPolyhedron) {
                    const geometry = new THREE.BufferGeometry();
                    const vertices = [];
                    const indices = [];

                    shape.vertices.forEach(v => {
                        vertices.push(v.x, v.y, v.z);
                    });

                    shape.faces.forEach(face => {
                        for (let i = 1; i < face.length - 1; i++) {
                            indices.push(face[0], face[i], face[i + 1]);
                        }
                    });

                    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
                    geometry.setIndex(indices);
                    geometry.computeVertexNormals();

                    const material = new THREE.MeshPhongMaterial({ color, side: THREE.FrontSide });
                    mesh = new THREE.Mesh(geometry, material);

                    // Add edges for better visualization
                    const edges = new THREE.EdgesGeometry(geometry);
                    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
                    mesh.add(line);
                }

                if (mesh) {
                    mesh.position.copy(body.position);
                    mesh.quaternion.copy(body.quaternion);
                    body.mesh = mesh;
                    group.add(mesh);
                }
            });
        }

        // Start rendering loop
        renderer.setAnimationLoop(() => {
            world.step(1 / 360);
            renderer.render(scene, camera);
        });
    };
    start();
});