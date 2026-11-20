// 벡터·행렬 연산 유틸리티
// - 행렬은 길이 16의 Float32Array, WebGL 규칙에 맞춰 "열 우선(column-major)"으로 저장
//   m[0] m[4] m[8]  m[12]
//   m[1] m[5] m[9]  m[13]
//   m[2] m[6] m[10] m[14]
//   m[3] m[7] m[11] m[15]

export const radians = deg => deg * Math.PI / 180;

// ---------------- 3차원 벡터 ----------------
export const add   = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub   = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const dot   = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const length = a => Math.sqrt(dot(a, a));
export function normalize(a) {
  const len = length(a);
  return len > 0 ? scale(a, 1 / len) : [0, 0, 0];
}

// ---------------- 4x4 행렬 ----------------
export function identity() {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
}

// 행렬 곱 a * b  (b를 먼저 적용하고 그다음 a를 적용)
export function multiply(a, b) {
  const out = new Float32Array(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[k * 4 + row] * b[col * 4 + k];
      }
      out[col * 4 + row] = sum;
    }
  }
  return out;
}

// 여러 행렬을 차례로 곱하기: mult(A, B, C) = A * B * C
export function mult(...ms) {
  return ms.reduce((acc, m) => multiply(acc, m));
}

// 이동 행렬
export function translate(tx, ty, tz) {
  const m = identity();
  m[12] = tx; m[13] = ty; m[14] = tz;
  return m;
}

// 크기 변환 행렬
export function scaleMat(sx, sy, sz) {
  const m = identity();
  m[0] = sx; m[5] = sy; m[10] = sz;
  return m;
}

// 회전 행렬 (각도는 도 단위)
export function rotateX(deg) {
  const c = Math.cos(radians(deg)), s = Math.sin(radians(deg));
  const m = identity();
  m[5] = c;  m[9] = -s;
  m[6] = s;  m[10] = c;
  return m;
}

export function rotateY(deg) {
  const c = Math.cos(radians(deg)), s = Math.sin(radians(deg));
  const m = identity();
  m[0] = c;  m[8] = s;
  m[2] = -s; m[10] = c;
  return m;
}

export function rotateZ(deg) {
  const c = Math.cos(radians(deg)), s = Math.sin(radians(deg));
  const m = identity();
  m[0] = c;  m[4] = -s;
  m[1] = s;  m[5] = c;
  return m;
}

// 원근 투영 행렬 (Projection)
// fovy: 세로 시야각(도), aspect: 화면 가로/세로 비율, near/far: 보이는 깊이 범위
export function perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(radians(fovy) / 2);
  const m = new Float32Array(16);
  m[0] = f / aspect;
  m[5] = f;
  m[10] = (far + near) / (near - far);
  m[11] = -1;
  m[14] = (2 * far * near) / (near - far);
  return m;
}

// 카메라(View) 행렬: eye 위치에서 at 지점을 바라봄, up은 카메라의 위쪽 방향
export function lookAt(eye, at, up) {
  const n = normalize(sub(eye, at));        // 카메라 뒤쪽 방향
  const u = normalize(cross(up, n));        // 카메라 오른쪽 방향
  const v = cross(n, u);                    // 카메라 위쪽 방향
  return new Float32Array([
    u[0], v[0], n[0], 0,
    u[1], v[1], n[1], 0,
    u[2], v[2], n[2], 0,
    -dot(u, eye), -dot(v, eye), -dot(n, eye), 1,
  ]);
}