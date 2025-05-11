resource "aws_apigatewayv2_integration" "shortly_redirect" {
  api_id           = aws_apigatewayv2_api.shortly_redirect.id
  integration_type = "AWS_PROXY"
  
  integration_uri    = aws_lambda_function.shortly_redirect.invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "shortly_redirect" {
  api_id    = aws_apigatewayv2_api.shortly_redirect.id
  route_key = "GET /{shortCode}"
  
  target = "integrations/${aws_apigatewayv2_integration.shortly_redirect.id}"
}

resource "aws_apigatewayv2_stage" "shortly_redirect" {
  api_id      = aws_apigatewayv2_api.shortly_redirect.id
  name        = var.environment
  auto_deploy = true
}

resource "aws_lambda_permission" "shortly_redirect" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.shortly_redirect.function_name
  principal     = "apigateway.amazonaws.com"
  
  source_arn = "${aws_apigatewayv2_api.shortly_redirect.execution_arn}/*/*"
}
```

## Database Setup

### MongoDB Atlas Integration

Short.ly can use MongoDB Atlas as the primary database:

1. **Create a MongoDB Atlas Account**:
   - Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new project

2. **Deploy a Cluster**:
   - Select AWS as the cloud provider
   - Choose a region closest to your AWS resources
   - Select the cluster tier (M10 recommended for production)
   - Enable backups and encryption

3. **Configure Network Access**:
   - Add the CIDR blocks of your VPC to the IP access list
   - Alternatively, use private VPC peering for enhanced security

4. **Create Database User**:
   - Create a dedicated user for Short.ly
   - Use a strong password or X.509 authentication

5. **Get Connection String**:
   - Obtain the connection string from the Atlas dashboard
   - Store it securely in AWS Systems Manager Parameter Store

```bash
# Store MongoDB connection string in Parameter Store
aws ssm put-parameter \
  --name "/shortly/prod/mongodb-uri" \
  --type "SecureString" \
  --value "mongodb+srv://username:password@cluster.mongodb.net/shortlydb_prod?retryWrites=true&w=majority"
```

### Amazon DocumentDB (Alternative)

For a fully AWS-native solution, use Amazon DocumentDB:

```bash
# Create a DocumentDB cluster
aws docdb create-db-cluster \
  --db-cluster-identifier shortly-docdb \
  --engine docdb \
  --master-username shortly \
  --master-user-password YOUR_SECURE_PASSWORD \
  --vpc-security-group-ids sg-0123456789abcdef \
  --db-subnet-group-name shortly-docdb-subnet-group

# Create a DB instance in the cluster
aws docdb create-db-instance \
  --db-instance-identifier shortly-docdb-instance-1 \
  --db-instance-class db.r5.large \
  --engine docdb \
  --db-cluster-identifier shortly-docdb
```

#### Terraform Example

```hcl
resource "aws_docdb_cluster" "shortly" {
  cluster_identifier      = "shortly-docdb-${var.environment}"
  engine                  = "docdb"
  master_username         = var.docdb_username
  master_password         = var.docdb_password
  db_subnet_group_name    = aws_docdb_subnet_group.shortly.name
  vpc_security_group_ids  = [aws_security_group.shortly_docdb.id]
  skip_final_snapshot     = var.environment != "prod"
  
  tags = {
    Name        = "shortly-docdb"
    Environment = var.environment
  }
}

resource "aws_docdb_cluster_instance" "shortly" {
  count              = 2
  identifier         = "shortly-docdb-${var.environment}-${count.index}"
  cluster_identifier = aws_docdb_cluster.shortly.id
  instance_class     = "db.r5.large"
}

resource "aws_docdb_subnet_group" "shortly" {
  name       = "shortly-docdb-subnet-group"
  subnet_ids = module.vpc.private_subnets
  
  tags = {
    Name = "Shortly DocDB Subnet Group"
  }
}
```

## Cache Setup

### ElastiCache for Redis

Set up Redis using ElastiCache for caching URL data:

```bash
# Create a Redis subnet group
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name shortly-redis-subnet-group \
  --cache-subnet-group-description "Subnet group for Shortly Redis" \
  --subnet-ids subnet-0123456789abcdef subnet-0123456789ghijkl

