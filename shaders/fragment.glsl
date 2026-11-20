// 픽셀마다 실행: 간단한 조명(Ambient + Diffuse)으로 색 결정
precision mediump float;

uniform vec4 objectColor;   // 객체 색
uniform vec3 lightDir;      // 빛이 오는 방향 (월드 공간)
uniform float emissive;     // 발광 정도 0~1 (1이면 조명과 상관없이 밝게)

varying vec3 fNormal;

void main() {
    vec3 n = normalize(fNormal);
    float diffuse = max(dot(n, normalize(lightDir)), 0.0);   // 램버트 조명: cosθ
    float light = 0.45 + 0.55 * diffuse;                     // 주변광 0.45 + 확산광
    vec3 color = objectColor.rgb * mix(light, 1.0, emissive);
    gl_FragColor = vec4(color, objectColor.a);
}