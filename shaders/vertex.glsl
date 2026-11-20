// 정점마다 실행: 모델·카메라·투영 변환을 적용해 화면 위치를 계산
attribute vec4 vPosition;
attribute vec4 vColor;

uniform mat4 modelViewMatrix;   // 객체 배치(Model) + 카메라 시점(View)
uniform mat4 projectionMatrix;  // 원근 투영(Projection)

varying vec4 fColor;

void main() {
    fColor = vColor;
    gl_Position = projectionMatrix * modelViewMatrix * vPosition;
}