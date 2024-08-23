//const THREE = window.MINDAR.IMAGE.THREE;
import * as THREE from 'three';
import {MindARThree} from 'mindar-image-three';
import {loadGLTF} from './applications/libs/loader.js';

document.addEventListener('DOMContentLoaded',() => {

    const radioButtons = document.querySelectorAll('input[name="show-slider"]');
    const slider1Radio = document.getElementById('show-slider1');
    const sliderController = document.getElementById('slider-control');
    const radioElement = document.getElementById('radio-div');
    const sliderController0 = document.getElementById('slider-control-0');




    const sliders = {
      slider1: document.getElementById('slider1-container'),
      slider2: document.getElementById('slider2-container'),
      slider3: document.getElementById('slider3-container'),
    };
  
    const modelPaths = {
      default: './models/IcoSphere_Step0.gltf',
      slider1: './models/IcoSphere_Step1.gltf',
      slider2: './models/IcoSphere_Step2.gltf',
      slider3: './models/IcoSphere_Step3.gltf',
    };
  
    let currentModel = null;
    let mixer = null;
    let mixer0 = null;
    let action = null;
    let action0 = null;
    let light = null;
    let ambientLight = null;
    let directionalLight = null;
  
    const start = async () => {
        // initialize MindAR 
        const mindarThree = new MindARThree({
          container: document.body,
          imageTargetSrc: './target_image/target_exercise_2.mind',
          rendererSettings: {
            antialias: true,  // 이 줄을 추가하여 안티앨리어싱 활성화
          }
        });
        const {renderer, scene, camera} = mindarThree;

        

        light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(light);
        ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
        directionalLight.position.set(5, 5, 5).normalize();
        scene.add(directionalLight);
    
        // create anchor
        const anchor0 = mindarThree.addAnchor(0);
        const anchor = mindarThree.addAnchor(1);

        //수박 모델
        const gltf0 = await loadGLTF('./models/Step_0_Watermelon_simple.gltf');
        gltf0.scene.scale.set(0.5, 0.5, 0.5);
        gltf0.scene.rotation.set(Math.PI / 2, 0, 0);
        gltf0.scene.position.set(0, 0, 0);
        anchor0.group.add(gltf0.scene);
        anchor0.onTargetFound = () =>{
          sliderController0.style.display = "inline";
         }

        anchor0.onTargetLost = () =>{
          sliderController0.style.display = "none";
         }

         if (gltf0.animations && gltf0.animations.length > 0) {
          mixer0 = new THREE.AnimationMixer(gltf0.scene);
          action0 = mixer0.clipAction(gltf0.animations[0]);
          const targetTime0 = gltf0.animations[0].duration;

          const sliderController0 = document.getElementById(`slider0`);
          sliderController0.min = 0.01;
          sliderController0.max = targetTime0 * 0.95;

          sliderController0.addEventListener('input', () => {
            const sliderValue = parseFloat(sliderController0.value);
            if (mixer0) {
              mixer0.setTime(sliderValue);
              mixer0.update(0);
              console.log(sliderValue);
            }
            action0.play();
          });
        } else {
          console.log("no animation")
        }


        const loadModel = async (modelKey) => {
          Object.keys(sliders).forEach(key => {
            if (key === modelKey) {
              sliders[key].classList.remove('hidden');
            } else {
              sliders[key].classList.add('hidden');
            }
          });
    
          if (currentModel) {
            anchor.group.remove(currentModel.scene);
          }
    
          const modelPath = modelPaths[modelKey];
          const gltf = await loadGLTF(modelPath);
          gltf.scene.scale.set(0.5, 0.5, 0.5);
          gltf.scene.rotation.set(Math.PI / 2, 0, 0);
          gltf.scene.position.set(0, 0, 0);
          anchor.group.add(gltf.scene);


          anchor.onTargetFound = () => {
            sliderController.style.display = "inline";
            console.log("target found")
            };
          anchor.onTargetLost = () => {
            sliderController.style.display = "none";
            console.log("target lost")
            };

          // 애니메이션 처리
          if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(gltf.scene);
            action = mixer.clipAction(gltf.animations[0]);
            const targetTime = gltf.animations[0].duration;

            const sliderController = document.querySelector(`#${modelKey}`);
            sliderController.min = 0.01;
            sliderController.max = targetTime * 0.99;

            sliderController.addEventListener('input', () => {
              const sliderValue = parseFloat(sliderController.value);
              if (mixer) {
                mixer.setTime(sliderValue);
                mixer.update(0);
              }
              action.play();
            });
            anchor.onTargetFound = () => {
              sliderController.style.display = "inline";
            };
            anchor.onTargetLost = () => {
              sliderController.style.display = "none";
            };
          } else {
            // 애니메이션이 없는 경우, 슬라이더를 숨깁니다.
            Object.keys(sliders).forEach(key => {
              sliders[key].classList.add('hidden');
            });
          }
    
          currentModel = gltf;
        };

        // Load default model initially
        await loadModel('default');

        radioButtons.forEach(radio => {
            radio.addEventListener('change', async (event) => {
              await loadModel(event.target.value);
            });
        });
    
        // start AR
        await mindarThree.start();
        let previousTime = 0;

        renderer.setAnimationLoop(() => {
          const currentTime = Date.now();
          const delta = (currentTime - previousTime) / 1000;  // 초 단위로 delta 계산
          if (delta > 1/20){
            previousTime = currentTime;

            if (mixer) {
              // mixer.update(delta);
            }
            if (mixer0) {
              // mixer0.update(delta);
            }
            renderer.render(scene, camera);
          }

        });

        // Bring the light button event
        const bringTheLightButton = document.getElementById('bring-the-light');
        const bringItBackButton = document.getElementById('bring-it-back');
        // const sliderControl = document.getElementById('slider-control');

        // Bring the light button event
        bringTheLightButton.addEventListener('click', async () => {
          // Show the radio buttons and slider control
          sliderController.style.display = "block";

          // Check slider1 radio button by default
          slider1Radio.checked = true;

          // Load the slider1 model by default
          await loadModel('slider1');
          // Show the bring-it-back button
          bringItBackButton.classList.remove('hidden');
          bringTheLightButton.classList.add('hidden');
          radioElement.style.display = "inline"
        });

        // Bring it back button event
        bringItBackButton.addEventListener('click', async () => {
          // Uncheck all radio buttons
          radioButtons.forEach(radio => {
            radio.checked = false;
          });

          // Hide all radio buttons and slider control
          sliderController.style.display = "none";
          
          // Remove the current model from the anchor
          if (currentModel) {
            anchor.group.remove(currentModel.scene);
            currentModel = null;
          }
        
          // Load the default model
          await loadModel('default');

          // Hide the bring-it-back button and show the bring-the-light button
          bringItBackButton.classList.add('hidden');
          bringTheLightButton.classList.remove('hidden');
          radioElement.style.display = "none"
          sliderController.style.display = "inline";
        });
      }
      start();
    });
