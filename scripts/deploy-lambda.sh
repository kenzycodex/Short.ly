#!/bin/bash

# Short.ly Lambda Deployment Script
# This script creates and deploys the AWS Lambda function for URL redirection

# Exit immediately if a command exits with a non-zero status
set -e

# Display help information
function show_help {
  echo "Short.ly Lambda Deployment Script"
  echo "Usage: ./deploy-lambda.sh [options]"
  echo ""
  echo "Options:"
  echo "  -e, --environment ENV   Set the deployment environment (dev, mvp, prod)"
  echo "  -r, --region REGION     AWS region (default: us-east-1)"
  echo "  -p, --profile PROFILE   AWS CLI profile to use"
  echo "  -h, --help              Show this help message"
  echo ""
  exit 0
}

# Set default values
ENVIRONMENT="dev"
REGION="us-east-1"
PROFILE=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -e|--environment)
      ENVIRONMENT="$2"
      shift
      shift
      ;;
    -r|--region)
      REGION="$2"
      shift
      shift
      ;;
    -p|--profile)
      PROFILE="$2"
      shift
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

# Set function name based on environment
FUNCTION_NAME="short-ly-redirect"
if [[ "$ENVIRONMENT" != "dev" ]]; then
  FUNCTION_NAME="short-ly-redirect-${ENVIRONMENT}"
fi

# Set AWS profile if provided
if [[ -n "$PROFILE" ]]; then
  PROFILE_ARG="--profile $PROFILE"
else
  PROFILE_ARG=""
fi

# Display deployment information
echo "=================================================="
echo "Deploying Lambda function for Short.ly"
echo "Environment: $ENVIRONMENT"
echo "Function name: $FUNCTION_NAME"
echo "AWS Region: $REGION"
echo "AWS Profile: ${PROFILE:-default}"
echo "=================================================="

# Create a temporary directory for packaging
echo "Creating deployment package..."
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

# Copy the Lambda function code
cp -r ../lambda/redirect.js .
cp ../package.json .

# Install production dependencies
echo "Installing production dependencies..."
npm install --production