# Create a Redis cluster
aws elasticache create-replication-group \
  --replication-group-id shortly-redis \
  --replication-group-description "Redis for Shortly" \
  --engine redis \
  --cache-node-type cache.t3.medium \
  --num-cache-clusters 2 \
  --security-group-ids sg-0123456789abcdef \
  --cache-subnet-group-name shortly-redis-subnet-group \
  --automatic-failover-enabled \
  --at-rest-encryption-enabled \
  --transit-encryption-enabled \
  --auth-token YOUR_SECURE_PASSWORD
```

#### Terraform Example

```hcl
resource "aws_elasticache_subnet_group" "shortly" {
  name       = "shortly-redis-subnet-group"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_elasticache_replication_group" "shortly" {
  replication_group_id          = "shortly-redis-${var.environment}"
  replication_group_description = "Redis for Shortly ${var.environment}"
  node_type                     = "cache.t3.medium"
  number_cache_clusters         = 2
  parameter_group_name          = "default.redis6.x"
  port                          = 6379
  
  subnet_group_name             = aws_elasticache_subnet_group.shortly.name
  security_group_ids            = [aws_security_group.shortly_redis.id]
  
  at_rest_encryption_enabled    = true
  transit_encryption_enabled    = true
  auth_token                    = var.redis_auth_token
  
  automatic_failover_enabled    = true
  
  tags = {
    Name        = "shortly-redis"
    Environment = var.environment
  }
}
```

## Network Configuration

### Load Balancer

Set up an Application Load Balancer for the Short.ly API:

```bash
# Create a target group
aws elbv2 create-target-group \
  --name shortly-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-0123456789abcdef \
  --target-type instance \
  --health-check-path /api/v1/health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 2

# Create a load balancer
aws elbv2 create-load-balancer \
  --name shortly-alb \
  --subnets subnet-0123456789abcdef subnet-0123456789ghijkl \
  --security-groups sg-0123456789abcdef

# Create HTTPS listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/shortly-alb/0123456789abcdef \
  --protocol HTTPS \
  --port 443 \
  --ssl-policy ELBSecurityPolicy-2016-08 \
  --certificates CertificateArn=arn:aws:acm:us-east-1:123456789012:certificate/0123456789abcdef \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/shortly-tg/0123456789abcdef

# Create HTTP listener that redirects to HTTPS
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/shortly-alb/0123456789abcdef \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=redirect,RedirectConfig="{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}"
```

#### Terraform Example

```hcl
resource "aws_lb" "shortly" {
  name               = "shortly-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.shortly_alb.id]
  subnets            = module.vpc.public_subnets
  
  enable_deletion_protection = var.environment == "prod"
  
  tags = {
    Name        = "shortly-alb"
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "shortly" {
  name     = "shortly-tg-${var.environment}"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = module.vpc.vpc_id
  target_type = "instance"
  
  health_check {
    path                = "/api/v1/health"
    port                = "traffic-port"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }
}

resource "aws_lb_listener" "shortly_https" {
  load_balancer_arn = aws_lb.shortly.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = aws_acm_certificate.shortly.arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.shortly.arn
  }
}

resource "aws_lb_listener" "shortly_http" {
  load_balancer_arn = aws_lb.shortly.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type = "redirect"
    
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}
```

### API Gateway

For the serverless redirection component:

```bash
# Create a custom domain name
aws apigateway create-domain-name \
  --domain-name short.ly \
  --certificate-arn arn:aws:acm:us-east-1:123456789012:certificate/0123456789abcdef

# Create a base path mapping
aws apigateway create-base-path-mapping \
  --domain-name short.ly \
  --rest-api-id abcdef1234 \
  --stage prod
```

#### Terraform Example

```hcl
resource "aws_apigatewayv2_domain_name" "shortly" {
  domain_name = "short.ly"
  
  domain_name_configuration {
    certificate_arn = aws_acm_certificate.shortly.arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_api_mapping" "shortly" {
  api_id      = aws_apigatewayv2_api.shortly_redirect.id
  domain_name = aws_apigatewayv2_domain_name.shortly.id
  stage       = aws_apigatewayv2_stage.shortly_redirect.id
}
```

### Route 53 DNS

Configure DNS with Route 53:

```bash
# Create hosted zone (if not already existing)
aws route53 create-hosted-zone \
  --name short.ly \
  --caller-reference $(date +%s)

# Create A record for the domain
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890XYZ \
  --change-batch '{
    "Changes": [
      {
        "Action": "CREATE",
        "ResourceRecordSet": {
          "Name": "short.ly",
          "Type": "A",
          "AliasTarget": {
            "HostedZoneId": "Z117KPS5GTRQ2G",
            "DNSName": "dualstack.shortly-alb-1234567890.us-east-1.elb.amazonaws.com",
            "EvaluateTargetHealth": true
          }
        }
      }
    ]
  }'

# Create A record for the API subdomain
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890XYZ \
  --change-batch '{
    "Changes": [
      {
        "Action": "CREATE",
        "ResourceRecordSet": {
          "Name": "api.short.ly",
          "Type": "A",
          "AliasTarget": {
            "HostedZoneId": "Z117KPS5GTRQ2G",
            "DNSName": "dualstack.shortly-alb-1234567890.us-east-1.elb.amazonaws.com",
            "EvaluateTargetHealth": true
          }
        }
      }
    ]
  }'
