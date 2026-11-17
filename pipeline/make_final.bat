@echo off
rem  make_final.bat v003  - builds every shot at that version (if not built yet), renders every shot at its full
rem  cut length in Cycles (frames + an H.264 movie per shot), assembles the trailer with the transitions in
rem  pipeline\transitions_<version>.json, writes the EDL and refreshes the status.
rem  Safe to re-run: finished shots are skipped and a half-rendered shot carries on from its last frame.
setlocal
cd /d "%~dp0"
set V=%1
if "%V%"=="" set V=v003
set B="C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
set S=pipeline\scripts\trailer_shots.py
set M=pipeline\manifest.json
set L=pipeline\logs\make_final_%V%.log
if not exist "shots\MVIV\T-19\T-19_kup2h\blender\T-19_kup2h_blocking_%V%.blend" (
  %B% --background --factory-startup --python %S% -- --root . --manifest %M% --version %V% --shots all --stills --log build_%V%.json >> %L% 2>&1
)
%B% --background --factory-startup --python %S% -- --root . --manifest %M% --version %V% --shots all --final --missing --log final_%V%.json >> %L% 2>&1
%B% --background --factory-startup --python-expr "import runpy,sys;sys.argv=['x','--root','.','--version','%V%'];runpy.run_path('pipeline/scripts/assemble_trailer.py',run_name='__main__')" >> %L% 2>&1
%B% --background --factory-startup --python-expr "import runpy,sys;sys.argv=['x','--root','.'];runpy.run_path('pipeline/scripts/trailer_pipeline.py',run_name='__main__')" >> %L% 2>&1
echo FINISHED >> %L%
