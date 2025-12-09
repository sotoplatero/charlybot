# Docker Deployment Guide

This guide explains how to deploy the Charlybot application using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+ installed
- Docker Compose v2+ installed
- Access to OpenAI API key
- Access to Modbus robot network

## Quick Start

### 1. Clone and Configure

```bash
# Navigate to project directory
cd charlybot

# Copy environment example
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 2. Configure Environment Variables

Edit `.env` file with your settings:

```env
# Required: Your OpenAI API Key
OPENAI_API_KEY=sk-your-actual-api-key-here

# Modbus Robot Configuration
MODBUS_HOST=192.168.1.100  # IP of your robot
MODBUS_PORT=502
MODBUS_UNIT_ID=1
MODBUS_TIMEOUT=2000
```

### 3. Build and Run

```bash
# Build and start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

The application will be available at `http://localhost:3000`

## Docker Commands

### Basic Operations

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f charlybot

# View real-time logs
docker-compose logs -f --tail=100 charlybot
```

### Development

```bash
# Rebuild after code changes
docker-compose up -d --build

# Force rebuild without cache
docker-compose build --no-cache
docker-compose up -d
```

### Troubleshooting

```bash
# Check container status
docker-compose ps

# Inspect container
docker-compose exec charlybot sh

# View detailed logs
docker-compose logs --tail=200 charlybot

# Check health status
docker inspect charlybot-app | grep -A 10 Health
```

## Network Configuration

### Option 1: Bridge Network (Default)

The default configuration uses Docker bridge networking. Make sure to set `MODBUS_HOST` to the robot's IP address accessible from the Docker container.

```yaml
# docker-compose.yml
network_mode: bridge
```

### Option 2: Host Network

For direct access to the robot on the same network, you can use host networking:

```yaml
# docker-compose.yml
network_mode: host
```

**Note**: When using host network mode, the container uses the host's network stack directly.

## Production Deployment

### Using Nginx Reverse Proxy

Uncomment the nginx service in `docker-compose.yml` to add a reverse proxy:

1. Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream charlybot {
        server charlybot:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;

        location / {
            proxy_pass http://charlybot;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

2. Uncomment nginx service in `docker-compose.yml`
3. Run: `docker-compose up -d`

### SSL/HTTPS Setup

For SSL certificates, you can use Let's Encrypt with Certbot:

```bash
# Install certbot
docker run -it --rm -v ./ssl:/etc/letsencrypt certbot/certbot certonly --standalone -d your-domain.com

# Update nginx.conf with SSL configuration
# Restart nginx
docker-compose restart nginx
```

## Resource Management

The default docker-compose.yml includes resource limits:

```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 1G
    reservations:
      cpus: '0.5'
      memory: 512M
```

Adjust these values based on your server capacity.

## Monitoring

### Health Checks

The application includes built-in health checks:

```bash
# Check health status
docker inspect charlybot-app --format='{{.State.Health.Status}}'

# View health check logs
docker inspect charlybot-app --format='{{range .State.Health.Log}}{{.Output}}{{end}}'
```

### Logs

Logs are automatically rotated with these settings:
- Max size: 10MB per file
- Max files: 3 files kept

```bash
# View logs
docker-compose logs -f

# Export logs
docker-compose logs > charlybot.log
```

## Backup and Restore

### Backup Environment Configuration

```bash
# Backup .env file
cp .env .env.backup

# Backup with timestamp
cp .env .env.backup.$(date +%Y%m%d)
```

### Container Data

If using volumes for persistence, backup them:

```bash
# Backup volumes
docker run --rm -v charlybot_app-data:/data -v $(pwd):/backup alpine tar czf /backup/data-backup.tar.gz /data
```

## Updating

### Update Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Or with no downtime
docker-compose up -d --build --no-deps charlybot
```

### Update Base Image

```bash
# Pull latest Node.js image
docker pull node:22-alpine

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

## Security Best Practices

1. **Never commit `.env` file** - Keep it in `.gitignore`
2. **Use secrets management** - For production, consider Docker secrets or external vaults
3. **Regular updates** - Keep base images and dependencies updated
4. **Network isolation** - Use custom networks for service isolation
5. **Resource limits** - Set appropriate CPU and memory limits
6. **SSL/TLS** - Always use HTTPS in production
7. **Firewall rules** - Restrict access to necessary ports only

## Troubleshooting Common Issues

### Container Won't Start

```bash
# Check logs for errors
docker-compose logs charlybot

# Verify environment variables
docker-compose config

# Check port conflicts
netstat -tuln | grep 3000
```

### Can't Connect to Robot

```bash
# Test Modbus connection from container
docker-compose exec charlybot ping ${MODBUS_HOST}

# Check network configuration
docker network inspect charlybot_default
```

### OpenAI API Errors

```bash
# Verify API key is set
docker-compose exec charlybot printenv OPENAI_API_KEY

# Check API connectivity
docker-compose exec charlybot wget -O- https://api.openai.com/v1/models
```

### Out of Memory

```bash
# Check memory usage
docker stats charlybot-app

# Increase memory limit in docker-compose.yml
# Then restart
docker-compose down
docker-compose up -d
```

## Support

For issues or questions:
- Check application logs: `docker-compose logs -f`
- Review container status: `docker-compose ps`
- Inspect container: `docker inspect charlybot-app`

## Cleanup

### Remove Everything

```bash
# Stop and remove containers
docker-compose down

# Remove images
docker-compose down --rmi all

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Complete cleanup
docker-compose down -v --rmi all --remove-orphans
```

### Clean Docker System

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Clean everything
docker system prune -a --volumes
```
