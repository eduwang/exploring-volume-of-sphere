import * as THREE from 'https://unpkg.com/three@0.127.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.127.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://unpkg.com/three@0.127.0/examples/jsm/controls/OrbitControls.js';


// 카메라 피드 설정
const videoElement = document.getElementById('videoElement');
navigator.mediaDevices.getUserMedia({
    video: {
        facingMode: { exact: "environment" } // 후면 카메라 사용
    }
})
.then((stream) => {
    videoElement.srcObject = stream;
})
.catch((error) => {
    console.error("Error accessing camera: ", error);
    // 후면 카메라가 없거나 오류가 발생하면 전면 카메라로 대체
    navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
            videoElement.srcObject = stream;
        })
        .catch((error) => {
            console.error("Error accessing fallback camera: ", error);
        });
});


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // alpha: true를 설정하여 배경을 투명하게 만듭니다.
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// OrbitControls 추가
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // 부드러운 카메라 움직임을 위해 감속 활성화
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2; // 카메라가 아래로 90도 이상 회전하지 않도록 제한
controls.minPolarAngle = -Math.PI / 2; // 카메라가 위로 45도 이상 회전하지 않도록 제한
controls.minAzimuthAngle = 0; // 좌우 회전 제한 (좌우 회전 각도를 동일하게 설정)
controls.maxAzimuthAngle = 0;

// 조명 추가
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1); // 하늘색과 지면 색의 부드러운 조명
hemisphereLight.position.set(0, 200, 0);
scene.add(hemisphereLight);

// 카메라 위치 설정
camera.position.z = 5;

// GLTF 모델 로드
const loader = new GLTFLoader();
loader.load(
    './models/cavalieri_new.gltf', // GLTF 파일의 경로를 여기에 입력
    function (gltf) {
        const model = gltf.scene;
        model.scale.set(0.8, 0.8, 0.8); // 모델의 크기 조정
        model.position.set(0, 0, 0); // 모델의 위치 설정
        model.rotation.set(0, -Math.PI/2, 0); // 모델의 위치 설정
        scene.add(model);

        // 애니메이션이 있는 경우
        if (gltf.animations && gltf.animations.length) {
            //gltf.animations
            const mixer = new THREE.AnimationMixer(gltf.scene);
            const action = mixer.clipAction(gltf.animations[0]); //첫 번째 애니메이션 실행
            const targetTime = gltf.animations[0].duration;

            const clock = new THREE.Clock();

            const sliderController = document.querySelector('#slider-panel');
            sliderController.min = 0.02;
            sliderController.max = targetTime*0.99;
            
            sliderController.addEventListener('input', () => {
                const sliderValue = parseFloat(sliderController.value);
                if (mixer) {
                    mixer.setTime(sliderValue); // Set the animation time of the mixer
                    mixer.update(0); // Update the mixer with a delta time of 0 to apply the new animation time
                }
                action.play();
            });
        }
    },
    undefined,
    function (error) {
        console.error('An error happened', error);
    }
);

// 애니메이션 루프
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();