```

#### Terraform Example

```hcl
resource "aws_route53_zone" "shortly" {
  name = "short.ly"
}

resource "aws_route53_record" "shortly_apex" {
  zone_id = aws_route53_zone.shortly.zone_id
  name    = "short.ly"
  type    = "A"
  
  alias {
    name                   = aws_apigatewayv2_domain_name.shortly.domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.shortly.domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "shortly_api" {
  zone_id = aws_route53_zone.shortly.zone_id
  name    = "api.short.ly"
  type    = "A"
  
  alias {
    name                   = aws_lb.shortly.dns_name
    zone_id                = aws_lb.shortly.zone_id
    evaluate_target_health = true
  }
}

resource "aws_acm_certificate" "shortly" {
  domain_name       = "short.ly"
  validation_method = "DNS"
  
  subject_alternative_names = ["*.short.ly"]
  
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "shortly_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.shortly.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }
  
  zone_id = aws_route53_zone.shortly.zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.record]
  ttl     = 60
}

resource "aws_acm_certificate_validation" "shortly" {
  certificate_arn         = aws_acm_certificate.shortly.arn
  validation_record_fqdns = [for record in aws_route53_record.shortly_cert_validation : record.fqdn]
}
```

### CloudFront CDN

Set up CloudFront to cache redirects and static assets:

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name api.short.ly \
  --default-cache-behavior '{ 
    "TargetOriginId": "shortly-api",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 7,
      "Items": ["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "POST", "DELETE"]
    },
    "CachedMethods": {
      "Quantity": 3,
      "Items": ["GET", "HEAD", "OPTIONS"]
    },
    "DefaultTTL": 3600
  }' \
  --enabled true \
  --comment "Shortly CloudFront Distribution"
```

#### Terraform Example

```hcl
resource "aws_cloudfront_distribution" "shortly" {
  origin {
    domain_name = aws_lb.shortly.dns_name
    origin_id   = "shortly-alb"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Shortly CloudFront Distribution"
  default_root_object = "index.html"
  
  aliases = ["cdn.short.ly"]
  
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "shortly-alb"
    
    forwarded_values {
      query_string = true
      
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.shortly.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
  
  tags = {
    Name        = "shortly-cloudfront"
    Environment = var.environment
  }
}
```

## Application Deployment

### EC2 Deployment

For EC2-based deployment:

1. **Create an AMI with the application**:
   - Launch a temporary EC2 instance
   - Install dependencies and configure the application
   - Create an AMI from the instance
   - Terminate the temporary instance

2. **Set up a CI/CD pipeline**:
   - Use AWS CodePipeline or GitHub Actions
   - Build and test the application
   - Create a new AMI or update the existing one
   - Update the Auto Scaling Group launch template

3. **Configure environment variables**:
   - Store environment variables in Parameter Store
   - Retrieve them at instance startup

```bash
# Script to retrieve environment variables at startup
#!/bin/bash
# Retrieve parameters from SSM Parameter Store
MONGO_URI=$(aws ssm get-parameter --name "/shortly/prod/mongodb-uri" --with-decryption --query "Parameter.Value" --output text)
REDIS_HOST=$(aws ssm get-parameter --name "/shortly/prod/redis-host" --query "Parameter.Value" --output text)
REDIS_PORT=$(aws ssm get-parameter --name "/shortly/prod/redis-port" --query "Parameter.Value" --output text)
REDIS_PASSWORD=$(aws ssm get-parameter --name "/shortly/prod/redis-password" --with-decryption --query "Parameter.Value" --output text)

# Create .env file
cat > /opt/short.ly/.env << EOL
NODE_ENV=production
APP_ENV=production
PORT=3000
HOST=api.short.ly
BASE_URL=https://api.short.ly

# MongoDB Connection
MONGO_URI=${MONGO_URI}

# Redis Configuration
REDIS_HOST=${REDIS_HOST}
REDIS_PORT=${REDIS_PORT}
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_SSL=true
REDIS_TTL=86400

# URL Configuration
URL_LENGTH=7
DOMAIN_URL=https://short.ly

# Other configurations...
EOL

# Restart application
systemctl restart shortly
```

### ECS Deployment

For container-based deployment:

1. **Build and push Docker image**:
   ```bash
   docker build -t 123456789012.dkr.ecr.us-east-1.amazonaws.com/shortly:latest .
   aws ecr get-login-password | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
   docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/shortly:latest
   ```

2. **Update ECS task definition**:
   ```bash
   aws ecs register-task-definition --cli-input-json file://task-definition.json
   ```

3. **Update ECS service**:
   ```bash
   aws ecs update-service \
     --cluster shortly-cluster \
     --service shortly-service \
     --task-definition shortly-task:2 \
     --force-new-deployment
   ```

### Lambda Deployment

For serverless component deployment:

1. **Create deployment package**:
   ```bash
   # Create a deployment directory
   mkdir -p lambda-build
   cd lambda-build
   
   # Copy Lambda files
   cp ../lambda/redirect.js index.js
   cp ../package.json .
   
   # Install production dependencies
   npm install --production
   
   # Create ZIP file
   zip -r ../lambda-redirect.zip .
   
   cd ..
   ```

2. **Update Lambda function**:
   ```bash
   aws lambda update-function-code \
     --function-name shortly-redirect \
     --zip-file fileb://lambda-redirect.zip
   ```

## Scaling and High Availability

### Auto Scaling Groups

Configure Auto Scaling for the EC2 instances:

```bash
# Create scaling policies
aws autoscaling put-scaling-policy \
  --auto-scaling-group-name shortly-asg \
  --policy-name shortly-cpu-scale-out \
  --policy-type TargetTrackingScaling \
  --target-tracking-configuration '{
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ASGAverageCPUUtilization"
    },
    "TargetValue": 70.0,
    "ScaleOutCooldown": 300,
    "ScaleInCooldown": 300
  }'

aws autoscaling put-scaling-policy \
  --auto-scaling-group-name shortly-asg \
  --policy-name shortly-requests-scale-out \
  --policy-type TargetTrackingScaling \
  --target-tracking-configuration '{
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ALBRequestCountPerTarget",
      "ResourceLabel": "app/shortly-alb/0123456789abcdef/targetgroup/shortly-tg/0123456789abcdef"
    },
    "TargetValue": 1000.0,
    "ScaleOutCooldown": 300,
    "ScaleInCooldown": 300
  }'
```

#### Terraform Example

```hcl
resource "aws_autoscaling_policy" "shortly_cpu" {
  name                   = "shortly-cpu-scale-out"
  autoscaling_group_name = aws_autoscaling_group.shortly.name
  policy_type            = "TargetTrackingScaling"
  
  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    
    target_value = 70.0
    scale_out_cooldown = 300
    scale_in_cooldown = 300
  }
}

resource "aws_autoscaling_policy" "shortly_requests" {
  name                   = "shortly-requests-scale-out"
  autoscaling_group_name = aws_autoscaling_group.shortly.name
  policy_type            = "TargetTrackingScaling"
  
  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${aws_lb.shortly.arn_suffix}/${aws_lb_target_group.shortly.arn_suffix}"
    }
    
    target_value = 1000.0
    scale_out_cooldown = 300
    scale_in_cooldown = 300
  }
}
```

### Multi-AZ Deployment

Ensure high availability by deploying across multiple Availability Zones:

- Deploy EC2 instances or ECS tasks across at least 2 AZs
- Configure ElastiCache Redis with Multi-AZ enabled
- Use MongoDB Atlas with multi-region clusters
- Set up Route 53 health checks and failover routing

## Monitoring and Logging

### CloudWatch

Set up CloudWatch for monitoring and logging:

```bash
# Create a log group
aws logs create-log-group --log-group-name /shortly/application

# Create a metric filter
aws logs put-metric-filter \
  --log-group-name /shortly/application \
  --filter-name ErrorCount \
  --filter-pattern "ERROR" \
  --metric-transformations \
  'metricName=ApplicationErrors,metricNamespace=Shortly,metricValue=1'

# Create an alarm
aws cloudwatch put-metric-alarm \
  --alarm-name shortly-error-alarm \
  --alarm-description "Alert when error count exceeds threshold" \
  --metric-name ApplicationErrors \
  --namespace Shortly \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:shortly-alerts
```

#### Terraform Example

```hcl
resource "aws_cloudwatch_log_group" "shortly" {
  name              = "/shortly/application"
  retention_in_days = 30
  
  tags = {
    Name = "shortly-logs"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "shortly_errors" {
  alarm_name          = "shortly-${var.environment}-error-alarm"
  alarm_description   = "Alert when error count exceeds threshold"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApplicationErrors"
  namespace           = "Shortly"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  
  alarm_actions = [aws_sns_topic.shortly_alerts.arn]
  
  tags = {
    Name = "shortly-error-alarm"
    Environment = var.environment
  }
}

resource "aws_sns_topic" "shortly_alerts" {
  name = "shortly-${var.environment}-alerts"
}
```

### X-Ray

Configure AWS X-Ray for distributed tracing:

```bash
# Create an X-Ray sampling rule
aws xray create-sampling-rule \
  --sampling-rule '{
    "RuleName": "ShortlyDefault",
    "RuleARN": null,
    "ResourceARN": "*",
    "Priority": 1000,
    "FixedRate": 0.05,
    "ReservoirSize": 5,
    "ServiceName": "shortly",
    "ServiceType": "*",
    "Host": "*",
    "HTTPMethod": "*",
    "URLPath": "*",
    "Version": 1
  }'
```

#### Terraform Example

```hcl
resource "aws_xray_sampling_rule" "shortly" {
  rule_name      = "shortly-${var.environment}-sampling"
  priority       = 1000
  reservoir_size = 5
  fixed_rate     = 0.05
  service_name   = "shortly"
  resource_arn   = "*"
  host           = "*"
  http_method    = "*"
  url_path       = "*"
  version        = 1
}
```

### CloudTrail

Enable CloudTrail for API activity monitoring:

```bash
# Create a CloudTrail trail
aws cloudtrail create-trail \
  --name shortly-trail \
  --s3-bucket-name shortly-cloudtrail-logs \
  --is-multi-region-trail \
  --enable-log-file-validation

# Start logging
aws cloudtrail start-logging --name shortly-trail
```

#### Terraform Example

```hcl
resource "aws_cloudtrail" "shortly" {
  name                          = "shortly-${var.environment}-trail"
  s3_bucket_name                = aws_s3_bucket.shortly_logs.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  
  event_selector {
    read_write_type           = "All"
    include_management_events = true
    
    data_resource {
      type   = "AWS::Lambda::Function"
      values = ["arn:aws:lambda"]
    }
  }
  
  tags = {
    Name = "shortly-trail"
    Environment = var.environment
  }
}

resource "aws_s3_bucket" "shortly_logs" {
  bucket = "shortly-${var.environment}-cloudtrail-logs"
  
  lifecycle_rule {
    id      = "log-expiration"
    enabled = true
    
    expiration {
      days = 90
    }
  }
  
  tags = {
    Name = "shortly-cloudtrail-logs"
    Environment = var.environment
  }
}
```

## Security Best Practices

### IAM Roles and Policies

Create IAM roles with least privilege:

```bash
# Create IAM role for EC2 instances
aws iam create-role \
  --role-name shortly-ec2-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "ec2.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }'

# Create custom policy
aws iam create-policy \
  --policy-name shortly-ssm-policy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ],
        "Resource": "arn:aws:ssm:us-east-1:123456789012:parameter/shortly/*"
      }
    ]
  }'

# Attach policies to role
aws iam attach-role-policy \
  --role-name shortly-ec2-role \
  --policy-arn arn:aws:iam::123456789012:policy/shortly-ssm-policy

aws iam attach-role-policy \
  --role-name shortly-ec2-role \
  --policy-arn arn# AWS Deployment Guide for Short.ly

This comprehensive guide provides detailed instructions for deploying Short.ly to Amazon Web Services (AWS). It covers setting up the required infrastructure, configuring networking, deploying the application, and establishing monitoring and scaling.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Infrastructure Setup](#infrastructure-setup)
  - [VPC Configuration](#vpc-configuration)
  - [Security Groups](#security-groups)
  - [EC2 Instances](#ec2-instances)
  - [ECS Cluster (Alternative)](#ecs-cluster-alternative)
  - [Serverless Lambda (Alternative)](#serverless-lambda-alternative)
- [Database Setup](#database-setup)
  - [MongoDB Atlas Integration](#mongodb-atlas-integration)
  - [Amazon DocumentDB (Alternative)](#amazon-documentdb-alternative)
- [Cache Setup](#cache-setup)
  - [ElastiCache for Redis](#elasticache-for-redis)
- [Network Configuration](#network-configuration)
  - [Load Balancer](#load-balancer)
  - [API Gateway](#api-gateway)
  - [Route 53 DNS](#route-53-dns)
  - [CloudFront CDN](#cloudfront-cdn)
- [Application Deployment](#application-deployment)
  - [EC2 Deployment](#ec2-deployment)
  - [ECS Deployment](#ecs-deployment)
  - [Lambda Deployment](#lambda-deployment)
- [Scaling and High Availability](#scaling-and-high-availability)
  - [Auto Scaling Groups](#auto-scaling-groups)
  - [Multi-AZ Deployment](#multi-az-deployment)
- [Monitoring and Logging](#monitoring-and-logging)
  - [CloudWatch](#cloudwatch)
  - [X-Ray](#x-ray)
  - [CloudTrail](#cloudtrail)
- [Security Best Practices](#security-best-practices)
  - [IAM Roles and Policies](#iam-roles-and-policies)
  - [Encryption](#encryption)
  - [Security Groups](#security-groups-1)
- [Cost Optimization](#cost-optimization)
- [Maintenance and Updates](#maintenance-and-updates)
- [Troubleshooting](#troubleshooting)
- [Terraform Templates](#terraform-templates)

## Architecture Overview

![AWS Architecture Diagram](../images/aws-architecture.png)

The recommended AWS architecture for Short.ly includes:

- **Compute**: EC2 instances in an Auto Scaling Group behind a Load Balancer
- **Serverless Redirection**: AWS Lambda + API Gateway
- **Database**: MongoDB Atlas or Amazon DocumentDB
- **Caching**: Amazon ElastiCache for Redis
- **Load Balancing**: Application Load Balancer
- **CDN**: CloudFront for static assets and caching
- **DNS**: Route 53 for domain management
- **Monitoring**: CloudWatch, X-Ray, and CloudTrail
- **Security**: IAM, VPC, Security Groups, WAF

### Architecture Variants

1. **Standard Architecture** (EC2-based):
   - EC2 instances in Auto Scaling Group
   - Application Load Balancer
   - MongoDB Atlas
   - ElastiCache for Redis

2. **Containerized Architecture** (ECS/Fargate):
   - ECS Cluster with Fargate
   - Application Load Balancer
   - MongoDB Atlas
   - ElastiCache for Redis

3. **Serverless Architecture** (Lambda):
   - API Gateway
   - Lambda functions
   - MongoDB Atlas
   - ElastiCache for Redis (or DynamoDB for URL storage)

## Prerequisites

Before deploying Short.ly to AWS, you need:

1. **AWS Account**: With appropriate permissions
2. **AWS CLI**: Installed and configured with access keys
3. **AWS CDK or Terraform**: For infrastructure as code (recommended)
4. **MongoDB Atlas Account**: For database hosting (if not using DocumentDB)
5. **Domain Name**: Registered in Route 53 or another registrar
6. **SSL Certificate**: From AWS Certificate Manager

### Required IAM Permissions

Ensure your AWS user has the following permissions:

- EC2 (Full Access)
- VPC (Full Access)
- ECS (if using containers)
- Lambda
- IAM (Role creation)
- CloudWatch
- ElastiCache
- Route 53
- CloudFront
- Certificate Manager
- Systems Manager (for Parameter Store)

## Infrastructure Setup

### VPC Configuration

Create a VPC with public and private subnets across multiple availability zones:

```bash
# Create VPC with CIDR 10.0.0.0/16
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=shortly-vpc}]'

