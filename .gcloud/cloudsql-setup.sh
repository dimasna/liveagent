#!/bin/bash
set -euo pipefail

# Create Cloud SQL PostgreSQL instance for LiveAgent
PROJECT_ID="${GOOGLE_CLOUD_PROJECT_ID:?Set GOOGLE_CLOUD_PROJECT_ID}"
REGION="${GOOGLE_CLOUD_REGION:-us-central1}"
INSTANCE_NAME="liveagent-db"
DB_NAME="liveagent"
DB_USER="liveagent"

echo "==> Creating Cloud SQL instance..."
gcloud sql instances create $INSTANCE_NAME \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=$REGION \
  --project=$PROJECT_ID \
  --storage-type=SSD \
  --storage-size=10GB \
  --availability-type=zonal

echo "==> Creating database..."
gcloud sql databases create $DB_NAME \
  --instance=$INSTANCE_NAME \
  --project=$PROJECT_ID

echo "==> Creating user..."
DB_PASSWORD=$(openssl rand -base64 24)
gcloud sql users create $DB_USER \
  --instance=$INSTANCE_NAME \
  --project=$PROJECT_ID \
  --password="$DB_PASSWORD"

# Get instance connection name
CONN_NAME=$(gcloud sql instances describe $INSTANCE_NAME \
  --project=$PROJECT_ID \
  --format='value(connectionName)')

echo ""
echo "==> Cloud SQL instance created!"
echo "    Instance: $INSTANCE_NAME"
echo "    Connection: $CONN_NAME"
echo "    Database: $DB_NAME"
echo "    User: $DB_USER"
echo "    Password: $DB_PASSWORD"
echo ""
echo "    DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@/$DB_NAME?host=/cloudsql/$CONN_NAME"
echo ""
echo "==> Store the DATABASE_URL in Secret Manager:"
echo "    echo -n 'postgresql://$DB_USER:$DB_PASSWORD@/$DB_NAME?host=/cloudsql/$CONN_NAME' | \\"
echo "      gcloud secrets create DATABASE_URL --data-file=- --project=$PROJECT_ID"
