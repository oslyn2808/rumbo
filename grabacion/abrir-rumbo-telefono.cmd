@echo off
rem Abre Rumbo en una ventana de Edge sin barras, con tamano de telefono, para grabar con OBS.
rem Usa un perfil de Edge aparte para que la ventana siempre respete el tamano
rem (la primera vez tendras que iniciar sesion en Rumbo dentro de esta ventana).
rem Antes: el backend y la web deben estar corriendo.
rem Si esta la version de produccion (npm run grabar, puerto 4173) usa esa: es la mas fluida.
rem Si no, usa la de desarrollo (npm run dev, puerto 5173).

set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

set "URL=http://localhost:5173/explorar"
curl -s -o nul http://localhost:4173 && set "URL=http://localhost:4173/explorar"

start "" "%EDGE%" --app=%URL% --window-size=388,846 --window-position=1120,0 --user-data-dir="%LOCALAPPDATA%\RumboGrabacion" --no-first-run --no-default-browser-check
