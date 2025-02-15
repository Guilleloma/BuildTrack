#!/bin/bash

# Definir colores para la salida
GREEN='\033[0;32m'
NC='\033[0m'

# Cambiar al directorio del script
cd "$(dirname "$0")"

# Crear el icono en Base64 (un icono de construcción/edificio estilizado)
cat > icon.svg << 'EOF'
<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" fill="#2196F3"/>
    <path d="M312 312v400h400V312H312zm350 350H362V362h300v300z" fill="white"/>
    <path d="M437 437h150v150H437V437z" fill="white"/>
    <path d="M512 212L312 412h400L512 212z" fill="white"/>
    <path d="M462 587h100v125H462V587z" fill="white"/>
</svg>
EOF

# Crear directorio temporal para el icono
mkdir -p BuildTrack.iconset
SIZES="16,32,64,128,256,512"

# Convertir SVG a diferentes tamaños PNG
for size in ${SIZES//,/ }; do
    double=$((size * 2))
    # Normal
    rsvg-convert -w $size -h $size icon.svg > BuildTrack.iconset/icon_${size}x${size}.png
    # Retina (@2x)
    rsvg-convert -w $double -h $double icon.svg > BuildTrack.iconset/icon_${size}x${size}@2x.png
done

# Crear el archivo .icns
iconutil -c icns BuildTrack.iconset

# Crear la estructura de la aplicación
APP_NAME="BuildTrack.app"
mkdir -p "${APP_NAME}/Contents/"{MacOS,Resources}

# Copiar el icono
mv BuildTrack.icns "${APP_NAME}/Contents/Resources/"

# Crear el Info.plist
cat > "${APP_NAME}/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>start-buildtrack</string>
    <key>CFBundleIconFile</key>
    <string>BuildTrack</string>
    <key>CFBundleIdentifier</key>
    <string>com.buildtrack.app</string>
    <key>CFBundleName</key>
    <string>BuildTrack</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.10</string>
    <key>CFBundleVersion</key>
    <string>1</string>
</dict>
</plist>
EOF

# Crear el script de inicio en la aplicación
cat > "${APP_NAME}/Contents/MacOS/start-buildtrack" << 'EOF'
#!/bin/bash

# Obtener el directorio actual del script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Función para matar procesos en puertos específicos
kill_port() {
    lsof -ti:$1 | xargs kill -9 2>/dev/null
}

# Matar procesos existentes
kill_port 3000
kill_port 3001

# Crear directorio para logs
mkdir -p "$APP_DIR/logs"

# Copiar el contenido del proyecto si no existe
if [ ! -d "$APP_DIR/backend" ] || [ ! -d "$APP_DIR/frontend" ]; then
    # Copiar el contenido del proyecto actual
    cp -R backend frontend "$APP_DIR/"
fi

# Cambiar al directorio de la aplicación
cd "$APP_DIR"

# Iniciar el backend
cd backend
# Asegurarse de que las dependencias están instaladas
if [ ! -d "node_modules" ]; then
    npm install
fi
PORT=3000 npm start > ../logs/backend.log 2>&1 &

# Esperar un momento
sleep 3

# Iniciar el frontend
cd ../frontend
# Asegurarse de que las dependencias están instaladas
if [ ! -d "node_modules" ]; then
    npm install
fi
PORT=3001 npm start > ../logs/frontend.log 2>&1 &

# Esperar y abrir el navegador
sleep 5
open http://localhost:3001

# Mantener el script ejecutándose para que la aplicación permanezca en el Dock
tail -f ../logs/backend.log ../logs/frontend.log
EOF

# Hacer ejecutable el script
chmod +x "${APP_NAME}/Contents/MacOS/start-buildtrack"

# Copiar los directorios del proyecto a la aplicación
mkdir -p "${APP_NAME}/Contents/Resources"
cp -R backend frontend "${APP_NAME}/Contents/Resources/"

# Limpiar archivos temporales
rm -rf BuildTrack.iconset icon.svg

echo -e "${GREEN}Aplicación BuildTrack creada con éxito${NC}"
echo "Puedes encontrar la aplicación en: $(pwd)/${APP_NAME}"
echo "Ahora puedes mover la aplicación a tu carpeta de Aplicaciones si lo deseas." 