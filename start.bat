@echo off
title KnitHub Local Start
setlocal

rem ---- Locate local toolchain (JDK 21 + Maven 3.9.16) ----
set "JAVA_HOME=%USERPROFILE%\dev\tools\jdk-21.0.12.1+1"
set "MAVEN_HOME=%USERPROFILE%\dev\tools\apache-maven-3.9.16"

if not exist "%JAVA_HOME%\bin\java.exe" (
    echo [ERROR] JDK 21 not found at "%JAVA_HOME%"
    echo         Please install it or fix JAVA_HOME in this script.
    pause
    exit /b 1
)
if not exist "%MAVEN_HOME%\bin\mvn.cmd" (
    echo [ERROR] Maven not found at "%MAVEN_HOME%"
    echo         Please install it or fix MAVEN_HOME in this script.
    pause
    exit /b 1
)
set "PATH=%JAVA_HOME%\bin;%MAVEN_HOME%\bin;%PATH%"

echo Starting KnitHub backend  (http://localhost:8080) ...
start "KnitHub-Backend"  cmd /k "cd /d D:\CodeBuddy\Gitclone\knithub-workshop\server && mvn spring-boot:run"

echo Starting KnitHub frontend (http://localhost:5173) ...
start "KnitHub-Frontend" cmd /k "cd /d D:\CodeBuddy\Gitclone\knithub-workshop\web-ui && pnpm dev"

echo.
echo Both services are starting in their own windows.
echo Wait about 20 seconds, then open http://localhost:5173 in your browser.
echo To stop: close the two windows, or press Ctrl+C in each of them.
endlocal
