#!/bin/bash

# Deploy Script for Sites Monitor
# Usage: ./scripts/deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
LOG_FILE="/var/log/deploy_${TIMESTAMP}.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
  error "Invalid environment. Use 'staging' or 'production'"
fi

log "Starting deployment to $ENVIRONMENT..."

# 1. Pre-deployment checks
log "Running pre-deployment checks..."

# Check if all tests pass
log "Running tests..."
pnpm test:coverage || error "Tests failed"

# Check linting
log "Running linter..."
pnpm lint || error "Linting failed"

# Check type checking
log "Running type checking..."
pnpm type-check || error "Type checking failed"

# 2. Build
log "Building application..."
pnpm build || error "Build failed"
pnpm build:server || error "Server build failed"

# 3. Backup (production only)
if [[ "$ENVIRONMENT" == "production" ]]; then
  log "Creating database backup..."
  mkdir -p "$BACKUP_DIR"
  
  BACKUP_FILE="$BACKUP_DIR/sites_monitor_${TIMESTAMP}.sql"
  pg_dump -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME > "$BACKUP_FILE" || error "Backup failed"
  
  log "Backup created: $BACKUP_FILE"
  
  # Compress backup
  gzip "$BACKUP_FILE"
  log "Backup compressed"
fi

# 4. Deploy
log "Deploying to $ENVIRONMENT..."

if [[ "$ENVIRONMENT" == "staging" ]]; then
  docker-compose -f docker-compose.staging.yml down || true
  docker-compose -f docker-compose.staging.yml up -d
  DEPLOY_URL="https://staging-sites.administradoramutual.com.br"
else
  # Blue-Green deployment for production
  log "Using Blue-Green deployment strategy..."
  
  # Deploy to GREEN
  docker-compose -f docker-compose.production.yml up -d --scale app=3
  DEPLOY_URL="https://sites.administradoramutual.com.br"
  
  # Wait for application to be ready
  log "Waiting for application to be ready..."
  sleep 30
fi

# 5. Run migrations
log "Running database migrations..."
docker-compose -f docker-compose.${ENVIRONMENT}.yml exec -T app pnpm db:push || error "Migrations failed"

# 6. Smoke tests
log "Running smoke tests..."
sleep 10

# Test health endpoint
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL/api/health")
if [[ "$HEALTH_RESPONSE" != "200" ]]; then
  error "Health check failed. HTTP $HEALTH_RESPONSE"
fi
log "Health check passed"

# Test API endpoint
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL/api/trpc/sites.list")
if [[ "$API_RESPONSE" != "200" ]]; then
  error "API check failed. HTTP $API_RESPONSE"
fi
log "API check passed"

# 7. Verify logs
log "Checking application logs..."
docker-compose -f docker-compose.${ENVIRONMENT}.yml logs app | tail -20 | tee -a "$LOG_FILE"

# 8. Post-deployment
log "Deployment completed successfully!"
log "Environment: $ENVIRONMENT"
log "URL: $DEPLOY_URL"
log "Timestamp: $TIMESTAMP"
log "Log file: $LOG_FILE"

# 9. Notify
if [[ "$ENVIRONMENT" == "production" ]]; then
  log "Sending notification..."
  # Send email or Slack notification
  # curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK \
  #   -d "{\"text\":\"Deployment to production completed successfully at $TIMESTAMP\"}"
fi

log "✅ Deployment complete!"
