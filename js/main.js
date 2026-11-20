import { initGL, loadText, createProgram, resizeCanvas } from './renderer.js';

async function main() {
  const canvas = document.getElementById('gl-canvas');
  const gl = initGL(canvas);

  // 셰이더 파일 불러오기 → 프로그램 생성
  const vsSource = await loadText('shaders/vertex.glsl');
  const fsSource = await loadText('shaders/fragment.glsl');
  const program = createProgram(gl, vsSource, fsSource);
  gl.useProgram(program);

  // 테스트용 삼각형: 정점마다 (x, y, z) 위치와 (r, g, b, a) 색상
  const positions = new Float32Array([
     0.0,  0.6, 0.0,
    -0.6, -0.5, 0.0,
     0.6, -0.5, 0.0,
  ]);
  const colors = new Float32Array([
    1.0, 0.24, 0.6, 1.0,   // 분홍 (레이저 색)
    0.36, 0.32, 0.88, 1.0, // 보라 (바닥 색)
    0.5, 0.9, 1.0, 1.0,    // 하늘색 (거울 색)
  ]);

  // 위치 버퍼 → vPosition 속성에 연결
  const posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  const vPosition = gl.getAttribLocation(program, 'vPosition');
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  // 색상 버퍼 → vColor 속성에 연결
  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
  const vColor = gl.getAttribLocation(program, 'vColor');
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);

  // 게임 루프: 매 프레임 화면을 다시 그림
  function render() {
    resizeCanvas(gl);
    gl.clearColor(0.02, 0.03, 0.10, 1.0);   // 배경: 어두운 남색
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(render);
  }
  render();
}

main().catch(err => {
  console.error(err);
  alert(err.message);
});