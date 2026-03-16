variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region for all resources"
  type        = string
  default     = "asia-southeast1"
}

variable "environment" {
  description = "Environment name (e.g. production, staging)"
  type        = string
  default     = "production"
}

# --- Cloud SQL ---
variable "db_tier" {
  description = "Cloud SQL machine tier"
  type        = string
  default     = "db-f1-micro" # cheapest; upgrade for production traffic
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "liveagent"
}

# --- App env vars (secrets) ---
variable "session_secret" {
  type      = string
  sensitive = true
  default   = ""
}

variable "auth_username" {
  type    = string
  default = "admin"
}

variable "auth_password" {
  type      = string
  sensitive = true
  default   = ""
}

variable "google_client_id" {
  type    = string
  default = ""
}

variable "google_client_secret" {
  type      = string
  sensitive = true
  default   = ""
}

variable "demo_agent_id" {
  description = "Agent ID for the landing page demo widget (set after creating an agent)"
  type        = string
  default     = ""
}

variable "google_api_key" {
  description = "Google API key (Gemini / genai SDK)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "google_places_api_key" {
  description = "Google Places API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "domain" {
  description = "Root domain (e.g. liveagent.dev). When set, uses custom subdomains: agent.{domain}, widget.{domain}. When empty, uses Cloud Run generated URLs."
  type        = string
  default     = ""
}
