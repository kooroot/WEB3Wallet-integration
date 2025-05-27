# 지갑 SDK 통합 문서

이 문서는 Privy, Dynamic, Wepin SDK의 통합 방법과 사용 가능한 모든 메소드를 정리한 참고 자료입니다.

## 목차
1. [Privy SDK](#privy-sdk)
2. [Dynamic SDK](#dynamic-sdk) 
3. [Wepin SDK](#wepin-sdk)
4. [통합 예제](#통합-예제)

---

## Privy SDK

### 설치
```bash
npm install @privy-io/react-auth @privy-io/wagmi-connector
```

### 초기 설정

#### PrivyProvider 설정
```tsx
import { PrivyProvider } from "@privy-io/react-auth";

<PrivyProvider
  appId={import.meta.env.VITE_PRIVY_APP_ID}
  config={{
    appearance: {
      theme: "light",
      accentColor: "#676FFF",
      logo: "https://your-logo.png",
      walletList: ["metamask", "rainbow", "coinbase_wallet"]
    },
    loginMethods: ["email", "wallet", "google", "twitter", "discord"],
    embeddedWallets: {
      createOnLogin: "users-without-wallets", // 또는 "all-users", "off"
      requireUserPasswordOnCreate: false,
      showWalletLoginFirst: true
    },
    defaultChain: sepolia,
    supportedChains: [sepolia, mainnet, polygon],
    walletConnectCloudProjectId: "YOUR_WALLETCONNECT_PROJECT_ID"
  }}
>
  {children}
</PrivyProvider>
```

### 주요 Hooks와 메소드

#### usePrivy Hook
```tsx
import { usePrivy } from "@privy-io/react-auth";

const {
  ready,              // Privy 초기화 완료 여부
  authenticated,      // 사용자 인증 여부
  user,              // 사용자 정보 객체
  login,             // 로그인 함수
  logout,            // 로그아웃 함수
  linkEmail,         // 이메일 연결
  linkWallet,        // 지갑 연결
  linkGoogle,        // Google 계정 연결
  linkTwitter,       // Twitter 계정 연결
  linkDiscord,       // Discord 계정 연결
  unlinkEmail,       // 이메일 연결 해제
  unlinkWallet,      // 지갑 연결 해제
  updateEmail,       // 이메일 업데이트
  sendTransaction,   // 트랜잭션 전송
  signMessage,       // 메시지 서명
  signTypedData,     // 타입 데이터 서명
} = usePrivy();
```

#### useWallets Hook
```tsx
import { useWallets } from "@privy-io/react-auth";

const { wallets } = useWallets();

// Wallet 객체 메소드
wallet.address                    // 지갑 주소
wallet.chainId                    // 체인 ID
wallet.walletClientType          // 지갑 타입
wallet.getEthereumProvider()     // Provider 객체 반환
wallet.switchChain(chainId)      // 체인 전환
wallet.sendTransaction(tx)       // 트랜잭션 전송
wallet.signMessage(message)      // 메시지 서명
wallet.signTypedData(data)       // 타입 데이터 서명
```

#### useCreateWallet Hook
```tsx
import { useCreateWallet } from "@privy-io/react-auth";

const { createWallet, error, loading } = useCreateWallet();

// 새 임베디드 지갑 생성
await createWallet();
```

#### useEmbeddedWallet Hook
```tsx
import { useEmbeddedWallet } from "@privy-io/react-auth";

const embeddedWallet = useEmbeddedWallet();

// 임베디드 지갑 메소드
embeddedWallet.getSigner()           // Signer 객체 반환
embeddedWallet.getProvider()         // Provider 객체 반환
embeddedWallet.exportWallet()        // 개인키 내보내기
embeddedWallet.setRecoveryMethod()   // 복구 방법 설정
```

### 추가 기능

#### 사용자 정보 접근
```tsx
// User 객체 구조
user = {
  id: string,
  email?: { address: string },
  phone?: { number: string },
  wallet?: { 
    address: string,
    chainType: "ethereum" | "solana",
    walletClient: string,
    connectorType: string
  },
  google?: { email: string, subject: string },
  twitter?: { username: string, subject: string },
  discord?: { username: string, subject: string },
  linkedAccounts: LinkedAccount[],
  createdAt: Date,
  hasAcceptedTerms: boolean
}
```

#### 이벤트 리스너
```tsx
import { usePrivyEvent } from "@privy-io/react-auth";

// 로그인 이벤트
usePrivyEvent('login', (user) => {
  console.log('User logged in:', user);
});

// 로그아웃 이벤트
usePrivyEvent('logout', () => {
  console.log('User logged out');
});

// 지갑 연결 이벤트
usePrivyEvent('linkWallet', (wallet) => {
  console.log('Wallet linked:', wallet);
});
```

---

## Dynamic SDK

### 설치
```bash
npm install @dynamic-labs/sdk-react-core @dynamic-labs/ethereum
```

### 초기 설정

#### DynamicContextProvider 설정
```tsx
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";

<DynamicContextProvider
  settings={{
    environmentId: import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID,
    walletConnectors: [EthereumWalletConnectors],
    
    // 인증 설정
    initialAuthenticationMode: 'connect-and-sign',
    siweStatement: 'Sign in to our app',
    
    // UI 커스터마이징
    cssOverrides: `
      .wallet-list { background: #f0f0f0; }
      .connect-button { border-radius: 8px; }
    `,
    
    // 네트워크 설정
    overrides: {
      evmNetworks: [
        {
          chainId: 1,
          chainName: "Ethereum Mainnet",
          nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18
          },
          rpcUrls: ["https://mainnet.infura.io/v3/YOUR_KEY"],
          blockExplorerUrls: ["https://etherscan.io"],
          networkId: 1,
          vanityName: "Ethereum",
          iconUrls: ["https://ethereum.org/icon.png"]
        }
      ]
    },
    
    // 추가 설정
    bridgeChains: [
      { chain: 'ETH' },
      { chain: 'MATIC' }
    ],
    recommendedWallets: [
      { walletKey: 'metamask' },
      { walletKey: 'rainbow' }
    ],
    walletConnectV2ProjectId: "YOUR_PROJECT_ID",
    privacyPolicyUrl: "https://privacy.com",
    termsOfServiceUrl: "https://terms.com"
  }}
>
  {children}
</DynamicContextProvider>
```

### 주요 Hooks와 메소드

#### useDynamicContext Hook
```tsx
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

const {
  user,                     // 사용자 정보
  primaryWallet,           // 주 지갑
  walletConnector,         // 지갑 커넥터
  setShowAuthFlow,         // 인증 플로우 표시
  setShowQrcodeModal,      // QR 코드 모달 표시
  setShowWalletModal,      // 지갑 모달 표시
  handleLogOut,            // 로그아웃
  authToken,               // 인증 토큰
  isAuthenticated,         // 인증 여부
  sdkHasLoaded,           // SDK 로드 완료 여부
  network,                 // 현재 네트워크
  networkConfigurations,   // 네트워크 설정
  setPrimaryWallet,        // 주 지갑 설정
  wallets,                 // 모든 연결된 지갑
} = useDynamicContext();
```

#### Wallet 메소드 (Ethereum)
```tsx
import { isEthereumWallet } from "@dynamic-labs/ethereum";

if (isEthereumWallet(primaryWallet)) {
  // Wallet Client 메소드
  const walletClient = await primaryWallet.getWalletClient();
  
  // 사용 가능한 메소드들
  walletClient.account              // 계정 정보
  walletClient.chain                // 체인 정보
  walletClient.sendTransaction()    // 트랜잭션 전송
  walletClient.signMessage()        // 메시지 서명
  walletClient.signTypedData()      // 타입 데이터 서명
  walletClient.switchChain()        // 체인 전환
  walletClient.watchAsset()         // 자산 추가
  walletClient.addChain()           // 체인 추가
  
  // Public Client 메소드
  const publicClient = await primaryWallet.getPublicClient();
  
  publicClient.getBalance()         // 잔액 조회
  publicClient.getBlock()           // 블록 조회
  publicClient.getTransaction()     // 트랜잭션 조회
  publicClient.call()               // 컨트랙트 호출
  publicClient.estimateGas()        // 가스 예측
  publicClient.getChainId()         // 체인 ID 조회
}
```

#### 이벤트 리스너
```tsx
import { useDynamicEvents } from "@dynamic-labs/sdk-react-core";

// 지갑 연결 이벤트
useDynamicEvents('walletConnected', (wallet) => {
  console.log('Wallet connected:', wallet);
});

// 지갑 연결 해제 이벤트
useDynamicEvents('walletDisconnected', (wallet) => {
  console.log('Wallet disconnected:', wallet);
});

// 네트워크 변경 이벤트
useDynamicEvents('primaryWalletNetworkChanged', (network) => {
  console.log('Network changed:', network);
});

// 인증 성공 이벤트
useDynamicEvents('authSuccess', (args) => {
  console.log('Auth success:', args);
});

// 로그아웃 이벤트
useDynamicEvents('logout', () => {
  console.log('User logged out');
});
```

#### 추가 Hooks
```tsx
// 이메일 인증
import { useEmailAuth } from "@dynamic-labs/sdk-react-core";
const { sendEmailOtp, verifyEmailOtp } = useEmailAuth();

// SMS 인증
import { useSmsAuth } from "@dynamic-labs/sdk-react-core";
const { sendSmsOtp, verifySmsOtp } = useSmsAuth();

// 소셜 로그인
import { useSocialAuth } from "@dynamic-labs/sdk-react-core";
const { signInWithGoogle, signInWithTwitter } = useSocialAuth();
```

---

## Wepin SDK

### 설치
```bash
npm install @wepin/sdk-js @wepin/login-js @wepin/wagmi-connector
```

### 초기 설정

#### WepinSDK 초기화
```tsx
import { WepinSDK } from "@wepin/sdk-js";

const wepin = new WepinSDK({
  appId: import.meta.env.VITE_WEPIN_APP_ID,
  appKey: import.meta.env.VITE_WEPIN_APP_KEY,
});

// SDK 초기화
await wepin.init({
  type: 'show',              // 'show' | 'hide'
  defaultLanguage: 'en',     // 'ko' | 'en' | 'ja'
  defaultCurrency: 'USD',    // 'KRW' | 'USD' | 'JPY'
});
```

### 주요 메소드

#### 인증 관련
```tsx
// UI를 통한 로그인
const userInfo = await wepin.loginWithUI({ 
  email?: string           // 선택적 이메일 자동 입력
});

// OAuth 로그인
const loginResult = await wepin.loginWithOauthProvider({
  provider: 'google' | 'naver' | 'discord' | 'apple',
  clientId: string
});

// 이메일/비밀번호 로그인
const loginResult = await wepin.loginWithEmailAndPassword(
  email: string,
  password: string
);

// ID 토큰으로 로그인
const userInfo = await wepin.loginWithIdToken(
  idToken: string,
  sign: string
);

// 액세스 토큰으로 로그인
const userInfo = await wepin.loginWithAccessToken(
  provider: string,
  accessToken: string,
  sign: string
);

// 로그아웃
await wepin.logout();

// 회원가입
const signUpResult = await wepin.signUpWithEmailAndPassword(
  email: string,
  password: string
);

// 현재 사용자 정보
const userInfo = await wepin.getCurrentUser();
```

#### 지갑 관리
```tsx
// 계정 목록 조회
const accounts = await wepin.getAccounts();
// Account 구조: {
//   address: string,
//   network: string,
//   contract?: string,
//   isAA?: boolean
// }

// 잔액 조회
const balance = await wepin.getBalance(account: Account);
// Balance 구조: {
//   symbol: string,
//   balance: string,
//   tokens?: Token[]
// }

// NFT 조회
const nfts = await wepin.getNFTs({
  refresh?: boolean,
  networks?: string[]
});
```

#### 위젯 제어
```tsx
// 위젯 열기
await wepin.openWidget();

// 위젯 닫기
wepin.closeWidget();

// 위젯 상태 변경
await wepin.changeWidgetState(
  state: 'hide' | 'show'
);
```

#### 트랜잭션 및 서명
```tsx
// 트랜잭션 전송
const txHash = await wepin.send({
  account: Account,
  to: string,
  amount: string
});

// 메시지 서명
const signature = await wepin.signMessage({
  account: Account,
  message: string
});

// 타입 데이터 서명
const signature = await wepin.signTypedData({
  account: Account,
  typedData: object
});
```

#### Provider 관련
```tsx
// Provider 가져오기
const provider = await wepin.getProvider({
  network: 'ethereum' | 'polygon' | 'klaytn'
});

// Provider를 통한 작업
const signer = provider.getSigner();
const balance = await signer.getBalance();
const tx = await signer.sendTransaction({
  to: address,
  value: amount
});
```

### WepinLogin 클래스
```tsx
import { WepinLogin } from "@wepin/login-js";

const wepinLogin = new WepinLogin({
  appId: string,
  appKey: string
});

// 초기화
await wepinLogin.init();

// OAuth 로그인
const result = await wepinLogin.loginWithOauthProvider({
  provider: 'google' | 'naver' | 'discord' | 'apple'
});

// 이메일 로그인
const result = await wepinLogin.loginWithEmailAndPassword(
  email: string,
  password: string
);

// 로그아웃
await wepinLogin.logout();

// 사용자 정보 조회
const userInfo = await wepinLogin.getCurrentUser();

// 토큰 갱신
const newTokens = await wepinLogin.refreshToken(
  refreshToken: string
);
```

### Wepin Wagmi Connector
```tsx
import { wepinWallet } from "@wepin/wagmi-connector";

const connector = wepinWallet({
  appId: string,
  appKey: string,
  defaultChainId?: number,
  loginOptions?: {
    provider?: string,
    email?: string
  }
});

// Wagmi와 함께 사용
import { useConnect } from "wagmi";

const { connect } = useConnect();
await connect({ connector });
```

---

## 통합 예제

### 1. 멀티 지갑 연결 구현
```tsx
import { usePrivy } from "@privy-io/react-auth";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { loginWithWepin } from "./wepinSDK";

function WalletConnect() {
  // Privy
  const { login: privyLogin, authenticated: privyAuth } = usePrivy();
  
  // Dynamic
  const { setShowAuthFlow, user: dynamicUser } = useDynamicContext();
  
  // Wepin
  const [wepinAuth, setWepinAuth] = useState(false);
  
  const handleConnect = async (walletType: string) => {
    switch(walletType) {
      case 'privy':
        await privyLogin();
        break;
      case 'dynamic':
        setShowAuthFlow(true);
        break;
      case 'wepin':
        const user = await loginWithWepin();
        if (user) setWepinAuth(true);
        break;
    }
  };
  
  return (
    <div>
      <button onClick={() => handleConnect('privy')}>
        Privy로 연결
      </button>
      <button onClick={() => handleConnect('dynamic')}>
        Dynamic으로 연결
      </button>
      <button onClick={() => handleConnect('wepin')}>
        Wepin으로 연결
      </button>
    </div>
  );
}
```

### 2. 트랜잭션 전송 통합
```tsx
async function sendTransaction(walletType: string, to: string, value: string) {
  switch(walletType) {
    case 'privy': {
      const { wallets } = useWallets();
      const wallet = wallets[0];
      const provider = await wallet.getEthereumProvider();
      
      const walletClient = createWalletClient({
        chain: sepolia,
        transport: custom(provider),
      });
      
      return await walletClient.sendTransaction({
        to,
        value: parseEther(value),
        account: wallet.address
      });
    }
    
    case 'dynamic': {
      const { primaryWallet } = useDynamicContext();
      const walletClient = await primaryWallet.getWalletClient();
      
      return await walletClient.sendTransaction({
        to,
        value: parseEther(value),
        account: walletClient.account
      });
    }
    
    case 'wepin': {
      const wepin = getWepinSDK();
      const accounts = await wepin.getAccounts();
      
      return await wepin.send({
        account: accounts[0],
        to,
        amount: value
      });
    }
  }
}
```

### 3. 메시지 서명 통합
```tsx
async function signMessage(walletType: string, message: string) {
  switch(walletType) {
    case 'privy': {
      const { wallets } = useWallets();
      return await wallets[0].signMessage(message);
    }
    
    case 'dynamic': {
      const { primaryWallet } = useDynamicContext();
      const walletClient = await primaryWallet.getWalletClient();
      return await walletClient.signMessage({ message });
    }
    
    case 'wepin': {
      const wepin = getWepinSDK();
      const accounts = await wepin.getAccounts();
      return await wepin.signMessage({
        account: accounts[0],
        message
      });
    }
  }
}
```

### 4. 네트워크 전환 통합
```tsx
async function switchNetwork(walletType: string, chainId: number) {
  switch(walletType) {
    case 'privy': {
      const { wallets } = useWallets();
      await wallets[0].switchChain(chainId);
      break;
    }
    
    case 'dynamic': {
      const { primaryWallet } = useDynamicContext();
      const walletClient = await primaryWallet.getWalletClient();
      await walletClient.switchChain({ id: chainId });
      break;
    }
    
    case 'wepin': {
      // Wepin은 위젯을 통해 네트워크 전환
      const wepin = getWepinSDK();
      await wepin.openWidget();
      break;
    }
  }
}
```

---

## 주의사항 및 팁

1. **환경 변수 설정**
   - Privy: `VITE_PRIVY_APP_ID`
   - Dynamic: `VITE_DYNAMIC_ENVIRONMENT_ID`
   - Wepin: `VITE_WEPIN_APP_ID`, `VITE_WEPIN_APP_KEY`

2. **에러 처리**
   - 각 SDK마다 다른 에러 형식을 가지므로 통합 에러 핸들러 구현 권장
   - 네트워크 연결 실패, 사용자 거부 등의 공통 에러 처리

3. **상태 관리**
   - 여러 지갑 연결 상태를 중앙에서 관리
   - 현재 활성 지갑과 연결 타입 추적

4. **UX 고려사항**
   - 지갑별 연결 플로우가 다르므로 일관된 UX 제공
   - 로딩 상태와 에러 메시지 통합 관리

5. **보안**
   - 개인키는 절대 로컬에 저장하지 않음
   - 모든 민감한 작업은 SDK 내부에서 처리