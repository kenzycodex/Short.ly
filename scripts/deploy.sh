#!/bin/bash

# Short.ly Deployment Script
# This script handles deployment to different environments

# Exit immediately if a command exits with a non-zero status
set -e

# Display help information
function show_help {
  echo "Short.ly Deployment Script"
  echo "Usage: ./deploy.sh [options]"
  echo ""
  echo "Options:"
  echo "  -e, --environment ENV   Set the deployment environment (dev, mvp, prod)"
  echo "  -s, --skip-tests        Skip running tests before deployment"
  echo "  -h, --help              Show this help message"
  echo ""
  exit 0
}

# Set default values
ENVIRONMENT="dev"
SKIP_TESTS=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -e|--environment)
      ENVIRONMENT="$2"
      shift
      shift
      ;;
    -s|--skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    -h|--help)
      show_help
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      ;;
  esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "mvp" && "$ENVIRONMENT" != "prod" ]]; then
  echo "Error: Invalid environment. Must be 'dev', 'mvp', or 'prod'."
  exit 1
fi

# Convert environment name for .env file
if [[ "$ENVIRONMENT" == "dev" ]]; then
  ENV_FILE=".env.dev"
elif [[ "$ENVIRONMENT" == "mvp" ]]; then
  ENV_FILE=".env.mvp"
else
  ENV_FILE=".env.prod"
fi

# Display deployment information
echo "=================================================="
echo "Deploying Short.ly to $ENVIRONMENT environment"
echo "Using config file: $ENV_FILE"
echo "Skip tests: $SKIP_TESTS"
echo "=================================================="

# Prepare the deployment
echo "Preparing for deployment..."
npm install

# Run tests if not skipped
if [[ "$SKIP_TESTS" == "false" ]]; then
  echo "Running tests..."
  npm test
  
  if [[ $? -ne 0 ]]; then
    echo "Tests failed. Deployment aborted."
    exit 1
  fi
fi

# Build the application
echo "Building the application..."
npm run build

# Deploy based on environment
case $ENVIRONMENT in
  "dev")
    echo "Deploying to development environment..."
    # Copy the environment file
    cp $ENV_FILE .env
    
    # Start the application using docker-compose
    docker-compose -f docker/docker-compose.yml up -d --build
    ;;
  
  "mvp")
    echo "Deploying to MVP environment..."
    # Copy the environment file
    cp $ENV_FILE .env
    
    # If using AWS/Google Cloud, you could add deployment commands here
    # Example for AWS EC2:
    # aws ec2 run-instances --image-id ami-12345678 --count 1 --instance-type t2.micro --key-name MyKeyPair --security-group-ids sg-12345678
    
    echo "Deploying to MVP server using Docker..."
    # Example: Copy files to remote server and start the container
    # scp -r ./* user@mvp-server:/path/to/app
    # ssh user@mvp-server "cd /path/to/app && docker-compose -f docker/docker-compose.yml up -d --build"
    ;;
  
  "prod")
    echo "Deploying to production environment..."
    # Copy the environment file
    cp $ENV_FILE .env
    
    # Deploy AWS Lambda for redirects
    echo "Deploying AWS Lambda function for redirects..."
    # Example: Use AWS CLI to deploy Lambda function
    # aws lambda update-function-code --function-name short-ly-redirect-prod --zip-file fileb://lambda/redirect.zip
    
    # Deploy to cloud provider
    echo "Deploying API to cloud provider..."
    
    # Example for AWS EC2:
    # aws ec2 run-instances --image-id ami-12345678 --count 1 --instance-type t2.micro --key-name MyKeyPair --security-group-ids sg-12345678
    
    # Example for Google Cloud Run:
    # gcloud run deploy short-ly-api --source . --platform managed --region us-central1
    
    # Setup DNS
    echo "Setting up DNS records..."
    # Example for AWS Route 53:
    # aws route53 change-resource-record-sets --hosted-zone-id ZXXXXXXXXXX --change-batch file://route53-changes.json
    ;;
esac

echo "=================================================="
echo "Deployment completed successfully!"
echo "=================================================="