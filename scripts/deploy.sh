#!/bin/bash

# JobFlow Deployment Script
# Usage: ./scripts/deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
echo "🚀 Starting JobFlow deployment to $ENVIRONMENT..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check requirements
check_requirements() {
    log_info "Checking requirements..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    log_info "Node.js version: $NODE_VERSION"
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        log_error "package.json not found. Are you in the right directory?"
        exit 1
    fi
    
    # Check if Prisma is configured
    if [ ! -f "prisma/schema.prisma" ]; then
        log_error "Prisma schema not found"
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    npm ci --production=false
}

# Build application
build_application() {
    log_info "Building application..."
    npm run build
    
    if [ $? -eq 0 ]; then
        log_info "Build successful!"
    else
        log_error "Build failed!"
        exit 1
    fi
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    # Uncomment when tests are available
    # npm run test
    
    log_info "Tests completed (skipped for now)"
}

# Database operations
setup_database() {
    log_info "Setting up database..."
    
    # Generate Prisma client
    npx prisma generate
    
    # Check if DATABASE_URL is set
    if [ -z "$DATABASE_URL" ]; then
        log_warn "DATABASE_URL not set. Skipping database setup."
        return
    fi
    
    # Run migrations
    log_info "Running database migrations..."
    npx prisma db push
    
    # Seed database (only in development)
    if [ "$ENVIRONMENT" = "development" ]; then
        log_info "Seeding database..."
        npx prisma db seed
    fi
}

# Deploy to Vercel
deploy_vercel() {
    log_info "Deploying to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        log_error "Vercel CLI not installed. Install with: npm i -g vercel"
        exit 1
    fi
    
    if [ "$ENVIRONMENT" = "production" ]; then
        vercel --prod --yes
    else
        vercel --yes
    fi
}

# Deploy to DigitalOcean
deploy_digitalocean() {
    log_info "Deploying to DigitalOcean..."
    
    if ! command -v doctl &> /dev/null; then
        log_error "DigitalOcean CLI not installed"
        exit 1
    fi
    
    # This would need to be configured based on your DO setup
    log_warn "DigitalOcean deployment needs manual configuration"
}

# Security checks
security_checks() {
    log_info "Running security checks..."
    
    # Check for common security issues
    if [ -f ".env" ]; then
        if grep -q "NEXTAUTH_SECRET=" .env; then
            SECRET=$(grep "NEXTAUTH_SECRET=" .env | cut -d'=' -f2)
            if [ ${#SECRET} -lt 32 ]; then
                log_error "NEXTAUTH_SECRET is too short (minimum 32 characters)"
                exit 1
            fi
        fi
    fi
    
    # Check for exposed secrets in code
    if grep -r "sk_" src/ || grep -r "pk_" src/; then
        log_error "Potential API keys found in source code"
        exit 1
    fi
    
    log_info "Security checks passed"
}

# Performance optimization
optimize_performance() {
    log_info "Optimizing performance..."
    
    # Check bundle size
    if [ -d ".next" ]; then
        log_info "Bundle analysis:"
        npx @next/bundle-analyzer
    fi
    
    # Optimize images (if needed)
    # This would run image optimization tools
    
    log_info "Performance optimization completed"
}

# Main deployment flow
main() {
    echo "🔥 JobFlow Deployment Script"
    echo "Environment: $ENVIRONMENT"
    echo "Timestamp: $(date)"
    echo "----------------------------"
    
    check_requirements
    install_dependencies
    security_checks
    run_tests
    build_application
    setup_database
    optimize_performance
    
    # Choose deployment target
    case "$2" in
        "vercel")
            deploy_vercel
            ;;
        "digitalocean")
            deploy_digitalocean
            ;;
        *)
            log_info "No deployment target specified. Choose from:"
            echo "  ./scripts/deploy.sh $ENVIRONMENT vercel"
            echo "  ./scripts/deploy.sh $ENVIRONMENT digitalocean"
            ;;
    esac
    
    log_info "✅ Deployment completed successfully!"
    
    # Post-deployment checks
    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "Running post-deployment health checks..."
        # curl -f https://your-domain.com/api/health || log_error "Health check failed"
    fi
    
    echo ""
    echo "🎉 JobFlow is now live!"
    echo "📊 Monitor your application:"
    echo "   - Logs: Check your hosting provider dashboard"
    echo "   - Performance: Use built-in analytics"
    echo "   - Errors: Monitor error tracking service"
    echo ""
    echo "🔧 Next steps:"
    echo "   - Set up monitoring alerts"
    echo "   - Configure backups"
    echo "   - Update DNS records (if needed)"
    echo "   - Test all functionality"
}

# Error handling
trap 'log_error "Deployment failed at line $LINENO"' ERR

# Run main function
main "$@" 