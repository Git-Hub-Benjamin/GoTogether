#!/bin/bash
# =============================================
# run-all.sh
# Launches multiple development processes for Go-Together (Linux)
# Usage:
#   ./run-all.sh [service_number]
#   ./run-all.sh --no_mongo
#   ./run-all.sh --clr_ports
# =============================================

# ── Configuration ─────────────────────────────────────────────
BASE_DIR="~/Desktop/GoTogether"

# Each service command and name
SERVICES=(
  "mongod --dbpath $HOME/db_data/db | MongoDB"
  "cd \"$BASE_DIR/server\" && npm run dev | Server"
  "cd \"$BASE_DIR/client\" && npm start | Client"
  "cd \"$BASE_DIR/mobile_client\" && npx expo start --clear --tunnel | MobileClient"
  "cd \"$BASE_DIR/server/src/scripts\" && node ./debugMenu.js | DebugMenu"
  "cd \"$BASE_DIR/mobile_client/scripts\" && node ./updateNgrokUrl.js && exit | NgrokUpdater"
)

# Ports that can be cleared if requested
PORTS=(3000 5000 8000)

# Flags
NO_MONGO=false
CLR_PORTS=false

# ── Parse Arguments ───────────────────────────────────────────
SERVICE_NUMBER=0

for arg in "$@"; do
  case "$arg" in
    --no_mongo) NO_MONGO=true ;;
    --clr_ports) CLR_PORTS=true ;;
    [0-9]*) SERVICE_NUMBER=$arg ;;
  esac
done

# ── Helper: Clear Ports ───────────────────────────────────────
clear_ports() {
  echo -e "\e[33mClearing ports: ${PORTS[*]}...\e[0m"
  for port in "${PORTS[@]}"; do
    pid=$(lsof -ti:"$port")
    if [ -n "$pid" ]; then
      kill -9 "$pid" 2>/dev/null
      echo -e "\e[32mKilled process on port $port (PID: $pid)\e[0m"
    else
      echo -e "\e[90mNo process found on port $port\e[0m"
    fi
  done
  echo -e "\e[32mPorts cleared successfully!\e[0m"
}

# ── Helper: Launch New Terminal ───────────────────────────────
start_new_terminal() {
  local cmd="$1"
  local title="$2"

  if command -v gnome-terminal &>/dev/null; then
    gnome-terminal -- bash -c "echo -e '\e[36m[$title]\e[0m'; $cmd; exec bash" &
  elif command -v konsole &>/dev/null; then
    konsole --hold -e bash -c "echo -e '\e[36m[$title]\e[0m'; $cmd" &
  elif command -v xterm &>/dev/null; then
    xterm -hold -e bash -c "echo -e '\e[36m[$title]\e[0m'; $cmd" &
  else
    echo "No supported terminal emulator found! (gnome-terminal, konsole, or xterm)"
  fi
}

# ── Main Logic ────────────────────────────────────────────────
if [ "$CLR_PORTS" = true ]; then
  clear_ports
  exit 0
fi

# Remove MongoDB if --no_mongo flag is set
SERVICE_START_LIST=("${SERVICES[@]}")
if [ "$NO_MONGO" = true ]; then
  unset 'SERVICE_START_LIST[0]'
  echo -e "\e[33mSkipping MongoDB service (--no_mongo flag set)\e[0m"
fi

if [[ "$SERVICE_NUMBER" -eq 0 ]]; then
  echo -e "\e[32mStarting all services...\e[0m"
  for service in "${SERVICE_START_LIST[@]}"; do
    IFS="|" read -r cmd title <<<"$service"
    start_new_terminal "$cmd" "$title"
  done
else
  index=$((SERVICE_NUMBER - 1))
  if (( index >= 0 && index < ${#SERVICES[@]} )); then
    IFS="|" read -r cmd title <<<"${SERVICES[$index]}"
    echo -e "\e[32mStarting service #$SERVICE_NUMBER: $title...\e[0m"
    start_new_terminal "$cmd" "$title"
  else
    echo -e "\e[31mError: Invalid service number $SERVICE_NUMBER. Valid range: 1–${#SERVICES[@]}.\e[0m"
  fi
fi
