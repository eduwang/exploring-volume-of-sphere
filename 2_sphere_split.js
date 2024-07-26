//const THREE = window.MINDAR.IMAGE.THREE;
import * as THREE from 'three';
import {MindARThree} from 'mindar-image-three';
import {loadGLTF} from './applications/libs/loader.js';

document.addEventListener('DOMContentLoaded',() => {

    const radioButtons = document.querySelectorAll('input[name="show-slider"]');
    const sliders = {
      slider1: document.getElementById('slider1-container'),
      slider2: document.getElementById('slider2-container'),
      slider3: document.getElementById('slider3-container'),
      slider4: document.getElementById('slider4-container'),
    };
  
    const modelPaths = {
      slider1: './models/model2-1.gltf',
      slider2: './models/model2-2.gltf',
      slider3: './models/model2-3.gltf',
      slider4: './models/model2-4.gltf',
    };
  
    let currentModel = null;
    let mixer = null;
    let action = null;
    let light = null;
    let ambientLight = null;
    let directionalLight = null;
  
    const start = async () => {
        // initialize MindAR 
        const mindarThree = new MindARThree({
          container: document.body,
          imageTargetSrc: './experiment_target2.mind',
        });
        const {renderer, scene, camera} = mindarThree;
    
        // create light
        // const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        // scene.add(light);
        // const ambientLight = new THREE.AmbientLight(0x404040);
        // scene.add(ambientLight);
        // const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
        // directionalLight.position.set(5, 5, 5).normalize();
        // scene.add(directionalLight);
    
        // create anchor
        const anchor = mindarThree.addAnchor(0);

        radioButtons.forEach(radio => {
            radio.addEventListener('change', async (event) => {
              Object.keys(sliders).forEach(key => {
                if (key === event.target.value) {
                  sliders[key].classList.remove('hidden');
                } else {
                  sliders[key].classList.add('hidden');
                }
              });
        
              if (currentModel) {
                anchor.group.remove(currentModel.scene);
              }
        
              const modelPath = modelPaths[event.target.value];
              const gltf = await loadGLTF(modelPath);
              gltf.scene.scale.set(0.5, 0.5, 0.5);
              gltf.scene.rotation.set(Math.PI / 2, 0, 0);
              gltf.scene.position.set(0, 0, 0);
              anchor.group.add(gltf.scene);
        
              mixer = new THREE.AnimationMixer(gltf.scene);
              action = mixer.clipAction(gltf.animations[0]);
              const targetTime = gltf.animations[0].duration;
        
              const sliderController = document.querySelector(`#${event.target.value}`);
              sliderController.min = 0.01;
              sliderController.max = targetTime*0.95;
        
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

        
              currentModel = gltf;
            });
          });
    
        // start AR
        await mindarThree.start();
        renderer.setAnimationLoop(() => {
          const delta = new THREE.Clock().getDelta();
          if (mixer) {
            mixer.update(delta);
          }
          renderer.render(scene, camera);
        });

        // Bring the light button event
        document.getElementById('bring-the-light').addEventListener('click', () => {
          if (!light && !ambientLight && !directionalLight) {
            // Create and add light
            light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
            scene.add(light);
            ambientLight = new THREE.AmbientLight(0x404040);
            scene.add(ambientLight);
            directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
            directionalLight.position.set(5, 5, 5).normalize();
            scene.add(directionalLight);
          }
        });
      }
      start();
    });