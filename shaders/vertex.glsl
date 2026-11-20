// 정점마다 실행: 위치 변환 + 법선 변환
attribute vec4 vPosition;
attribute vec3 vNormal;

uniform mat4 modelMatrix;       // 객체 배치 (Model)
uniform mat4 viewMatrix;        // 카메라 시점 (View)
uniform mat4 projectionMatrix;  // 원근 투영 (Projection)
uniform mat3 normalMatrix;      // 법선 변환 (Model의 역행렬의 전치)

varying vec3 fNormal;

void main() {
    fNormal = normalMatrix * vNormal;   // 월드 공간의 법선
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vPosition;
}