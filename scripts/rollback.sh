#!/bin/bash

# Rollback Script for Sites Monitor
# Usage: ./scripts/rollback.sh [version|backup_file]

set -e

ROLLBACK_TARGET=${1:-latest}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/rollback_${TIMESTAMP}.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging
log() {
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
  exit 1
}

warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Confirm rollback
read -p "Are you sure you want to rollback to $ROLLBACK_TARGET? (yes/no) " -n 3 -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  error "Rollback cancelled"
fi

log "Starting rollback to $ROLLBACK_TARGET..."

# 1. Stop current application
log "Stopping current application..."
docker-compose -f docker-compose.production.yml down || warning "Could not stop containers"

# 2. Restore database (if backup file provided)
if [[ -f "$ROLLBACK_TARGET" ]]; then
  log "Restoring database from backup: $ROLLBACK_TARGET"
  
  # Check if backup is compressed
  if [[ "$ROLLBACK_TARGET" == *.gz ]]; then
    BACKUP_FILE=$(mktemp)
    gunzip -c "$ROLLBACK_TARGET" > "$BACKUP_FILE"
  else
    BACKUP_FILE="$ROLLBACK_TARGET"
  fi
  
  # Restore
  psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME < "$BACKUP_FILE" || error "Database restore failed"
  
  log "Database restored successfully"
else
  # Checkout previous version
  log "Checking out version: $ROLLBACK_TARGET"
  git fetch origin
  git checkout "$ROLLBACK_TARGET" || error "Could not checkout version"
fi

# 3. Start application with previous version
log "Starting application with previous version..."
docker-compose -f docker-compose.production.yml up -d

# 4. Wait for application to be ready
log "Waiting for application to be ready..."
sleep 30

# 5. Verify health
log "Verifying application health..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://sites.administradoramutual.com.br/api/health")

if [[ "$HEALTH_RESPONSE" != "200" ]]; then
  error "Health check failed after rollback. HTTP $HEALTH_RESPONSE"
fi

log "Health check passed"

# 6. Verify database
log "Verifying database..."
docker-compose -f docker-compose.production.yml exec -T app psql -h postgres -U $DATABASE_USER -d $DATABASE_NAME -c "SELECT COUNT(*) FROM sites;" || error "Database verification failed"

log "Database verification passed"

# 7. Check logs for errors
log "Checking application logs..."
docker-compose -f docker-compose.production.yml logs app | tail -20 | tee -a "$LOG_FILE"

# 8. Notify
log "Sending rollback notification..."
# curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK \
#   -d "{\"text\":\"Rollback completed at $TIMESTAMP. Version: $ROLLBACK_TARGET\"}"

log "✅ Rollback completed successfully!"
log "Version: $ROLLBACK_TARGET"
log "Timestamp: $TIMESTAMP"
log "Log file: $LOG_FILE"
