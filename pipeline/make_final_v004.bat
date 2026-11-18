@echo off
rem  make_final_v004.bat - renders the v004 recut like make_final.bat does for v003:
rem    1. rebuilds + re-renders the two v003 shots whose camera spun (T-09_tqkp6, T-10_t11hn)
rem    2. renders every new v004 shot (N-01..N-27) at full cut length in Cycles: PNG frames + an H.264 movie per shot
rem    3. rebuilds edit\trailer_v004.mp4 (+ _timing.md) with the new shots in place of the slates
rem  Safe to re-run: finished shots are skipped.
setlocal
echo Rendering v004. Full output goes to pipeline\logs\make_final_v004.log  (run watch_render_v004.bat to watch it live)
cd /d "%~dp0"
set B="C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
set S=pipeline\scripts\trailer_shots.py
set L=pipeline\logs\make_final_v004.log
set NEW=N-01_gate,N-01_feet,N-02_army,N-02_kalayavana,N-07_thunder,N-07_bali,N-07_clash,N-08_rahu,N-13_pursuer,N-15_jarasandha,N-16_descent,N-16_glare,N-17_plough,N-17_arrows,N-18_firearrows,N-18_elephants,N-18_flood,N-19_mouth,N-19_eyes,N-19_ash,N-23_oath,N-23_snap,N-23_shield,N-24_lines,N-24_wheel,N-27_turn
echo ==== %date% %time% start
echo ==== %date% %time% start >> %L%

echo ---- 1a rebuild spinning v003 shots
echo ---- 1a rebuild spinning v003 shots >> %L%
if not exist "shots\MVIII\T-10\T-10_t11hn\renders\final\T-10_t11hn_final_v003.mp4" (
  %B% --background --factory-startup --python %S% -- --root . --manifest pipeline\manifest.json --version v003 --shots T-09_tqkp6 --force --log fix_spin_a.json >> %L% 2>&1
  %B% --background --factory-startup --python %S% -- --root . --manifest pipeline\manifest.json --version v003 --shots T-10_t11hn --force --log fix_spin_b.json >> %L% 2>&1
)
echo ---- 1b re-render them
echo ---- 1b re-render them >> %L%
%B% --background --factory-startup --python %S% -- --root . --manifest pipeline\manifest.json --version v003 --shots T-09_tqkp6,T-10_t11hn --final --missing --log fix_spin_final_v003.json >> %L% 2>&1

echo ---- 2 render new v004 shots
echo ---- 2 render new v004 shots >> %L%
%B% --background --factory-startup --python %S% -- --root . --manifest pipeline\manifest_v004.json --version v004 --shots %NEW% --final --missing --log final_v004.json >> %L% 2>&1

echo ---- 3 animatic
echo ---- 3 animatic >> %L%
%B% --background --factory-startup --python-expr "import runpy,sys;sys.argv=['x','--root','.','--plan','pipeline/paper_v004.json'];runpy.run_path('pipeline/scripts/paper_cut.py',run_name='__main__')" >> %L% 2>&1
echo ==== %date% %time% FINISHED
echo ==== %date% %time% FINISHED >> %L%
