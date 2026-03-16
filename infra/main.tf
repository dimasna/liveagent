terraform {
  required_version = ">= 1.5"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  # Uncomment to store state in GCS:
  # backend "gcs" {
  #   bucket = "YOUR_STATE_BUCKET"
  #   prefix = "liveagent/terraform"
  # }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

data "google_project" "current" {}

# ---------- Enable required APIs ----------
resource "google_project_service" "apis" {
  for_each = toset([
    # Infrastructure
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "secretmanager.googleapis.com",
    "vpcaccess.googleapis.com",
    # AI & Google Services
    "generativelanguage.googleapis.com",
    "aiplatform.googleapis.com",
    "calendar-json.googleapis.com",
    "places.googleapis.com",
  ])
  service            = each.value
  disable_on_destroy = false
}

# ---------- Artifact Registry ----------
resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = "liveagent"
  format        = "DOCKER"
  depends_on    = [google_project_service.apis]
}

locals {
  registry   = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.repo.repository_id}"
  source_dir = "${path.module}/.."

  # Service URLs — uses custom domain when set, otherwise Cloud Run generated URLs.
  # Cloud Run URL pattern: https://{service}-{project_number}.{region}.run.app
  has_domain   = var.domain != ""
  run_base     = "${data.google_project.current.number}.${var.region}.run.app"
  app_url      = local.has_domain ? "https://${var.domain}" : "https://liveagent-web-${local.run_base}"
  agent_url    = local.has_domain ? "https://agent.${var.domain}" : "https://liveagent-agent-${local.run_base}"
  agent_ws_url = local.has_domain ? "wss://agent.${var.domain}" : "wss://liveagent-agent-${local.run_base}"
  widget_url   = local.has_domain ? "https://widget.${var.domain}" : "https://liveagent-widget-${local.run_base}"
}

# ---------- Cloud Build: build & push images ----------
resource "null_resource" "build_agent" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    working_dir = local.source_dir
    command     = <<-EOT
      gcloud builds submit \
        --project ${var.project_id} \
        --region ${var.region} \
        --config /dev/stdin . <<'EOF'
      steps:
        - name: gcr.io/cloud-builders/docker
          args: ['build', '-f', 'apps/agent/Dockerfile', '-t', '${local.registry}/agent:latest', '.']
      images: ['${local.registry}/agent:latest']
      options:
        logging: CLOUD_LOGGING_ONLY
      EOF
    EOT
  }

  depends_on = [google_artifact_registry_repository.repo]
}

resource "null_resource" "build_web" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    working_dir = local.source_dir
    command     = <<-EOT
      gcloud builds submit \
        --project ${var.project_id} \
        --region ${var.region} \
        --config /dev/stdin . <<'EOF'
      steps:
        - name: gcr.io/cloud-builders/docker
          args: ['build', '-f', 'apps/web/Dockerfile', '-t', '${local.registry}/web:latest', '.']
      images: ['${local.registry}/web:latest']
      options:
        logging: CLOUD_LOGGING_ONLY
      EOF
    EOT
  }

  depends_on = [google_artifact_registry_repository.repo]
}

resource "null_resource" "build_widget" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    working_dir = local.source_dir
    command     = <<-EOT
      gcloud builds submit \
        --project ${var.project_id} \
        --region ${var.region} \
        --config /dev/stdin . <<'EOF'
      steps:
        - name: gcr.io/cloud-builders/docker
          args: ['build', '-f', 'apps/widget/Dockerfile', '-t', '${local.registry}/widget:latest', '.']
      images: ['${local.registry}/widget:latest']
      options:
        logging: CLOUD_LOGGING_ONLY
      EOF
    EOT
  }

  depends_on = [google_artifact_registry_repository.repo]
}