# Create ZIP file
echo "Creating ZIP archive..."
zip -r redirect.zip ./*

# Check if the Lambda function already exists
echo "Checking if Lambda function exists..."
FUNCTION_EXISTS=$(aws lambda get-function --function-name "$FUNCTION_NAME" $PROFILE_ARG --region "$REGION" 2>&1 || echo "NotFound")

if [[ "$FUNCTION_EXISTS" == *"NotFound"* ]]; then
  # Create new Lambda function
  echo "Creating new Lambda function: $FUNCTION_NAME"
  
  # Get the Lambda execution role ARN
  echo "Please enter the ARN of the Lambda execution role:"
  read ROLE_ARN
  
  aws lambda create-function \
    --function-name "$FUNCTION_NAME" \
    --runtime nodejs16.x \
    --handler redirect.handler \
    --role "$ROLE_ARN" \
    --zip-file fileb://redirect.zip \
    --timeout 10 \
    --memory-size 128 \
    --environment "Variables={API_BASE_URL=https://api.short.ly,DOMAIN_URL=https://short.ly}" \
    $PROFILE_ARG \
    --region "$REGION"
    
  echo "Lambda function created successfully"
else
  # Update existing Lambda function
  echo "Updating existing Lambda function: $FUNCTION_NAME"
  aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file fileb://redirect.zip \
    $PROFILE_ARG \
    --region "$REGION"
    
  echo "Lambda function updated successfully"
  
  # Update environment variables
  echo "Updating environment variables..."
  
  # Set API base URL based on environment
  API_BASE_URL="http://localhost:3000"
  DOMAIN_URL="http://localhost:3000"
  
  if [[ "$ENVIRONMENT" == "mvp" ]]; then
    API_BASE_URL="https://api-mvp.short.ly"
    DOMAIN_URL="https://mvp.short.ly"
  elif [[ "$ENVIRONMENT" == "prod" ]]; then
    API_BASE_URL="https://api.short.ly"
    DOMAIN_URL="https://short.ly"
  fi
  
  aws lambda update-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --environment "Variables={API_BASE_URL=$API_BASE_URL,DOMAIN_URL=$DOMAIN_URL}" \
    $PROFILE_ARG \
    --region "$REGION"
fi

# Setup API Gateway (if needed)
echo "Do you want to set up API Gateway for this Lambda function? (y/n)"
read SETUP_API_GATEWAY

if [[ "$SETUP_API_GATEWAY" == "y" ]]; then
  # Create API Gateway
  echo "Creating API Gateway..."
  API_ID=$(aws apigateway create-rest-api \
    --name "Short.ly Redirect API - $ENVIRONMENT" \
    --description "API for Short.ly URL redirection" \
    $PROFILE_ARG \
    --region "$REGION" \
    --output text \
    --query "id")
  
  echo "API Gateway created with ID: $API_ID"
  
  # Get root resource ID
  ROOT_ID=$(aws apigateway get-resources \
    --rest-api-id "$API_ID" \
    $PROFILE_ARG \
    --region "$REGION" \
    --output text \
    --query "items[0].id")
  
  # Create a resource
  RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id "$API_ID" \
    --parent-id "$ROOT_ID" \
    --path-part "{shortCode}" \
    $PROFILE_ARG \
    --region "$REGION" \
    --output text \
    --query "id")
  
  # Create GET method
  aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method GET \
    --authorization-type NONE \
    --request-parameters "method.request.path.shortCode=true" \
    $PROFILE_ARG \
    --region "$REGION"
  
  # Setup Lambda integration
  LAMBDA_ARN="arn:aws:lambda:$REGION:$(aws sts get-caller-identity --output text --query 'Account'):function:$FUNCTION_NAME"
  
  aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method GET \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
    --request-templates '{"application/json": "{\"shortCode\": \"$input.params(\"shortCode\")\", \"requestContext\": {\"ip\": \"$context.identity.sourceIp\", \"userAgent\": \"$context.identity.userAgent\", \"referrer\": \"$input.params(\"Referer\")\"}}"}'
    $PROFILE_ARG \
    --region "$REGION"
  
  # Add Lambda permission for API Gateway
  aws lambda add-permission \
    --function-name "$FUNCTION_NAME" \
    --statement-id "apigateway-$API_ID" \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$(aws sts get-caller-identity --output text --query 'Account'):$API_ID/*" \
    $PROFILE_ARG \
    --region "$REGION"
  
  # Deploy API
  aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name "$ENVIRONMENT" \
    $PROFILE_ARG \
    --region "$REGION"
  
  # Get API Gateway URL
  API_URL="https://$API_ID.execute-api.$REGION.amazonaws.com/$ENVIRONMENT"
  
  echo "API Gateway deployed at: $API_URL"
  echo "Test URL: $API_URL/{shortCode}"
  
  # Add custom domain (optional)
  echo "Do you want to set up a custom domain for the API Gateway? (y/n)"
  read SETUP_CUSTOM_DOMAIN
  
  if [[ "$SETUP_CUSTOM_DOMAIN" == "y" ]]; then
    echo "Please enter your custom domain name (e.g., api.short.ly):"
    read CUSTOM_DOMAIN
    
    # Additional steps for custom domain setup would go here
    echo "To set up a custom domain name, you'll need to:"
    echo "1. Create or import a certificate in AWS Certificate Manager"
    echo "2. Create a custom domain name in API Gateway"
    echo "3. Create a base path mapping"
    echo "4. Set up DNS records with your domain provider"
    echo ""
    echo "Please consult the AWS documentation for detailed steps:"
    echo "https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-custom-domains.html"
  fi
fi

# Clean up
echo "Cleaning up temporary files..."
rm -rf "$TEMP_DIR"

echo "=================================================="
echo "Lambda deployment completed successfully!"
echo "=================================================="