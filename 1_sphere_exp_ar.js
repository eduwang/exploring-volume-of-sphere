import * as THREE from 'three';
import * as CANNON from "https://cdn.skypack.dev/cannon-es";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {MindARThree} from 'mindar-image-three';



let scene, camera, renderer, world;
let hemisphereBody, secondHemisphereBody, tubeBodies = [], bottomPlaneBody, topPlaneBody;
let sphereBallCount = 0, cylinderBallCount = 0;
let ballRadius = 0.1;
let sphereBalls = []; // Array to track balls added to the sphere
let cylinderBalls = []; // Array to track balls added to the cylinder
let isShaking = false;

document.addEventListener('DOMContentLoaded', () => {
    const start = async () => {

        // initialize MindAR
        const mindarThree = new MindARThree({
            container: document.body,
            imageTargetSrc: './experiment_target2.mind',
        });
        const { renderer, scene, camera } = mindarThree;

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

        // Initialize the Three.js and Cannon.js scene
        let hemisphereBody, secondHemisphereBody, tubeBodies = [], bottomPlaneBody, topPlaneBody;
        let sphereBallCount = 0, cylinderBallCount = 0;
        let ballRadius = 0.1;
        let sphereBalls = []; // Array to track balls added to the sphere
        let cylinderBalls = []; // Array to track balls added to the cylinder
        let isShaking = false;

        // Create a group to hold the objects
        const arGroup = new THREE.Group();
        arGroup.scale.set(0.2, 0.2, 0.2);
        
        scene.add(arGroup);

        initCannonThreeScene(arGroup, world);

        // Link the AR anchor to trigger the scene rendering when the target image is detected
        const anchor = mindarThree.addAnchor(0);
        anchor.group.add(arGroup);

        anchor.onTargetFound = () => {
            // Apply transformation when the target is found
            arGroup.scale.set(0.35, 0.35, 0.35);  // Adjust the scale as needed
            arGroup.rotation.set(Math.PI/2, 0, 0);  // Adjust the rotation as needed (in radians)
            arGroup.position.set(-1, 0, 1);  // Adjust these values as needed
        };

        // Add button event listeners after initializing the scene and world
        addEventListeners(world, arGroup);

        // start AR
        await mindarThree.start();
        renderer.setAnimationLoop(() => {
            updatePhysics(world, sphereBalls, cylinderBalls, hemisphereBody, secondHemisphereBody, tubeBodies);
            renderer.render(scene, camera);
        });

        function initCannonThreeScene(group, world) {
            // Scene setup
            camera.position.z = 5;

            // Add OrbitControls
            const controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true; // Smooth movement
            controls.dampingFactor = 0.05;

            // Create hemisphere shape
            const radius = 2;
            const segments = 32;
            const vertices = [];
            const faces = [];

            for (let i = 0; i <= segments; i++) {
                for (let j = 0; j <= segments / 2; j++) {
                    const theta = (j / (segments / 2)) * Math.PI / 2;
                    const phi = (i / segments) * Math.PI * 2;

                    const x = radius * Math.sin(theta) * Math.cos(phi);
                    const y = radius * Math.sin(theta) * Math.sin(phi);
                    const z = radius * Math.cos(theta);

                    vertices.push(new CANNON.Vec3(x, y, z));
                }
            }

            for (let i = 0; i < segments; i++) {
                for (let j = 0; j < segments / 2; j++) {
                    const a = i * (segments / 2 + 1) + j;
                    const b = (i + 1) * (segments / 2 + 1) + j;
                    const c = (i + 1) * (segments / 2 + 1) + (j + 1);
                    const d = i * (segments / 2 + 1) + (j + 1);

                    faces.push([a, b, d]);
                    faces.push([b, c, d]);
                }
            }

            // First hemisphere
            hemisphereBody = new CANNON.Body({ mass: 0 });
            const shape = new CANNON.ConvexPolyhedron({ vertices, faces });
            hemisphereBody.addShape(shape);
            hemisphereBody.position.set(0, 0, 0); // Ensure hemisphere is centered
            hemisphereBody.quaternion.setFromEuler(Math.PI / 2, 0, 0); // Rotate the hemisphere to face downwards
            world.addBody(hemisphereBody);

            // Visualize first hemisphere
            visualizeCannonShape(group, hemisphereBody, 0x00ff00);

            // Second hemisphere (duplicate)
            secondHemisphereBody = new CANNON.Body({ mass: 0 });
            secondHemisphereBody.addShape(shape);
            secondHemisphereBody.position.set(0, 0, 0); // Same position
            secondHemisphereBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // Opposite rotation
            world.addBody(secondHemisphereBody);

            // Visualize second hemisphere
            visualizeCannonShape(group, secondHemisphereBody, 0x00ff00); // Different color for distinction

            // Create and stack three tubes
            const tubeRadius = radius;
            const tubeHeight = tubeRadius * 2 / 3;
            const tubeSegments = 32;

            const tubeColors = [0x91bbff, 0x748ce3, 0xd694ff];
            for (let i = 0; i < 3; i++) {
                createAndVisualizeTube(group, world, tubeRadius, tubeHeight, tubeSegments, i, tubeColors[i]);
            }

            // Create bottom plane for the lowest tube
            createAndVisualizeBottomPlane(group, world, tubeRadius * 2.5);

            // Create top plane for the highest tube
            createAndVisualizeTopPlane(world, tubeRadius * 2.5);
        }

        function addEventListeners(world, group) {
            document.getElementById('addBallToSphere').addEventListener('click', () => addBallToSphere(world, group));
            document.getElementById('addBallToCylinder').addEventListener('click', () => addBallToCylinder(world, group));
            document.getElementById('listObjects').addEventListener('click', listObjectsInScene);
            document.getElementById('fillBoth').addEventListener('click', fillBoth);
            document.getElementById('removeAllBalls').addEventListener('click', () => removeAllBalls(world, group));
            document.getElementById('ballSizeBigger').addEventListener('click', ballSizeBigger);
            document.getElementById('ballSizeSmaller').addEventListener('click', ballSizeSmaller);
            document.getElementById('shakeScene').addEventListener('click', () => shakeScene(world)); // Add button for shaking the scene
        }

        function createAndVisualizeTube(group, world, radius, height, segments, index, color) {
            const offset = height * index - height; // Adjust position based on index

            // Create tube shape using ConvexPolyhedron
            const tubeVertices = [];
            const tubeFaces = [];

            for (let i = 0; i < segments; i++) {
                const theta = (i / segments) * Math.PI * 2;
                const x = radius * Math.cos(theta);
                const z = radius * Math.sin(theta);

                tubeVertices.push(new CANNON.Vec3(x, -height / 2, z));
                tubeVertices.push(new CANNON.Vec3(x, height / 2, z));
            }

            for (let i = 0; i < segments; i++) {
                const next = (i + 1) % segments;
                const bottom1 = i * 2;
                const bottom2 = next * 2;
                const top1 = i * 2 + 1;
                const top2 = next * 2 + 1;

                tubeFaces.push([bottom1, bottom2, top1]);
                tubeFaces.push([bottom2, top2, top1]);
            }

            const tubeBody = new CANNON.Body({ mass: 0 });
            const tubeShape = new CANNON.ConvexPolyhedron({ vertices: tubeVertices, faces: tubeFaces });
            tubeBody.addShape(tubeShape);
            tubeBody.position.set(radius * 2.5, offset, 0); // Position to the right of the hemispheres
            world.addBody(tubeBody);
            tubeBodies.push(tubeBody);

            // Visualize tube
            visualizeCannonShape(group, tubeBody, color);
        }

        function createAndVisualizeBottomPlane(group, world, size) {
            const halfExtents = new CANNON.Vec3(size / 2, 0.1, size / 2);
            const bottomPlaneShape = new CANNON.Box(halfExtents);
            bottomPlaneBody = new CANNON.Body({ mass: 0 });
            bottomPlaneBody.addShape(bottomPlaneShape);
            bottomPlaneBody.position.set(size, -2 - 0.1, 0); // Slightly below the bottom of the lowest tube
            world.addBody(bottomPlaneBody);

            // Visualize bottom plane
            const geometry = new THREE.BoxGeometry(size, 0.2, size);
            const material = new THREE.MeshPhongMaterial({ color: 0x91bbff });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(size, -2 - 0.1, 0);
            group.add(mesh);
            bottomPlaneBody.mesh = mesh;
        }

        function createAndVisualizeTopPlane(world, size) {
            const halfExtents = new CANNON.Vec3(size / 2, 0.05, size / 2);
            const topPlaneShape = new CANNON.Box(halfExtents);
            topPlaneBody = new CANNON.Body({ mass: 0 });
            topPlaneBody.addShape(topPlaneShape);
            topPlaneBody.position.set(size, 2 + 0.1, 0); // Slightly below the bottom of the lowest tube
            world.addBody(topPlaneBody);
        }

        function addBallToSphere(world, group) {
            const ballShape = new CANNON.Sphere(ballRadius);
            const ballBody = new CANNON.Body({ mass: 1 });
            ballBody.addShape(ballShape);
            const xPosition = (Math.random() - 0.5) * 2; // Random value between -1 and 1
            const yPosition = (Math.random() - 0.5) * 0.3 + 0.8; // Random value between -1 and 1
            ballBody.position.set(xPosition, yPosition, 0); // Start above the hemisphere
            ballBody.collisionFilterGroup = 1;
            ballBody.collisionFilterMask = 1;
            ballBody.restitution = 0.7; // Bounce factor
            world.addBody(ballBody);
            sphereBalls.push(ballBody); // Track sphere balls

            // Generate random color
            const color = new THREE.Color(Math.random(), Math.random(), Math.random());

            // Visualize Cannon.js ball
            visualizeCannonShape(group, ballBody, color.getHex());

            sphereBallCount++;
            document.getElementById('sphereBallCount').innerText = sphereBallCount;
        }

        function addBallToCylinder(world, group) {
            const ballShape = new CANNON.Sphere(ballRadius);
            const ballBody = new CANNON.Body({ mass: 1 });
            ballBody.addShape(ballShape);
            const xPosition = 5 + (Math.random() - 0.5) * 2; // Random value between -1 and 1
            const yPosition = (Math.random() - 0.5) * 0.3 + 0.8; // Random value between -1 and 1
            ballBody.position.set(xPosition, yPosition, 0); // Start above the cylinder
            ballBody.collisionFilterGroup = 1;
            ballBody.collisionFilterMask = 1;
            ballBody.restitution = 0.7; // Bounce factor
            world.addBody(ballBody);
            cylinderBalls.push(ballBody); // Track cylinder balls

            // Generate random color
            const color = new THREE.Color(Math.random(), Math.random(), Math.random());

            // Visualize Cannon.js ball
            visualizeCannonShape(group, ballBody, color.getHex());

            cylinderBallCount++;
            document.getElementById('cylinderBallCount').innerText = cylinderBallCount;
        }

        function fillBoth() {
            addBallToSphere(world, arGroup);
            addBallToCylinder(world, arGroup);
        }

        function removeAllBalls(world, group) {
            sphereBalls.forEach(ballBody => {
                world.removeBody(ballBody);
                group.remove(ballBody.mesh);
            });
            cylinderBalls.forEach(ballBody => {
                world.removeBody(ballBody);
                group.remove(ballBody.mesh);
            });
            sphereBalls = [];
            cylinderBalls = [];
            sphereBallCount = 0;
            cylinderBallCount = 0;
            document.getElementById('sphereBallCount').innerText = sphereBallCount;
            document.getElementById('cylinderBallCount').innerText = cylinderBallCount;
        }

        function ballSizeBigger() {
            removeAllBalls(world, arGroup);
            ballRadius += 0.02;
            addBallToSphere(world, arGroup);
            addBallToCylinder(world, arGroup);
            if (ballRadius > 0.5) {
                alert("TOO BIG!!! 처음으로 돌아갑니다");
                ballRadius = 0.1;
                removeAllBalls(world, arGroup);
            }
            console.log("clicked")
        }

        function ballSizeSmaller() {
            removeAllBalls(world, arGroup);
            ballRadius -= 0.02;
            addBallToSphere(world, arGroup);
            addBallToCylinder(world, arGroup);
            if (ballRadius < 0.021) {
                alert("TOO SMALL!!! 처음으로 돌아갑니다");
                ballRadius = 0.1;
                removeAllBalls(world, arGroup);
            }
        }

        let forceMagnitude = 50;
        function shakeScene(world) {
            if (isShaking) return; // Prevent multiple shakes at the same time

            isShaking = true;
            const duration = 500; // Duration of the shake in milliseconds
            const interval = 50; // Interval at which to apply forces

            if (ballRadius < 0.2) {
                forceMagnitude = 50;
            } else {
                forceMagnitude = 90;
            }

            let elapsedTime = 0;

            const shakeInterval = setInterval(() => {
                elapsedTime += interval;

                if (elapsedTime >= duration) {
                    clearInterval(shakeInterval);
                    isShaking = false;
                    return;
                }

                // Apply a random force to each ball
                [...sphereBalls, ...cylinderBalls].forEach(ballBody => {
                    const force = new CANNON.Vec3(
                        (Math.random() - 0.5) * forceMagnitude,
                        (Math.random() - 0.5) * forceMagnitude,
                        (Math.random() - 0.5) * forceMagnitude
                    );
                    ballBody.applyForce(force, ballBody.position);
                });
            }, interval);
        }

        function visualizeCannonShape(group, body, color) {
            if (body.mesh) {
                group.remove(body.mesh);
            }

            body.shapes.forEach(shape => {
                let mesh;
                if (shape instanceof CANNON.Sphere) {
                    const geometry = new THREE.SphereGeometry(shape.radius, 32, 32);
                    const material = new THREE.MeshPhongMaterial({ color, side: THREE.FrontSide });
                    mesh = new THREE.Mesh(geometry, material);
                } else if (shape instanceof CANNON.ConvexPolyhedron) {
                    const geometry = new THREE.BufferGeometry();
                    const vertices = [];
                    const indices = [];
                    shape.vertices.forEach(v => {
                        vertices.push(v.x, v.y, v.z);
                    });
                    shape.faces.forEach(face => {
                        const a = face[0];
                        const b = face[1];
                        const c = face[2];
                        indices.push(a, b, c);
                    });
                    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
                    geometry.setIndex(indices);
                    geometry.computeVertexNormals(); // Ensure smooth shading
                    const material = new THREE.MeshPhongMaterial({ color, side: THREE.FrontSide });
                    mesh = new THREE.Mesh(geometry, material);
                }
                if (mesh) {
                    mesh.position.copy(body.position);
                    mesh.quaternion.copy(body.quaternion);
                    body.mesh = mesh;
                    group.add(mesh);
                }
            });
        }

        function listObjectsInScene() {
            console.log("Objects in scene:");
            scene.children.forEach((child, index) => {
                console.log(`Object ${index}:`, child);
            });
        }

        function updatePhysics(world, sphereBalls, cylinderBalls, hemisphereBody, secondHemisphereBody, tubeBodies) {
            world.step(1 / 360);
            sphereBalls.forEach((ballBody, index) => {
                if (ballBody.mesh) {
                    ballBody.mesh.position.copy(ballBody.position);
                    ballBody.mesh.quaternion.copy(ballBody.quaternion);
                }

                // Check if ball has fallen through the hemisphere
                if (ballBody.position.y < -10) {
                    console.warn('Sphere ball has fallen through the hemisphere:', ballBody.position);

                    // Remove the ball from the world and scene
                    world.removeBody(ballBody);
                    arGroup.remove(ballBody.mesh);
                    sphereBalls.splice(index, 1);

                    // Update ball count
                    sphereBallCount--;
                    document.getElementById('sphereBallCount').innerText = sphereBallCount;
                }
            });

            cylinderBalls.forEach((ballBody, index) => {
                if (ballBody.mesh) {
                    ballBody.mesh.position.copy(ballBody.position);
                    ballBody.mesh.quaternion.copy(ballBody.quaternion);
                }

                // Check if ball has fallen through the cylinder
                if (ballBody.position.y < -10) {
                    console.warn('Cylinder ball has fallen through the cylinder:', ballBody.position);

                    // Remove the ball from the world and scene
                    world.removeBody(ballBody);
                    arGroup.remove(ballBody.mesh);
                    cylinderBalls.splice(index, 1);

                    // Update ball count
                    cylinderBallCount--;
                    document.getElementById('cylinderBallCount').innerText = cylinderBallCount;
                }
            });

            if (hemisphereBody.mesh) {
                hemisphereBody.mesh.position.copy(hemisphereBody.position);
                hemisphereBody.mesh.quaternion.copy(hemisphereBody.quaternion);
            }
            if (secondHemisphereBody.mesh) {
                secondHemisphereBody.mesh.position.copy(secondHemisphereBody.position);
                secondHemisphereBody.mesh.quaternion.copy(secondHemisphereBody.quaternion);
            }
            tubeBodies.forEach(tubeBody => {
                if (tubeBody.mesh) {
                    tubeBody.mesh.position.copy(tubeBody.position);
                    tubeBody.mesh.quaternion.copy(tubeBody.quaternion);
                }
            });
        }
    }
    start();
});