# ---------- Cloud SQL (PostgreSQL) ----------
resource "google_sql_database_instance" "pg" {
  name             = "liveagent-${var.environment}"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier              = var.db_tier
    availability_type = "ZONAL"
    edition           = "ENTERPRISE"

    ip_configuration {
      ipv4_enabled = true # Cloud Run uses Cloud SQL Auth Proxy via unix socket
    }

    backup_configuration {
      enabled = true
    }
  }

  deletion_protection = true
  depends_on          = [google_project_service.apis]
}

resource "google_sql_database" "db" {
  name     = var.db_name
  instance = google_sql_database_instance.pg.name
}

resource "random_password" "db_password" {
  length  = 24
  special = false
}

resource "google_sql_user" "app" {
  name     = "liveagent"
  instance = google_sql_database_instance.pg.name
  password = random_password.db_password.result
}

locals {
  database_url = "postgresql://${google_sql_user.app.name}:${random_password.db_password.result}@localhost/${var.db_name}?host=/cloudsql/${google_sql_database_instance.pg.connection_name}"
}

# ---------- Database migration (Prisma via Cloud Build) ----------
resource "null_resource" "db_migrate" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    working_dir = local.source_dir
    command     = <<-EOT
      # Temporarily allow Cloud Build to reach Cloud SQL public IP
      gcloud sql instances patch ${google_sql_database_instance.pg.name} \
        --project=${var.project_id} \
        --authorized-networks=0.0.0.0/0 \
        --quiet

      # Run migration in Cloud Build
      gcloud builds submit \
        --project ${var.project_id} \
        --region ${var.region} \
        --config /dev/stdin . <<'EOF'
      steps:
        - name: node:20-alpine
          entrypoint: sh
          args:
            - -c
            - |
              corepack enable && corepack prepare pnpm@10.4.1 --activate
              cd /workspace
              pnpm install --frozen-lockfile --filter @liveagent/db...
              DATABASE_URL="postgresql://${google_sql_user.app.name}:${random_password.db_password.result}@${google_sql_database_instance.pg.public_ip_address}:5432/${var.db_name}" pnpm --filter @liveagent/db db:generate
              DATABASE_URL="postgresql://${google_sql_user.app.name}:${random_password.db_password.result}@${google_sql_database_instance.pg.public_ip_address}:5432/${var.db_name}" pnpm --filter @liveagent/db db:push --accept-data-loss
      options:
        logging: CLOUD_LOGGING_ONLY
      EOF

      # Remove public access after migration
      gcloud sql instances patch ${google_sql_database_instance.pg.name} \
        --project=${var.project_id} \
        --clear-authorized-networks \
        --quiet
    EOT
  }

  depends_on = [
    google_sql_database.db,
    google_sql_user.app,
  ]
}

# ---------- Service Account for Cloud Run ----------
resource "google_service_account" "cloudrun" {
  account_id   = "liveagent-run"
  display_name = "LiveAgent Cloud Run"
}

resource "google_project_iam_member" "cloudrun_sql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloudrun.email}"
}

resource "google_project_iam_member" "cloudrun_vertexai" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.cloudrun.email}"
}

# ---------- Cloud Run: web (Next.js) ----------
resource "google_cloud_run_v2_service" "web" {
  name     = "liveagent-web"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.cloudrun.email

    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.pg.connection_name]
      }
    }

    containers {
      image = "${local.registry}/web:latest"

      ports {
        container_port = 3000
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }

      env {
        name  = "DATABASE_URL"
        value = local.database_url
      }
      env {
        name  = "SESSION_SECRET"
        value = var.session_secret
      }
      env {
        name  = "AUTH_USERNAME"
        value = var.auth_username
      }
      env {
        name  = "AUTH_PASSWORD"
        value = var.auth_password
      }
      env {
        name  = "ALLOW_SIGNUP"
        value = "false"
      }
      env {
        name  = "GOOGLE_CLIENT_ID"
        value = var.google_client_id
      }
      env {
        name  = "GOOGLE_CLIENT_SECRET"
        value = var.google_client_secret
      }
      env {
        name  = "GOOGLE_API_KEY"
        value = var.google_api_key
      }
      env {
        name  = "GOOGLE_PLACES_API_KEY"
        value = var.google_places_api_key
      }
      env {
        name  = "APP_URL"
        value = local.app_url
      }
      env {
        name  = "NEXT_PUBLIC_APP_URL"
        value = local.app_url
      }
      env {
        name  = "AGENT_SERVICE_URL"
        value = local.agent_url
      }
      env {
        name  = "NEXT_PUBLIC_AGENT_WS_URL"
        value = local.agent_ws_url
      }
      env {
        name  = "NEXT_PUBLIC_WIDGET_URL"
        value = local.widget_url
      }
      env {
        name  = "NEXT_PUBLIC_DEMO_AGENT_ID"
        value = var.demo_agent_id
      }
    }
  }

  depends_on = [google_project_service.apis, null_resource.build_web, null_resource.db_migrate]
}

