@echo off
echo Killing processes on ports 3000-3010 and 3100...
echo.

REM Kill processes on ports 3000-3010
for /L %%i in (3000,1,3010) do (
    echo Checking port %%i...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%%i') do (
        if not "%%a"=="" (
            echo Killing process %%a on port %%i
            taskkill /F /PID %%a >nul 2>&1
        )
    )
)

REM Kill processes on port 3100
echo Checking port 3100...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3100') do (
    if not "%%a"=="" (
        echo Killing process %%a on port 3100
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo.
echo Done! All specified ports have been cleared.
echo Note: Database (5432) and Redis (6379) ports were left untouched.
pause
