@echo off
rem  render_v004.bat - final renders for the v004 recut, everything printed right here in this window.
rem    1. checks every shot (frames done, broken frames, movie)
rem    2. finishes the two v003 shots whose camera spun (T-09_tqkp6, T-10_t11hn)
rem    3. renders the 26 new v004 shots one by one: PNG frames + an H.264 movie per shot
rem    4. builds edit\trailer_v004.mp4 (the animatic with the new shots in place of the slates)
rem  Safe to stop (Ctrl+C) and run again: finished shots are skipped, a half-rendered shot carries on, and frames
rem  broken by stopping mid-frame are found and rendered again.
setlocal enabledelayedexpansion
cd /d "%~dp0"
set B="C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
set PY="C:\Program Files\Blender Foundation\Blender 5.2\5.2\python\bin\python.exe"
set S=pipeline\scripts\trailer_shots.py
set SHOTS=N-01_gate N-01_feet N-02_army N-02_kalayavana N-07_thunder N-07_bali N-07_clash N-08_rahu N-13_pursuer N-15_jarasandha N-16_descent N-16_glare N-17_plough N-17_arrows N-18_firearrows N-18_elephants N-18_flood N-19_mouth N-19_eyes N-19_ash N-23_oath N-23_snap N-23_shield N-24_lines N-24_wheel N-27_turn
set TOTAL=0
for %%s in (%SHOTS%) do set /a TOTAL+=1

title v004 render - checking
echo.
echo ================================================================
echo  THE UNSEEN SUN  -  v004 final render     started %date% %time%
echo ================================================================
echo.
echo  Where the renders stand:
%PY% pipeline\scripts\render_status.py --root . --manifest pipeline\manifest_v004.json --version v004 --new
echo.

title v004 render - v003 spin fixes
echo ================================================================
echo  [step 1/3]  v003 shots T-09_tqkp6, T-10_t11hn
echo ================================================================
%B% -b --factory-startup --python %S% -- --root . --manifest pipeline\manifest.json --version v003 --shots T-09_tqkp6,T-10_t11hn --final --missing --log fix_spin_final_v003.json

set N=0
for %%s in (%SHOTS%) do (
  set /a N+=1
  title v004 render - shot !N! of %TOTAL%  %%s
  echo.
  echo ================================================================
  echo  [step 2/3]  shot !N! of %TOTAL%   %%s          %time%
  echo ================================================================
  %B% -b --factory-startup --python %S% -- --root . --manifest pipeline\manifest_v004.json --version v004 --shots %%s --final --missing --log final_v004.json
)

title v004 render - animatic
echo.
echo ================================================================
echo  [step 3/3]  animatic  edit\trailer_v004.mp4
echo ================================================================
%PY% pipeline\scripts\paper_cut.py --root . --plan pipeline\paper_v004.json

echo.
echo  Where the renders stand now:
%PY% pipeline\scripts\render_status.py --root . --manifest pipeline\manifest_v004.json --version v004 --new
echo.
echo ================================================================
echo  FINISHED  %date% %time%
echo ================================================================
title v004 render - FINISHED
pause
