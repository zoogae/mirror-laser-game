import { initGL, loadText, createProgram, resizeCanvas } from './renderer.js';
import { mult, rotateX, rotateY, perspective, lookAt } from './math.js';
import { createCube } from './objects.js';

async function main() {
  const canvas = document.getElementById('gl-canvas');
  const gl = initGL(canvas);

  const vsSource = await loadText('shaders/vertex.glsl');
  const fsSource = await loadText('shaders/fragment.glsl');
  const program = createProgram(gl, vsSource, fsSource);
  gl.useProgram(program);

  // 면마다 다른 색을 준 정육면체 (어느 면이 보이는지 구분하기 위해)
  const cube = createCube([
    [0.36, 0.32, 0.88, 1.0], // 앞: 보라
    [0.18, 0.25, 0.82, 1.0], // 뒤: 파랑
    [0.88, 0.45, 0.23, 1.0], // 왼쪽: 주황
    [1.00, 0.24, 0.60, 1.0], // 오른쪽: 분홍
    [0.50, 0.90, 1.00, 1.0], // 위: 하늘색
    [0.25, 0.22, 0.55, 1.0], // 아래: 어두운 보라
  ]);

  // 위치 버퍼 → vPosition
  const posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cube.positions, gl.STATIC_DRAW);
  const vPosition = gl.getAttribLocation(program, 'vPosition');
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  // 색상 버퍼 → vColor
  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cube.colors, gl.STATIC_DRAW);
  const vColor = gl.getAttribLocation(program, 'vColor');
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);

  // 셰이더의 uniform 변수 위치
  const uModelView  = gl.getUniformLocation(program, 'modelViewMatrix');
  const uProjection = gl.getUniformLocation(program, 'projectionMatrix');

  // 깊이 검사(Z-buffer): 가까운 면이 먼 면을 가리도록
  gl.enable(gl.DEPTH_TEST);

  // 카메라: (3, 2.5, 4) 위치에서 원점을 바라봄
  const eye = [0, 6, 0.01];
  const at  = [0, 0, 0];
  const up  = [0, 1, 0];

  function render(timeMs) {
    resizeCanvas(gl);
    gl.clearColor(0.02, 0.03, 0.10, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);   // 깊이 버퍼도 매 프레임 초기화

    const t = (timeMs || 0) / 1000;   // 초 단위 시간

    // Projection: 시야각 45°, 화면 비율, 보이는 거리 0.1 ~ 100
    const aspect = gl.canvas.width / gl.canvas.height;
    const projection = perspective(45, aspect, 0.1, 100);

    // View: 카메라 / Model: 큐브를 시간에 따라 회전
    const view  = lookAt(eye, at, up);
    const model = mult(rotateY(t * 40), rotateX(t * 25));
    const modelView = mult(view, model);    // View * Model (Model이 먼저 적용됨)

    gl.uniformMatrix4fv(uModelView, false, modelView);
    gl.uniformMatrix4fv(uProjection, false, projection);

    gl.drawArrays(gl.TRIANGLES, 0, cube.count);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

main().catch(err => {
  console.error(err);
  alert(err.message);
});