# Create public subnets in two AZs
aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 --availability-zone us-east-1a --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=shortly-public-1a}]'
aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 --availability-zone us-east-1b --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=shortly-public-1b}]'

# Create private subnets in two AZs
aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.3.0/24 --availability-zone us-east-1a --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=shortly-private-1a}]'
aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.4.0/24 --availability-zone us-east-1b --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=shortly-private-1b}]'

# Create and attach Internet Gateway
aws ec2 create-internet-gateway --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=shortly-igw}]'
aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID

# Create NAT Gateways for private subnets
aws ec2 allocate-address --domain vpc
aws ec2 create-nat-gateway --subnet-id $PUBLIC_SUBNET_1A_ID --allocation-id $ALLOCATION_ID --tag-specifications 'ResourceType=natgateway,Tags=[{Key=Name,Value=shortly-nat-1a}]'
```

#### Terraform Example

```hcl
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "shortly-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["us-east-1a", "us-east-1b"]
  private_subnets = ["10.0.3.0/24", "10.0.4.0/24"]
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
  
  enable_nat_gateway = true
  single_nat_gateway = false
  one_nat_gateway_per_az = true
  
  tags = {
    Environment = "${var.environment}"
    Project     = "shortly"
  }
}
```

### Security Groups

Create security groups for different components:

```bash
# Create security group for the application
aws ec2 create-security-group --group-name shortly-app-sg --description "Security group for Short.ly application" --vpc-id $VPC_ID

