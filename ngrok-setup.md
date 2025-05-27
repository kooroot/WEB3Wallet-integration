# ngrok 설정 가이드

## 1. ngrok 설치
```bash
# macOS
brew install ngrok

# 또는 직접 다운로드
# https://ngrok.com/download
```

## 2. ngrok 실행
```bash
# Vite 개발 서버가 실행 중인 포트로 터널 생성
ngrok http 5174
```

## 3. 필요한 설정 업데이트

### Dynamic Labs Dashboard
1. https://app.dynamic.xyz/dashboard 접속
2. Settings > Security 탭으로 이동
3. "Allowed Origins"에 ngrok URL 추가:
   - `https://xxxxx.ngrok.io` (ngrok이 제공한 URL)

### Privy Dashboard  
1. https://dashboard.privy.io 접속
2. Settings > Allowed Domains 설정
3. ngrok URL 추가

### Wepin Console
1. https://console.wepin.io 접속
2. App Settings > Domain Whitelist
3. ngrok URL 추가

## 4. 환경 변수 설정 (필요한 경우)

`.env` 파일에 다음 추가:
```bash
VITE_PUBLIC_URL=https://xxxxx.ngrok.io
```

## 5. Vite 설정 (필요한 경우)

`vite.config.ts`에 다음 추가:
```typescript
export default defineConfig({
  server: {
    host: true, // 모든 네트워크 인터페이스에서 접근 가능
    port: 5174,
  },
  // ... 기존 설정
})
```

## 주의사항

1. **HTTPS 필수**: 지갑 연결은 HTTPS에서만 작동합니다. ngrok은 자동으로 HTTPS를 제공합니다.

2. **CORS 설정**: 각 서비스의 대시보드에서 ngrok URL을 허용해야 합니다.

3. **임시 URL**: 무료 ngrok은 재시작할 때마다 URL이 변경됩니다. 고정 URL이 필요하면 유료 플랜을 고려하세요.

4. **로컬 네트워크**: Anvil (localhost:8545)은 ngrok을 통해 접근하는 외부 사용자는 사용할 수 없습니다. Sepolia 같은 공개 테스트넷만 사용 가능합니다.

5. **모바일 지갑**: 모바일 지갑 앱으로 테스트하려면 ngrok URL이 필요합니다.

## 테스트 방법

1. ngrok URL을 브라우저에 입력
2. 지갑 연결 테스트
3. 네트워크 전환 테스트
4. 트랜잭션 전송 테스트