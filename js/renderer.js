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