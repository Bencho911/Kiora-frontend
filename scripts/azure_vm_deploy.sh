#!/bin/bash
set -e

RG_NAME="rg-kiora-vm"
VM_NAME="vm-kiora-backend"
ADMIN_USER="kioraadmin"

echo "Buscando la IP de tu Máquina Virtual en Azure..."
PUBLIC_IP=$(az vm show -d -g "$RG_NAME" -n "$VM_NAME" --query publicIps -o tsv)

if [ -z "$PUBLIC_IP" ]; then
    echo "No se encontró la IP."
    exit 1
fi

echo "IP encontrada: $PUBLIC_IP"

echo "[1/3] Copiando el proyecto frontend a la Máquina Virtual..."
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' \
  -e "ssh -o StrictHostKeyChecking=no" \
  /home/bencho/Documentos/Kiora/kiora-frontend/ "$ADMIN_USER@$PUBLIC_IP:~/kiora-frontend/" > /dev/null

echo "Archivos copiados."

echo "[2/3] Levantando el frontend admin con Docker Compose..."
ssh -o StrictHostKeyChecking=no "$ADMIN_USER@$PUBLIC_IP" << INNER_EOF
  set -e
  cd ~/kiora-frontend
  
  echo "PUBLIC_API_URL=http://$PUBLIC_IP:3000/api" > .env
  
  sudo docker rm -f kiora_frontend_app || true
  sudo docker compose down
  sudo docker compose up -d --build
INNER_EOF

echo "====================================================="
echo "¡DESPLIEGUE DEL ADMIN COMPLETADO EN LA MÁQUINA VIRTUAL!"
echo "Tu Admin público: http://$PUBLIC_IP:8080"
