@echo off
rem  make_version.bat v002   - builds every shot at that version, then playblasts, all-pass EXRs and the status.
rem  Files a person wrote by hand (no .generated marker beside them) are never overwritten.
setlocal
cd /d "%~dp0"
set V=%1
if "%V%"=="" set V=v002
set B="C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
set S=pipeline\scripts\trailer_shots.py
set M=pipeline\manifest.json
%B% --background --factory-startup --python %S% -- --root . --manifest %M% --version %V% --shots all --stills --log build_%V%.json
%B% --background --factory-startup --python %S% -- --root . --manifest %M% --version %V% --shots all --playblast --missing --log playblast_%V%.json
%B% --background --factory-startup --python %S% -- --root . --manifest %M% --version %V% --shots all --exr --missing --log exr_%V%.json
%B% --background --factory-startup --python-expr "import runpy,sys;sys.argv=['x','--root','.'];runpy.run_path('pipeline/scripts/trailer_pipeline.py',run_name='__main__')"