# Public access for web
resource "google_cloud_run_v2_service_iam_member" "web_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.web.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ---------- Cloud Run: agent (WebSocket / voice) ----------
resource "google_cloud_run_v2_service" "agent" {
  name     = "liveagent-agent"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.cloudrun.email

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }

    # Keep connections alive for voice sessions
    timeout = "3600s"

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.pg.connection_name]
      }
    }

    containers {
      image = "${local.registry}/agent:latest"

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }

      env {
        name  = "DATABASE_URL"
        value = local.database_url
      }
      env {
        name  = "GOOGLE_API_KEY"
        value = var.google_api_key
      }
      env {
        name  = "GOOGLE_CLOUD_PROJECT"
        value = var.project_id
      }
      env {
        name  = "GOOGLE_CLIENT_ID"
        value = var.google_client_id
      }
      env {
        name  = "GOOGLE_CLIENT_SECRET"
        value = var.google_client_secret
      }
    }
  }

  depends_on = [google_project_service.apis, null_resource.build_agent, null_resource.db_migrate]
}

resource "google_cloud_run_v2_service_iam_member" "agent_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.agent.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ---------- Cloud Run: widget (embeddable Next.js) ----------
resource "google_cloud_run_v2_service" "widget" {
  name     = "liveagent-widget"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.cloudrun.email

    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }

    containers {
      image = "${local.registry}/widget:latest"

      ports {
        container_port = 3000
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      env {
        name  = "NEXT_PUBLIC_AGENT_WS_URL"
        value = local.agent_ws_url
      }
      env {
        name  = "NEXT_PUBLIC_WIDGET_API_URL"
        value = local.app_url
      }
    }
  }

  depends_on = [google_project_service.apis, null_resource.build_widget]
}

resource "google_cloud_run_v2_service_iam_member" "widget_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.widget.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ---------- Domain Mappings (optional, requires verified domain) ----------
# These use create_before_destroy + ignore metadata changes to prevent
# terraform from destroying and recreating them (which resets SSL certs).
resource "google_cloud_run_domain_mapping" "web" {
  count    = var.domain != "" ? 1 : 0
  name     = var.domain
  location = var.region

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_v2_service.web.name
  }

  lifecycle {
    ignore_changes = [metadata]
  }

  depends_on = [google_cloud_run_v2_service.web]
}

resource "google_cloud_run_domain_mapping" "agent" {
  count    = var.domain != "" ? 1 : 0
  name     = "agent.${var.domain}"
  location = var.region

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_v2_service.agent.name
  }

  lifecycle {
    ignore_changes = [metadata]
  }

  depends_on = [google_cloud_run_v2_service.agent]
}

resource "google_cloud_run_domain_mapping" "widget" {
  count    = var.domain != "" ? 1 : 0
  name     = "widget.${var.domain}"
  location = var.region

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_v2_service.widget.name
  }

  lifecycle {
    ignore_changes = [metadata]
  }

  depends_on = [google_cloud_run_v2_service.widget]
}
