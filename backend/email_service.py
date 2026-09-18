# backend/email_service.py
"""
Kitchen Chef 이메일 실존 검증 및 SMTP 전송 서비스
- 도메인 실존 여부(MX/DNS) 사전 유효성 검사
- 네이버/지메일/다음/커스텀 SMTP를 통한 실제 이메일 발송
- 키친 셰프 브랜딩 고품질 HTML 인증 메일 템플릿
- 발송 계정 설정 영속화 (backend/data/smtp_config.json 및 환경변수)
"""

import os
import re
import json
import time
import socket
import smtplib
import subprocess
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BACKEND_DIR, 'data')
CONFIG_FILE = os.path.join(DATA_DIR, 'smtp_config.json')


class EmailService:
    def __init__(self):
        self.config = {
            "enabled": True,
            "host": os.environ.get("SMTP_HOST", "smtp.gmail.com"),
            "port": int(os.environ.get("SMTP_PORT", 587)),
            "use_tls": os.environ.get("SMTP_USE_TLS", "true").lower() == "true",
            "use_ssl": os.environ.get("SMTP_USE_SSL", "false").lower() == "true",
            "user": os.environ.get("SMTP_USER", ""),
            "password": os.environ.get("SMTP_PASSWORD", ""),
            "sender_name": os.environ.get("SMTP_SENDER_NAME", "Kitchen Chef 키친 셰프"),
            "sender_email": os.environ.get("SMTP_SENDER_EMAIL", "")
        }
        self.load_config()

    def load_config(self):
        try:
            if os.path.exists(CONFIG_FILE):
                with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                    saved = json.load(f)
                    if isinstance(saved, dict):
                        self.config.update(saved)
        except Exception as e:
            print(f"⚠️ [EmailService] Failed to load {CONFIG_FILE}: {e}")

    def save_config(self, new_config: dict):
        try:
            os.makedirs(DATA_DIR, exist_ok=True)
            self.config.update(new_config)
            with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, ensure_ascii=False, indent=2)
            return True, "SMTP 설정이 저장되었습니다."
        except Exception as e:
            return False, f"SMTP 설정 저장 실패: {e}"

    def get_public_config(self):
        """민감한 비밀번호를 마스킹하여 반환"""
        pwd = self.config.get("password", "")
        masked_pwd = ("*" * len(pwd)) if pwd else ""
        return {
            "enabled": self.config.get("enabled", True),
            "host": self.config.get("host", ""),
            "port": self.config.get("port", 587),
            "use_tls": self.config.get("use_tls", True),
            "use_ssl": self.config.get("use_ssl", False),
            "user": self.config.get("user", ""),
            "has_password": bool(pwd),
            "masked_password": masked_pwd,
            "sender_name": self.config.get("sender_name", "Kitchen Chef 키친 셰프"),
            "sender_email": self.config.get("sender_email", "")
        }

    # 1. 도메인 실존 여부 및 메일 수신 가능성 검증 (MX / DNS 검사)
    @staticmethod
    def validate_email_domain(email: str):
        if not email or '@' not in email:
            return False, "올바른 이메일 형식을 입력해주세요."

        clean_email = email.strip().lower()
        parts = clean_email.split('@')
        if len(parts) != 2 or not parts[0] or not parts[1]:
            return False, "이메일 계정명과 도메인 형식을 확인해주세요."

        domain = parts[1].strip()

        # 도메인 정규식 기본 유효성
        if not re.match(r'^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', domain):
            return False, f"도메인 형식([{domain}])이 유효하지 않습니다."

        # 흔한 오타 교정 안내
        typo_map = {
            'gmai.com': 'gmail.com',
            'gamil.com': 'gmail.com',
            'gmial.com': 'gmail.com',
            'nave.com': 'naver.com',
            'nver.com': 'naver.com',
            'naer.com': 'naver.com',
            'daum.co': 'daum.net',
            'hanmai.net': 'hanmail.net'
        }
        if domain in typo_map:
            return False, f"도메인 오타로 의심됩니다. 혹시 '{typo_map[domain]}'을(를) 입력하려 하셨나요?"

        # DNS 호스트 및 MX 레코드 실존 검사
        try:
            # 1) 도메인 호스트 IP 해석 확인
            socket.gethostbyname(domain)
        except Exception:
            return False, f"존재하지 않는 이메일 도메인([{domain}])입니다. 실존하는 이메일 주소를 입력해주세요."

        # 2) nslookup으로 MX 레코드 유무 확인 (메일 서버 실존 확인)
        try:
            cmd = ['nslookup', '-type=mx', domain]
            proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=3)
            out = proc.stdout.lower()
            if 'mail exchanger' not in out and 'mx preference' not in out:
                # MX 레코드가 없는 경우 도메인이 메일 수신을 지원하지 않을 수 있음
                if domain not in ('gmail.com', 'naver.com', 'daum.net', 'kakao.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com'):
                    return False, f"해당 도메인([{domain}])은 메일 수신 서버(MX)가 등록되어 있지 않습니다."
        except Exception as e:
            # 타임아웃 또는 네트워크 환경에 따른 nslookup 실패 시 호스트 확인만 통과했으면 허용
            pass

        return True, ""

    # 2. HTML 메일 템플릿 생성
    def render_verification_template(self, email: str, code: str, expires_minutes: int = 5):
        return f"""<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>Kitchen Chef 회원가입 인증번호</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 30px; text-align: center;">
              <div style="font-size: 32px; line-height: 1; margin-bottom: 8px;">👨‍🍳</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Kitchen Chef</h1>
              <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">나만의 스마트 AI 냉장고 레시피 파트너</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 18px; font-weight: 700; line-height: 1.4;">
                회원가입 이메일 실존 인증번호
              </h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                안녕하세요, 셰프님!<br>
                키친 셰프에 가입해 주셔서 감사드립니다. 아래의 <strong>6자리 인증번호</strong>를 회원가입 창에 입력하여 이메일 인증을 완료해 주세요.
              </p>
              <!-- Code Box -->
              <div style="background-color: #f1f5f9; border: 2px dashed #059669; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
                <span style="font-size: 12px; color: #64748b; display: block; margin-bottom: 8px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">인증번호 (6자리)</span>
                <span style="font-size: 36px; font-weight: 800; color: #059669; letter-spacing: 8px; font-family: monospace;">{code}</span>
              </div>
              <p style="color: #dc2626; font-size: 13px; font-weight: 600; margin: 0 0 8px 0; line-height: 1.5;">
                ⏰ 인증번호는 발송 후 {expires_minutes}분 동안만 유효합니다.
              </p>
              <p style="color: #64748b; font-size: 12px; margin: 0; line-height: 1.5;">
                본인이 요청하지 않은 경우 이 메일을 무시하셔도 되며, 계정 정보는 안전하게 보호됩니다.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0; line-height: 1.4;">
                © 2026 Kitchen Chef. All rights reserved.<br>
                본 메일은 발신 전용 메일입니다.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    # 3. 실제 SMTP 이메일 발송
    def send_auth_code_email(self, to_email: str, code: str, expires_minutes: int = 5):
        # 1) 도메인 유효성 사전 검사
        valid, err_msg = self.validate_email_domain(to_email)
        if not valid:
            return False, "INVALID_DOMAIN", err_msg

        # 2) SMTP 설정 확인
        host = self.config.get("host")
        port = int(self.config.get("port", 587))
        user = self.config.get("user")
        password = self.config.get("password")
        sender_name = self.config.get("sender_name", "Kitchen Chef 키친 셰프")
        sender_email = self.config.get("sender_email") or user or "admin@kitchenchef.com"
        use_ssl = bool(self.config.get("use_ssl", False))
        use_tls = bool(self.config.get("use_tls", True))

        # 메일 메시지 객체 구성
        msg = MIMEMultipart('alternative')
        msg['Subject'] = Header(f"[Kitchen Chef] 회원가입 이메일 인증번호 [{code}]", 'utf-8')
        msg['From'] = f"{Header(sender_name, 'utf-8').encode()} <{sender_email}>"
        msg['To'] = to_email

        plain_text = f"Kitchen Chef 회원가입 인증번호는 [{code}] 입니다. ({expires_minutes}분간 유효)"
        html_content = self.render_verification_template(to_email, code, expires_minutes)

        msg.attach(MIMEText(plain_text, 'plain', 'utf-8'))
        msg.attach(MIMEText(html_content, 'html', 'utf-8'))

        # SMTP 계정이 설정되어 있지 않은 경우의 명확한 피드백
        if not user or not password:
            print(f"⚠️ [EmailService] SMTP user/password not configured. Please configure via Admin Console or in backend/data/smtp_config.json")
            return False, "SMTP_NOT_CONFIGURED", "서버의 이메일 발송 계정(SMTP)이 아직 설정되지 않았습니다. 관리자 콘솔의 [이메일 발송(SMTP) 설정]에서 발송 계정을 등록해주세요."

        try:
            print(f"📡 [EmailService] Connecting to SMTP {host}:{port} (SSL: {use_ssl}, TLS: {use_tls})...")
            if use_ssl or port == 465:
                server = smtplib.SMTP_SSL(host, port, timeout=10)
            else:
                server = smtplib.SMTP(host, port, timeout=10)
                if use_tls:
                    server.starttls()

            server.login(user, password)
            server.sendmail(sender_email, [to_email], msg.as_string())
            server.quit()

            print(f"✅ [EmailService] Verification email successfully sent to {to_email}")
            return True, "SUCCESS", f"{to_email}로 실제 인증 메일이 성공적으로 발송되었습니다. 받은편지함(스팸함 포함)을 확인해주세요."

        except smtplib.SMTPAuthenticationError as auth_err:
            print(f"❌ [EmailService] SMTP Auth Error: {auth_err}")
            return False, "SMTP_AUTH_ERROR", "이메일 발송 서버 로그인에 실패했습니다. 관리자 콘솔에서 아이디 또는 앱 비밀번호를 확인해주세요."
        except smtplib.SMTPConnectError as conn_err:
            print(f"❌ [EmailService] SMTP Connection Error: {conn_err}")
            return False, "SMTP_CONNECT_ERROR", f"메일 서버({host}:{port})에 연결할 수 없습니다."
        except Exception as e:
            print(f"❌ [EmailService] Error sending email: {e}")
            return False, "SMTP_SEND_ERROR", f"이메일 발송 중 오류가 발생했습니다: {str(e)}"


# 싱글톤 인스턴스 생성
email_service = EmailService()
