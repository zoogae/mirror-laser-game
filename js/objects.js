// 게임에 쓰이는 3D 모델 생성
// - createCube(): 모든 객체의 기본이 되는 정육면체 (위치 + 법선)
// - buildScene(level): 레벨 데이터를 읽어 "그릴 부품 목록"을 만듦
import { mult, translate, scaleMat, rotateY } from './math.js';

// ---------------- 기본 정육면체 ----------------
// 한 변의 길이가 1이고 원점이 중심. 정점 36개
export function createCube() {
  const v = [
    [-0.5, -0.5,  0.5], [ 0.5, -0.5,  0.5], [ 0.5,  0.5,  0.5], [-0.5,  0.5,  0.5],
    [-0.5, -0.5, -0.5], [ 0.5, -0.5, -0.5], [ 0.5,  0.5, -0.5], [-0.5,  0.5, -0.5],
  ];
  // [꼭짓점 번호 4개, 면의 법선 벡터]
  const faces = [
    [[0, 1, 2, 3], [ 0,  0,  1]], // 앞 (+z)
    [[5, 4, 7, 6], [ 0,  0, -1]], // 뒤 (-z)
    [[4, 0, 3, 7], [-1,  0,  0]], // 왼쪽 (-x)
    [[1, 5, 6, 2], [ 1,  0,  0]], // 오른쪽 (+x)
    [[3, 2, 6, 7], [ 0,  1,  0]], // 위 (+y)
    [[4, 5, 1, 0], [ 0, -1,  0]], // 아래 (-y)
  ];

  const positions = [];
  const normals = [];
  faces.forEach(([f, n]) => {
    [f[0], f[1], f[2], f[0], f[2], f[3]].forEach(idx => {
      positions.push(...v[idx]);
      normals.push(...n);
    });
  });

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    count: positions.length / 3,
  };
}

// ---------------- 색상 (8단계에서 themes.js로 옮김) ----------------
const COLORS = {
  floorA:  [0.36, 0.32, 0.88, 1],
  floorB:  [0.42, 0.38, 0.93, 1],
  base:    [0.25, 0.21, 0.72, 1],
  wall:    [0.18, 0.25, 0.82, 1],
  metal:   [0.17, 0.18, 0.27, 1],
  metal2:  [0.29, 0.31, 0.45, 1],
  laser:   [1.00, 0.24, 0.60, 1],
  mirror:  [0.80, 0.93, 1.00, 1],
  rotBase: [0.50, 0.90, 1.00, 1],   // 회전 거울 받침대
  fixBase: [0.36, 0.38, 0.47, 1],   // 고정 거울 받침대
  target:  [0.55, 0.57, 0.66, 1],   // 비활성 목표
};

// ---------------- 좌표 변환 ----------------
// 게임판 격자 (col, row) → 3D 공간 (x, z). 게임판 중앙이 원점이 되도록 이동
//  - col: 오른쪽(+x)으로 증가, row: 앞쪽(+z)으로 증가, 바닥 윗면은 y = 0
export function gridToWorld(level, col, row) {
  const [w, h] = level.size;
  return [col - (w - 1) / 2, row - (h - 1) / 2];
}

// 부품 하나: 정육면체에 적용할 모델 행렬 + 색 + 발광 정도
function part(model, color, emissive = 0) {
  return { model, color, emissive };
}

// 크기(sx,sy,sz)의 상자를 바닥면 높이 y0에 놓고, y축으로 회전한 뒤 (x,z)로 이동
function box(x, z, y0, sx, sy, sz, color, angleDeg = 0, emissive = 0) {
  const model = mult(
    translate(x, y0 + sy / 2, z),   // 3) 제자리로 이동 (바닥면이 y0에 오도록)
    rotateY(-angleDeg),             // 2) 회전 (격자 각도는 +x에서 +z 방향으로 잼)
    scaleMat(sx, sy, sz),           // 1) 크기 변환
  );
  return part(model, color, emissive);
}

// ---------------- 장면 구성 ----------------
export function buildScene(level) {
  const parts = [];
  const [w, h] = level.size;

  // 게임판 받침
  parts.push(box(0, 0, -0.55, w + 0.2, 0.35, h + 0.2, COLORS.base));

  // 바닥 타일: 칸마다 얇은 상자, 체크무늬 색
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const [x, z] = gridToWorld(level, col, row);
      const c = (col + row) % 2 ? COLORS.floorA : COLORS.floorB;
      parts.push(box(x, z, -0.2, 0.94, 0.2, 0.94, c));
    }
  }

  // 벽: 칸을 거의 채우는 정육면체
  level.walls.forEach(([col, row]) => {
    const [x, z] = gridToWorld(level, col, row);
    parts.push(box(x, z, 0, 0.9, 0.9, 0.9, COLORS.wall));
  });

  // 레이저 발사 장치: 받침 + 몸통 + 발사구(발사 방향으로 튀어나옴)
  {
    const s = level.source;
    const [x, z] = gridToWorld(level, s.pos[0], s.pos[1]);
    parts.push(box(x, z, 0, 0.7, 0.25, 0.7, COLORS.metal));
    parts.push(box(x, z, 0.25, 0.45, 0.45, 0.45, COLORS.metal2, s.dir));
    const rad = s.dir * Math.PI / 180;
    parts.push(box(x + Math.cos(rad) * 0.3, z + Math.sin(rad) * 0.3, 0.38, 0.2, 0.2, 0.2,
                   COLORS.laser, s.dir, 1.0));
  }

  // 목표 장치: 받침 + 45° 돌린 작은 결정(큐브)
  level.targets.forEach(t => {
    const [x, z] = gridToWorld(level, t.pos[0], t.pos[1]);
    parts.push(box(x, z, 0, 0.7, 0.2, 0.7, COLORS.metal));
    const crystal = mult(translate(x, 0.6, z), rotateY(45), scaleMat(0.3, 0.45, 0.3));
    parts.push(part(crystal, COLORS.target));
  });

  // 거울: 받침(회전/고정 색 구분) + 얇은 거울판
  level.mirrors.forEach(m => {
    const [x, z] = gridToWorld(level, m.pos[0], m.pos[1]);
    parts.push(box(x, z, 0, 0.6, 0.1, 0.6, m.rotatable ? COLORS.rotBase : COLORS.fixBase));
    parts.push(box(x, z, 0.1, 0.9, 0.8, 0.07, COLORS.mirror, m.angle, 0.35));
  });

  return parts;
}