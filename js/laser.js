// 레이저 경로 계산 (게임판 격자 위의 2차원 계산)
// - 레이저: 반직선 P(t) = P0 + t·d   (t ≥ 0)
// - 거울·벽 테두리: 선분 Q(u) = A + u·(B − A)   (0 ≤ u ≤ 1)
// - 반사: r = d − 2(d·n)n

const MAX_BOUNCES = 30;   // 무한 반사 방지
const EPS = 1e-6;         // 같은 지점에 다시 부딪히지 않도록 하는 아주 작은 값

// ---------------- 2차원 벡터 ----------------
const add2   = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub2   = (a, b) => [a[0] - b[0], a[1] - b[1]];
const scale2 = (a, s) => [a[0] * s, a[1] * s];
const dot2   = (a, b) => a[0] * b[0] + a[1] * b[1];
const cross2 = (a, b) => a[0] * b[1] - a[1] * b[0];   // 2D 외적 (스칼라)

// 각도(도) → 단위 방향 벡터. 0° = +col, 90° = +row
export function dirFromAngle(deg) {
  const r = deg * Math.PI / 180;
  // 45° 단위 각도에서 생기는 아주 작은 오차(예: 6e-17)를 0으로 정리
  const clean = v => (Math.abs(v) < 1e-12 ? 0 : v);
  return [clean(Math.cos(r)), clean(Math.sin(r))];
}

// 반사 공식 r = d − 2(d·n)n
export function reflect(d, n) {
  return sub2(d, scale2(n, 2 * dot2(d, n)));
}

// 반직선(P0, d)과 선분(A, B)의 교차 검사
// P0 + t·d = A + u·e 를 풀면  t = (w × e) / (d × e),  u = (w × d) / (d × e)   (w = A − P0)
// 충돌하면 t, 아니면 null
export function raySegment(P0, d, A, B) {
  const e = sub2(B, A);
  const denom = cross2(d, e);
  if (Math.abs(denom) < 1e-12) return null;     // 평행: 만나지 않음
  const w = sub2(A, P0);
  const t = cross2(w, e) / denom;
  const u = cross2(w, d) / denom;
  if (t > EPS && u >= 0 && u <= 1) return t;
  return null;
}

// ---------------- 충돌 대상 만들기 ----------------
// 정사각형 상자(중심 c, 반 크기 h)의 네 변을 선분으로
function boxEdges(c, h) {
  const [x, y] = c;
  const p = [[x - h, y - h], [x + h, y - h], [x + h, y + h], [x - h, y + h]];
  return [[p[0], p[1]], [p[1], p[2]], [p[2], p[3]], [p[3], p[0]]];
}

// 레벨의 모든 객체를 { 종류, 선분 A, B, ... } 목록으로 변환
function buildColliders(level) {
  const list = [];
  const [w, h] = level.size;

  // 게임판 경계 (칸의 중심이 정수 좌표이므로 경계는 −0.5 ~ size − 0.5)
  const b = [[-0.5, -0.5], [w - 0.5, -0.5], [w - 0.5, h - 0.5], [-0.5, h - 0.5]];
  for (let i = 0; i < 4; i++) list.push({ type: 'boundary', A: b[i], B: b[(i + 1) % 4] });

  // 벽: 크기 0.9 상자
  level.walls.forEach(pos =>
    boxEdges(pos, 0.45).forEach(([A, B]) => list.push({ type: 'wall', A, B })));

  // 발사 장치: 다시 돌아온 레이저를 막음
  boxEdges(level.source.pos, 0.35).forEach(([A, B]) => list.push({ type: 'wall', A, B }));

  // 목표 장치
  level.targets.forEach((t, index) =>
    boxEdges(t.pos, 0.3).forEach(([A, B]) => list.push({ type: 'target', index, A, B })));

  // 거울: 칸 중심을 지나는 길이 0.9 선분, 법선 n은 거울 방향에 수직
  level.mirrors.forEach((m, index) => {
    const dir = dirFromAngle(m.angle);
    const half = scale2(dir, 0.45);
    list.push({
      type: 'mirror', index,
      A: sub2(m.pos, half),
      B: add2(m.pos, half),
      n: [-dir[1], dir[0]],
    });
  });

  return list;
}

// ---------------- 레이저 추적 ----------------
// 반환: points(꺾이는 지점들), hitTargets(도달한 목표 번호 Set)
export function traceLaser(level) {
  const colliders = buildColliders(level);
  let d = dirFromAngle(level.source.dir);
  let P0 = add2(level.source.pos, scale2(d, 0.4));   // 발사 장치 바깥에서 출발
  const points = [P0];
  const hitTargets = new Set();

  for (let bounce = 0; bounce <= MAX_BOUNCES; bounce++) {
    // 1) 모든 객체와 교차점을 구하고 2) 가장 가까운 것(t 최소)을 고름
    let best = null, bestT = Infinity;
    for (const c of colliders) {
      const t = raySegment(P0, d, c.A, c.B);
      if (t !== null && t < bestT) { bestT = t; best = c; }
    }
    if (!best) break;   // 이론상 경계가 있으므로 일어나지 않음

    const hit = add2(P0, scale2(d, bestT));
    points.push(hit);

    if (best.type === 'mirror') {
      // 3) 거울이면 반사 후 계속 진행
      d = reflect(d, best.n);
      P0 = hit;
      continue;
    }
    if (best.type === 'target') hitTargets.add(best.index);   // 4) 목표면 성공 갱신
    break;                                                    // 5) 벽·경계·목표면 종료
  }

  return { points, hitTargets };
}

// ---------------- 반사 공식 검증 (성공 기준: 반사 정확성) ----------------
// 4가지 입사 방향 × 거울 각도 4가지 결과를 콘솔 표로 출력
export function runReflectTests() {
  const names = { '1,0': '→ (+col)', '0,1': '↓ (+row)', '-1,0': '← (−col)', '0,-1': '↑ (−row)' };
  const rows = [];
  for (const inDeg of [0, 90, 180, 270]) {
    for (const mirrorDeg of [0, 45, 90, 135]) {
      const d = dirFromAngle(inDeg);
      const m = dirFromAngle(mirrorDeg);
      const r = reflect(d, [-m[1], m[0]]).map(v => Math.round(v * 1000) / 1000 + 0);
      rows.push({ 입사: names[d.join(',')], 거울각도: mirrorDeg + '°', 반사: names[r.join(',')] || r.join(', ') });
    }
  }
  console.table(rows);
}