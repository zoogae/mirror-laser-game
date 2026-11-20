attribute vec4 vPosition;
attribute vec4 vColor;

varying vec4 fColor;

void main() {
    fColor = vColor;
    gl_Position = vPosition;   // 1단계: 변환 없이 그대로 출력 (2단계에서 행렬 적용)
}