# Allow HTTP/HTTPS traffic to the application
aws ec2 authorize-security-group-ingress --group-id $APP_SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $APP_SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0

# Create security group for Redis
aws ec2 create-security-group --group-name shortly-redis-sg --description "Security group for Short.ly Redis" --vpc-id $VPC_ID

# Allow access to Redis only from the application security group
aws ec2 authorize-security-group-ingress --group-id $REDIS_SG_ID --protocol tcp --port 6379 --source-group $APP_SG_ID

# Create security group for MongoDB
aws ec2 create-security-group --group-name shortly-mongodb-sg --description "Security group for Short.ly MongoDB" --vpc-id $VPC_ID

# Allow access to MongoDB only from the application security group
aws ec2 authorize-security-group-ingress --group-id $MONGODB_SG_ID --protocol tcp --port 27017 --source-group $APP_SG_ID
```

#### Terraform Example

```hcl
resource "aws_security_group" "shortly_app" {
  name        = "shortly-app-sg"
  description = "Security group for Short.ly application"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    description      = "HTTPS"
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
  }
  
  ingress {
    description      = "HTTP"
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
  }
  
  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "shortly_redis" {
  name        = "shortly-redis-sg"
  description = "Security group for Short.ly Redis"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    description      = "Redis"
    from_port        = 6379
    to_port          = 6379
    protocol         = "tcp"
    security_groups  = [aws_security_group.shortly_app.id]
  }
  
  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
  }
}
```

### EC2 Instances

Launch EC2 instances for the application:

```bash
# Create a launch template
aws ec2 create-launch-template \
  --launch-template-name shortly-app-template \
  --version-description "Initial version" \
  --launch-template-data '{
    "ImageId": "ami-0c55b159cbfafe1f0",
    "InstanceType": "t3.medium",
    "SecurityGroupIds": ["sg-0123456789abcdef"],
    "KeyName": "shortly-key",
    "UserData": "IyEvYmluL2Jhc2gKY2QgL2hvbWUvZWMyLXVzZXIKZ2l0IGNsb25lIGh0dHBzOi8vZ2l0aHViLmNvbS95b3VydXNlcm5hbWUvc2hvcnQubHkuZ2l0CmNkIHNob3J0Lmx5Cm5wbSBpbnN0YWxsCmNwIC5lbnYucHJvZCAuZW52Cm5wbSBydW4gc3RhcnQ6cHJvZA=="
  }'

