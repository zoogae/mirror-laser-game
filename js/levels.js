// 레벨 데이터
// - 좌표는 게임판 격자 [col, row] (col: 오른쪽, row: 앞쪽으로 증가)
// - 각도는 도 단위, 격자의 +col 방향이 0°, +row 방향이 90°
//   · source.dir: 레이저 발사 방향 (0, 90, 180, 270)
//   · mirror.angle: 거울판이 놓인 방향 (45° 단위)
// - solution: 각 거울의 정답 각도 (7단계 검증용)

export const LEVELS = [
  {
    id: '1-1', stage: 1, theme: 'lab',
    size: [7, 7],
    source:  { pos: [0, 3], dir: 0 },
    mirrors: [ { pos: [4, 3], angle: 45, rotatable: true } ],
    walls:   [ [2, 1], [2, 5], [6, 6] ],
    targets: [ { pos: [4, 0] } ],
    solution: [135],
  },
];