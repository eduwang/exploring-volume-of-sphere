import * as THREE from 'https://unpkg.com/three@0.127.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.127.0/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let segmentsSlider, offsetSlider;
let segments = 5;
let offset = 0;
let h = 200;
let objects = [];
let currentShape = 'cuboid'; // 현재 도형 상태를 저장할 변수

const videoElement = document.getElementById('videoElement');
const cuboidButton = document.getElementById('cuboidButton');
const cylinderButton = document.getElementById('cylinderButton');
const coneButton = document.getElementById('coneButton'); // 원뿔 버튼 추가


// 카메라 피드 설정
navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" } // 후면 카메라 사용
})
.then((stream) => {
    videoElement.srcObject = stream;
})
.catch((error) => {
    console.error("Error accessing environment camera: ", error);
    // 후면 카메라가 없거나 오류가 발생하면 전면 카메라로 대체
    navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
            videoElement.srcObject = stream;
        })
        .catch((error) => {
            console.error("Error accessing fallback camera: ", error);
        });
});

function init() {
    // Scene, Camera, Renderer 설정
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // OrbitControls 설정
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI;
    controls.minPolarAngle = -Math.PI / 2;
    controls.minAzimuthAngle = 0;
    controls.maxAzimuthAngle = 0;
    controls.enablePan = false;

    // 슬라이더 설정
    segmentsSlider = document.getElementById('segments');
    offsetSlider = document.getElementById('offset');

    segmentsSlider.addEventListener('input', updateValues);
    offsetSlider.addEventListener('input', updateValues);


    // 조명 설정
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 0, 500).normalize();
    scene.add(light);

    // 조명 설정
    const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
    scene.add(hemisphereLight);

    // 카메라 위치 설정
    camera.position.z = 400;

    updateValues();  // 초기 값을 설정
    animate();
}

function clearScene() {
    objects.forEach(obj => scene.remove(obj));
    objects = [];
}

function createCuboids() {
    const baseWidth = 100;
    const depth = 50;
    const baseHeight = h / segments;

    // 첫 번째 사각기둥
    objects.push(createCuboid(150, -100, baseWidth, h, depth, 0xcc6666));

    // 두 번째 이동된 사각기둥 더미
    for (let i = 0; i < segments; i++) {
        let y = -h / 2 + i * baseHeight;
        let color = new THREE.Color(`hsl(${(i / segments) * 360}, 100%, 50%)`); // 각 사각기둥에 다른 색상 적용
        objects.push(createCuboid(-150 + i * (offset / segments), y, baseWidth, baseHeight, depth, color));
    }
}

function createCuboid(x, y, w, h, d, color) {
    const geometry = new THREE.BoxGeometry(w, h, d);
    const material = new THREE.MeshPhongMaterial({ color });
    const cuboid = new THREE.Mesh(geometry, material);

    cuboid.position.set(x + w / 2, y + h / 2, -d / 2);
    scene.add(cuboid);
    return cuboid;
}

function createCylinders() {
    const baseRadius = 50;
    const depth = 50;
    const baseHeight = h / segments;

    // 첫 번째 원기둥
    objects.push(createCylinder(180, -100, baseRadius, h, depth, 0xcc6666));

    // 두 번째 이동된 원기둥 더미
    for (let i = 0; i < segments; i++) {
        let y = -h / 2 + i * baseHeight;
        let color = new THREE.Color(`hsl(${(i / segments) * 360}, 100%, 50%)`); // 각 원기둥에 다른 색상 적용
        objects.push(createCylinder(-120 + i * (offset / segments), y, baseRadius, baseHeight, depth, color));
    }
}

function createCylinder(x, y, radius, height, d, color) {
    const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
    const material = new THREE.MeshPhongMaterial({ color });
    const cylinder = new THREE.Mesh(geometry, material);

    cylinder.position.set(x + radius / 2, y + height / 2, -d / 2);
    scene.add(cylinder);
    return cylinder;
}

function createCones() {
    const baseRadius = 50;
    const depth = 50;
    const baseHeight = h / segments;

    // 오른쪽 원뿔(변하지 않는 원뿔)
    objects.push(createCone(200, 0, baseRadius, h, depth, 0xcc6666));

    if (segments === 1) {
        // 왼쪽 원뿔(세그먼트가 1일 때)
        objects.push(createCone(-100, 0, baseRadius, h, depth, 0xcc6666));
    } else {
        // 첫 번째 원뿔대의 중심 y 위치를 오른쪽 원뿔의 밑면 위치와 동일하게 설정
        let lastTopRadius = baseRadius;
        let lastY = 0 - h / 2 + baseHeight / 2; // 첫 번째 원뿔대의 중심을 오른쪽 원뿔의 밑면 위치로 설정
        for (let i = 1; i < segments; i++) {
            let y = lastY + baseHeight; // 이전 원뿔대의 상단에 맞춰 새 원뿔대 생성
            let topRadius = baseRadius * (1 - i / segments);
            let color = new THREE.Color(`hsl(${(i / segments) * 360}, 100%, 50%)`);
            objects.push(createTruncatedCone(-100, y, topRadius, lastTopRadius, baseHeight, depth, color));
            lastTopRadius = topRadius;
            lastY = y; // 마지막 원뿔대의 y 위치를 저장
        }

        // 맨 위의 원뿔 생성 (마지막 원뿔대의 topRadius와 동일한 반지름)
        let coneY = lastY + baseHeight; // 마지막 원뿔대의 상단보다 조금 더 위로 원뿔 생성
        objects.push(createCone(-100, coneY, lastTopRadius, baseHeight, depth, 0xcc6666));
    }
}

function createCone(x, y, radius, height, d, color) {
    const geometry = new THREE.ConeGeometry(radius, height, 32);
    const material = new THREE.MeshPhongMaterial({ color });
    const cone = new THREE.Mesh(geometry, material);

    cone.position.set(x, y + height / 2, -d / 2); // 원뿔의 중심을 기준으로 y 위치 조정
    scene.add(cone);
    return cone;
}

function createTruncatedCone(x, y, topRadius, bottomRadius, height, d, color) {
    const geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, 32);
    const material = new THREE.MeshPhongMaterial({ color });
    const truncatedCone = new THREE.Mesh(geometry, material);

    truncatedCone.position.set(x, y + height / 2, -d / 2); // 원뿔대의 중심을 기준으로 y 위치 조정
    scene.add(truncatedCone);
    return truncatedCone;
}




function updateValues() {
    segments = parseInt(segmentsSlider.value);
    offset = parseInt(offsetSlider.value);
    clearScene();
    if (currentShape === 'cuboid') {
        createCuboids();
    } else if (currentShape === 'cylinder') {
        createCylinders();
    } else if (currentShape === 'cone') {
        createCones();
    }
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize, false);

cuboidButton.addEventListener('click', () => {
    currentShape = 'cuboid'; // 현재 도형을 'cuboid'로 설정
    updateValues();
});

cylinderButton.addEventListener('click', () => {
    currentShape = 'cylinder'; // 현재 도형을 'cylinder'로 설정
    updateValues();
});

coneButton.addEventListener('click', () => {
    currentShape = 'cone'; // 현재 도형을 'cone'으로 설정
    updateValues();
});

init(); // 초기화 함수 호출