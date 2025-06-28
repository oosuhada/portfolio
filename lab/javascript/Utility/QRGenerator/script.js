const qrcodeDiv = document.getElementById("qrcode");
const textInput = document.getElementById("text");
const downloadQrBtn = document.getElementById("downloadQrBtn"); // 새롭게 추가된 버튼

// QRCode 객체 초기화 (옵션을 추가하여 이미지로 다운로드하기 좋게 만듭니다)
// qrcode.js는 기본적으로 canvas로 렌더링하지만, 혹시 문제가 있다면 render:"canvas" 옵션을 명시할 수 있습니다.
const qr = new QRCode(qrcodeDiv, {
    width: 256,
    height: 256,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H // 에러 복구 레벨 (높을수록 좋음)
});

// QR 코드 생성 함수
const generateQrCode = () => {
    const text = textInput.value.trim();
    if (text) {
        qr.makeCode(text);
        downloadQrBtn.style.display = 'block'; // 텍스트가 있으면 버튼 보이게
    } else {
        // 텍스트가 비어있으면 QR 코드 지우고 버튼 숨기기
        qrcodeDiv.innerHTML = '';
        downloadQrBtn.style.display = 'none';
    }
};

// 입력 필드에 텍스트가 변경될 때마다 QR 코드 재생성
textInput.addEventListener("input", generateQrCode);

// 다운로드 버튼 클릭 이벤트 리스너
downloadQrBtn.addEventListener("click", () => {
    // qrcodeDiv 안에서 canvas 요소를 찾습니다.
    const canvas = qrcodeDiv.querySelector("canvas");

    if (canvas) {
        // canvas 내용을 이미지 데이터 URL로 변환합니다. (PNG 형식)
        const imageDataURL = canvas.toDataURL("image/png");

        // 임시 <a> 태그를 생성하여 다운로드를 트리거합니다.
        const a = document.createElement("a");
        a.href = imageDataURL;
        a.download = "qrcode.png"; // 다운로드될 파일명
        document.body.appendChild(a); // DOM에 추가
        a.click(); // 클릭 이벤트 강제 실행
        document.body.removeChild(a); // 임시 <a> 태그 제거
    } else {
        alert("QR 코드를 찾을 수 없습니다. 먼저 QR 코드를 생성해주세요.");
    }
});

// 페이지 로드 시 초기 QR 코드 생성
generateQrCode();