# Create an Auto Scaling Group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name shortly-asg \
  --launch-template "LaunchTemplateName=shortly-app-template,Version=1" \
  --min-size 2 \
  --max-size 10 \
  --desired-capacity 2 \
  --vpc-zone-identifier "subnet-0123456789abcdef,subnet-0123456789ghijkl" \
  --target-group-arns "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/shortly-tg/0123456789abcdef" \
  --health-check-type ELB \
  --health-check-grace-period 300
```

#### User Data Script (Base64 Decoded)

```bash
#!/bin/bash
# Install dependencies
apt-get update
apt-get install -y git nodejs npm

# Clone repository
cd /opt
git clone https://github.com/yourusername/short.ly.git
cd short.ly

# Setup application
npm install
cp .env.prod .env

# Configure systemd service
cat > /etc/systemd/system/shortly.service << 'EOL'
[Unit]
Description=Short.ly URL Shortener
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/short.ly
ExecStart=/usr/bin/npm run start:prod
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOL

# Start service
systemctl daemon-reload
systemctl enable shortly
systemctl start shortly
```

#### Terraform Example

```hcl
resource "aws_launch_template" "shortly" {
  name_prefix   = "shortly-"
  image_id      = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.medium"
  key_name      = aws_key_pair.shortly.key_name
  
  vpc_security_group_ids = [aws_security_group.shortly_app.id]
  
  user_data = base64encode(file("${path.module}/user_data.sh"))
  
  iam_instance_profile {
    name = aws_iam_instance_profile.shortly_instance_profile.name
  }
  
  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "shortly-app"
    }
  }
}

