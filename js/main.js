import { initGL, loadText, createProgram, resizeCanvas,
         createMesh, getLocations, drawParts } from './renderer.js';
import { perspective, lookAt, radians } from './math.js';
import { createCube, buildScene } from './objects.js';
import { LEVELS } from './levels.js';

async function main() {
  const canvas = document.getElementById('gl-canvas');
  const gl = initGL(canvas);

  const vsSource = await loadText('shaders/vertex.glsl');
  const fsSource = await loadText('shaders/fragment.glsl');
  const program = createProgram(gl, vsSource, fsSource);
  gl.useProgram(program);

  const loc = getLocations(gl, program);
  const cubeMesh = createMesh(gl, createCube());

  // 현재 레벨 → 그릴 부품 목록
  const level = LEVELS[0];
  const parts = buildScene(level);
  document.getElementById('level-info').textContent = `STAGE ${level.id}`;

  gl.enable(gl.DEPTH_TEST);
  gl.uniform3fv(loc.lightDir, [0.4, 1.0, 0.6]);   // 왼쪽 위 앞에서 비추는 빛

  // 카메라: 게임판 중심을 바라보며, 방위각·고도·거리로 위치를 정함 (5단계에서 마우스로 조작)
  const camera = { azimuth: 20, elevation: 55, distance: 15 };

  function cameraEye() {
    const az = radians(camera.azimuth), el = radians(camera.elevation);
    return [
      camera.distance * Math.cos(el) * Math.sin(az),
      camera.distance * Math.sin(el),
      camera.distance * Math.cos(el) * Math.cos(az),
    ];
  }

  function render() {
    resizeCanvas(gl);
    gl.clearColor(0.02, 0.03, 0.10, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const aspect = gl.canvas.width / gl.canvas.height;
    gl.uniformMatrix4fv(loc.projection, false, perspective(45, aspect, 0.1, 100));
    gl.uniformMatrix4fv(loc.view, false, lookAt(cameraEye(), [0, 0, 0], [0, 1, 0]));

    drawParts(gl, loc, cubeMesh, parts);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

main().catch(err => {
  console.error(err);
  alert(err.message);
});