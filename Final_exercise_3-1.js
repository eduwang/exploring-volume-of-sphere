let segmentsSlider, offsetSlider;
let segments = 5;
let offset = 0;
let h = 200;



    // 카메라 피드 설정
    const videoElement = document.getElementById('videoElement');
    navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: "environment" // 후면 카메라 사용
        }
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

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    segmentsSlider = select('#segments');
    offsetSlider = select('#offset');

    segmentsSlider.input(updateValues);
    offsetSlider.input(updateValues);

    updateValues();  // 초기 값을 설정합니다.

    noLoop();  // 한 번만 그리도록 설정

    
}

function updateValues() {
    segments = int(segmentsSlider.value());
    offset = int(offsetSlider.value());
    redraw();
}

function draw() {
 
    clear();

    // 카메라 위치를 조정하여 확대 효과를 줍니다.
    let camX = 0;
    let camY = 0;
    let camZ = height / 2; // 카메라를 앞으로 이동시켜 확대 효과
    camera(camX, camY, camZ, camX, camY, 0, 0, 1, 0);

    let baseWidth = 100;
    let baseHeight = h / segments;
    let depth = 50;
    let incX = offset / segments;

    // 첫 번째 사각기둥 더미
    let y = -h / 2 
    drawCuboid(150, y, baseWidth, h, depth);


    // 두 번째 이동된 사각기둥 더미
    for (let i = 0; i < segments; i++) {
        let y = -h / 2 + i * baseHeight;
        drawCuboid(-150 + i * incX, y, baseWidth, baseHeight, depth);
    }
}

function drawCuboid(x, y, w, h, d) {
    push();
    translate(x, y);

    
    // 바닥면
    fill(125, 65, 65);
    beginShape();
    vertex(0, h);
    vertex(w, h);
    vertex(w + d, h - d);
    vertex(d, h - d);
    endShape(CLOSE);


    // 옆면(우)
    fill(175, 85, 85);
    beginShape();
    vertex(w, 0);
    vertex(w + d, - d);
    vertex(w + d, h - d);
    vertex(w, h);
    endShape(CLOSE);

    // 옆면(좌)
    fill(175, 85, 85);
    beginShape();
    vertex(0, 0);
    vertex(d, -d);
    vertex(d, h - d);
    vertex(0, h);
    endShape(CLOSE);
    

    // 윗면
    fill(175, 75, 75);
    beginShape();
    vertex(0, 0);
    vertex(w, 0);
    vertex(w + d, -d);
    vertex(d, -d);
    endShape(CLOSE);

    

    // 앞면
    fill(200, 100, 100);
    beginShape();
    vertex(0, 0);
    vertex(w, 0);
    vertex(w, h);
    vertex(0, h);
    endShape(CLOSE);



    pop();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    redraw();
}