resource "aws_autoscaling_group" "shortly" {
  name                      = "shortly-asg-${var.environment}"
  min_size                  = 2
  max_size                  = 10
  desired_capacity          = 2
  health_check_grace_period = 300
  health_check_type         = "ELB"
  vpc_zone_identifier       = module.vpc.private_subnets
  
  launch_template {
    id      = aws_launch_template.shortly.id
    version = "$Latest"
  }
  
  target_group_arns = [aws_lb_target_group.shortly.arn]
  
  tag {
    key                 = "Name"
    value               = "shortly-instance"
    propagate_at_launch = true
  }
}
```

### ECS Cluster (Alternative)

For a containerized deployment, set up an ECS cluster with Fargate:

```bash
# Create an ECS cluster
aws ecs create-cluster --cluster-name shortly-cluster

# Register a task definition
aws ecs register-task-definition \
  --family shortly-task \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu 1024 \
  --memory 2048 \
  --execution-role-arn arn:aws:iam::123456789012:role/ecsTaskExecutionRole \
  --container-definitions '[
    {
      "name": "shortly-app",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/shortly:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "hostPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "APP_ENV", "value": "production" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/shortly",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]'

# Create a service
aws ecs create-service \
  --cluster shortly-cluster \
  --service-name shortly-service \
  --task-definition shortly-task \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-0123456789abcdef,subnet-0123456789ghijkl],securityGroups=[sg-0123456789abcdef],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/shortly-tg/0123456789abcdef,containerName=shortly-app,containerPort=3000"
