#!/bin/bash

# Definir colores para la salida
GREEN='\033[0;32m'
NC='\033[0m'

# Cambiar al directorio del proyecto
cd "$(dirname "$0")"

# Función para matar procesos en puertos específicos
kill_port() {
    lsof -ti:$1 | xargs kill -9 2>/dev/null
}

# Mensaje de inicio
echo -e "${GREEN}Iniciando BuildTrack...${NC}"

# Matar procesos existentes en los puertos 3000 y 3001
echo "Limpiando puertos..."
kill_port 3000
kill_port 3001

# Crear directorio para logs si no existe
mkdir -p logs

# Iniciar el backend
echo -e "${GREEN}Iniciando Backend...${NC}"
cd backend
npm install &> /dev/null
PORT=3000 npm start > ../logs/backend.log 2>&1 &

# Esperar un momento para asegurarse de que el backend está corriendo
sleep 3

# Iniciar el frontend
echo -e "${GREEN}Iniciando Frontend...${NC}"
cd ../frontend
npm install &> /dev/null
PORT=3001 npm start > ../logs/frontend.log 2>&1 &

echo -e "${GREEN}BuildTrack está iniciando...${NC}"
echo "El backend estará disponible en http://localhost:3000"
echo "El frontend estará disponible en http://localhost:3001"
echo "Los logs están disponibles en:"
echo "  - Backend: $(pwd)/../logs/backend.log"
echo "  - Frontend: $(pwd)/../logs/frontend.log"
echo -e "${GREEN}Para detener los servidores, ejecuta: kill_port 3000 && kill_port 3001${NC}"

# Abrir el frontend en el navegador después de un breve retraso
sleep 5
open http://localhost:3001 