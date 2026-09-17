@echo off
chcp 65001 > nul
title 키친 셰프 (Kitchen Chef) 서버 실행기

echo ============================================================
echo   🍳 키친 셰프 (Kitchen Chef) 통합 서버를 실행합니다...
echo   접속 주소: http://localhost:8080
echo ============================================================

cd /d "%~dp0"

if exist "%USERPROFILE%\miniconda3\envs\myenv\python.exe" (
    "%USERPROFILE%\miniconda3\envs\myenv\python.exe" run.py
) else if exist "%USERPROFILE%\miniconda3\python.exe" (
    "%USERPROFILE%\miniconda3\python.exe" run.py
) else (
    python run.py
)

pause