```

#### Terraform Example

```hcl
resource "aws_ecs_cluster" "shortly" {
  name = "shortly-cluster"
}

resource "aws_ecs_task_definition" "shortly" {
  family                   = "shortly-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 1024
  memory                   = 2048
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn
  
  container_definitions = jsonencode([
    {
      name      = "shortly-app"
      image     = "${aws_ecr_repository.shortly.repository_url}:latest"
      essential = true
      
      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
        }
      ]
      
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "APP_ENV", value = var.environment }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.shortly.name
          awslogs-region        = var.region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "shortly" {
  name            = "shortly-service"
  cluster         = aws_ecs_cluster.shortly.id
  task_definition = aws_ecs_task_definition.shortly.arn
  desired_count   = 2
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.shortly_app.id]
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.shortly.arn
    container_name   = "shortly-app"
    container_port   = 3000
  }
  
  depends_on = [aws_lb_listener.shortly]
}
```

### Serverless Lambda (Alternative)

For the serverless redirection component:

```bash
# Create Lambda function
aws lambda create-function \
  --function-name shortly-redirect \
  --runtime nodejs16.x \
  --role arn:aws:iam::123456789012:role/shortly-lambda-role \
  --handler index.handler \
  --zip-file fileb://lambda-redirect.zip \
  --environment "Variables={API_BASE_URL=https://api.short.ly,DOMAIN_URL=https://short.ly}"

# Create API Gateway
aws apigateway create-rest-api \
  --name "Shortly Redirect API" \
  --description "API for Short.ly URL redirection"

# Get the API ID
API_ID=$(aws apigateway get-rest-apis --query "items[?name=='Shortly Redirect API'].id" --output text)

# Get the root resource ID
ROOT_ID=$(aws apigateway get-resources --rest-api-id $API_ID --query "items[0].id" --output text)

# Create a resource
RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part "{shortCode}" \
  --query "id" \
  --output text)

# Setup methods and integrations
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method GET \
  --authorization-type NONE \
  --request-parameters "method.request.path.shortCode=true"

aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method GET \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:shortly-redirect/invocations"

# Deploy the API
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod
```

#### Terraform Example

```hcl
resource "aws_lambda_function" "shortly_redirect" {
  function_name = "shortly-redirect-${var.environment}"
  filename      = "lambda-redirect.zip"
  handler       = "index.handler"
  runtime       = "nodejs16.x"
  role          = aws_iam_role.lambda_execution_role.arn
  
  environment {
    variables = {
      API_BASE_URL = "https://api.short.ly",
      DOMAIN_URL   = "https://short.ly"
    }
  }
}

resource "aws_apigatewayv2_api" "shortly_redirect" {
  name          = "shortly-redirect-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "shortly_redirect" {