import { mult, normalMatrix } from './math.js';

// 1) WebGL 컨텍스트 얻기
export function initGL(canvas) {
  const gl = canvas.getContext('webgl');
  if (!gl) {
    alert('이 브라우저는 WebGL을 지원하지 않습니다.');
    throw new Error('WebGL not supported');
  }
  return gl;
}

// 2) .glsl 파일을 텍스트로 읽어오기 (로컬 서버 필요)
export async function loadText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`파일을 불러오지 못했습니다: ${url}`);
  return res.text();
}

// 3) 셰이더 하나 컴파일
function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error('셰이더 컴파일 오류:\n' + log);
  }
  return shader;
}

// 4) 정점 셰이더 + 프래그먼트 셰이더를 연결해 프로그램 생성
export function createProgram(gl, vsSource, fsSource) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error('프로그램 링크 오류:\n' + gl.getProgramInfoLog(program));
  }
  return program;
}

// 5) 캔버스의 실제 픽셀 크기를 화면 크기에 맞추기
export function resizeCanvas(gl) {
  const canvas = gl.canvas;
  const dpr = window.devicePixelRatio || 1;
  const w = Math.floor(canvas.clientWidth * dpr);
  const h = Math.floor(canvas.clientHeight * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  gl.viewport(0, 0, canvas.width, canvas.height);
}

// ---------------- 메시 그리기 ----------------
// 정점 데이터(위치·법선)를 GPU 버퍼에 올림
export function createMesh(gl, data) {
  const position = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, position);
  gl.bufferData(gl.ARRAY_BUFFER, data.positions, gl.STATIC_DRAW);

  const normal = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normal);
  gl.bufferData(gl.ARRAY_BUFFER, data.normals, gl.STATIC_DRAW);

  return { position, normal, count: data.count };
}

// 셰이더 변수 위치를 한 번만 찾아 저장
export function getLocations(gl, program) {
  return {
    vPosition:  gl.getAttribLocation(program, 'vPosition'),
    vNormal:    gl.getAttribLocation(program, 'vNormal'),
    model:      gl.getUniformLocation(program, 'modelMatrix'),
    view:       gl.getUniformLocation(program, 'viewMatrix'),
    projection: gl.getUniformLocation(program, 'projectionMatrix'),
    normalMat:  gl.getUniformLocation(program, 'normalMatrix'),
    color:      gl.getUniformLocation(program, 'objectColor'),
    lightDir:   gl.getUniformLocation(program, 'lightDir'),
    emissive:   gl.getUniformLocation(program, 'emissive'),
  };
}

// 부품 목록을 같은 메시(정육면체)로 차례로 그림
export function drawParts(gl, loc, mesh, parts) {
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.position);
  gl.vertexAttribPointer(loc.vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(loc.vPosition);

  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normal);
  gl.vertexAttribPointer(loc.vNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(loc.vNormal);

  for (const p of parts) {
    gl.uniformMatrix4fv(loc.model, false, p.model);
    gl.uniformMatrix3fv(loc.normalMat, false, normalMatrix(p.model));
    gl.uniform4fv(loc.color, p.color);
    gl.uniform1f(loc.emissive, p.emissive);
    gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
  }
}