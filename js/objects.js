// 게임에 쓰이는 3D 모델(정점 데이터) 생성

// 한 변의 길이가 1이고 원점이 중심인 정육면체
// 면 6개 × 삼각형 2개 × 정점 3개 = 정점 36개
export function createCube(faceColors) {
  // 정육면체의 꼭짓점 8개
  const v = [
    [-0.5, -0.5,  0.5], [ 0.5, -0.5,  0.5], [ 0.5,  0.5,  0.5], [-0.5,  0.5,  0.5], // 앞면 4개
    [-0.5, -0.5, -0.5], [ 0.5, -0.5, -0.5], [ 0.5,  0.5, -0.5], [-0.5,  0.5, -0.5], // 뒷면 4개
  ];

  // 각 면을 이루는 꼭짓점 번호 (바깥에서 봤을 때 반시계 방향)
  const faces = [
    [0, 1, 2, 3], // 앞 (+z)
    [5, 4, 7, 6], // 뒤 (-z)
    [4, 0, 3, 7], // 왼쪽 (-x)
    [1, 5, 6, 2], // 오른쪽 (+x)
    [3, 2, 6, 7], // 위 (+y)
    [4, 5, 1, 0], // 아래 (-y)
  ];

  const positions = [];
  const colors = [];
  faces.forEach((f, i) => {
    // 사각형 하나 = 삼각형 2개 (a,b,c) + (a,c,d)
    const quad = [f[0], f[1], f[2], f[0], f[2], f[3]];
    quad.forEach(idx => {
      positions.push(...v[idx]);
      colors.push(...faceColors[i]);
    });
  });

  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    count: positions.length / 3,   // 정점 개수 (36)
  };
}