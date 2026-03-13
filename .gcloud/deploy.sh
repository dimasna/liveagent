#!/bin/bash
set -euo pipefail

# LiveAgent - Google Cloud Deployment Script
# Prerequisites: gcloud CLI authenticated, project set

PROJECT_ID="${GOOGLE_CLOUD_PROJECT_ID:?Set GOOGLE_CLOUD_PROJECT_ID}"
REGION="${GOOGLE_CLOUD_REGION:-us-central1}"
REPO="liveagent"

echo "==> Deploying LiveAgent to Google Cloud"
echo "    Project: $PROJECT_ID"
echo "    Region:  $REGION"

# 1. Create Artifact Registry repo (if not exists)
gcloud artifacts repositories describe $REPO \
  --location=$REGION \
  --project=$PROJECT_ID 2>/dev/null || \
gcloud artifacts repositories create $REPO \
  --repository-format=docker \
  --location=$REGION \
  --project=$PROJECT_ID

REGISTRY="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO"

# 2. Build and push images
echo "==> Building web image..."
docker build -f apps/web/Dockerfile -t "$REGISTRY/web:latest" .
docker push "$REGISTRY/web:latest"

echo "==> Building agent image..."
docker build -f apps/agent/Dockerfile -t "$REGISTRY/agent:latest" .
docker push "$REGISTRY/agent:latest"

# 3. Deploy Agent service (WebSocket-enabled)
echo "==> Deploying agent service..."
gcloud run deploy liveagent-agent \
  --image="$REGISTRY/agent:latest" \
  --region=$REGION \
  --project=$PROJECT_ID \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --cpu=1 \
  --memory=512Mi \
  --min-instances=1 \
  --max-instances=10 \
  --session-affinity \
  --use-http2 \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,GOOGLE_API_KEY=GOOGLE_API_KEY:latest"

AGENT_URL=$(gcloud run services describe liveagent-agent \
  --region=$REGION --project=$PROJECT_ID \
  --format='value(status.url)')

echo "    Agent URL: $AGENT_URL"

# 4. Deploy Web service
echo "==> Deploying web service..."
gcloud run deploy liveagent-web \
  --image="$REGISTRY/web:latest" \
  --region=$REGION \
  --project=$PROJECT_ID \
  --platform=managed \
  --allow-unauthenticated \
  --port=3000 \
  --cpu=1 \
  --memory=512Mi \
  --min-instances=0 \
  --max-instances=10 \
  --set-env-vars="NODE_ENV=production,AGENT_SERVICE_URL=$AGENT_URL,NEXT_PUBLIC_AGENT_WS_URL=${AGENT_URL/https/wss}" \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,CLERK_SECRET_KEY=CLERK_SECRET_KEY:latest,NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=CLERK_PUBLISHABLE_KEY:latest,GOOGLE_API_KEY=GOOGLE_API_KEY:latest"

WEB_URL=$(gcloud run services describe liveagent-web \
  --region=$REGION --project=$PROJECT_ID \
  --format='value(status.url)')

echo ""
echo "==> Deployment complete!"
echo "    Web:   $WEB_URL"
echo "    Agent: $AGENT_URL"
