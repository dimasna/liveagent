output "web_url" {
  value = google_cloud_run_v2_service.web.uri
}

output "agent_url" {
  value = google_cloud_run_v2_service.agent.uri
}

output "registry" {
  value = local.registry
}

output "db_connection_name" {
  value = google_sql_database_instance.pg.connection_name
}

output "widget_url" {
  value = google_cloud_run_v2_service.widget.uri
}

output "call_url" {
  value = google_cloud_run_v2_service.call.uri
}

output "db_password" {
  value     = random_password.db_password.result
  sensitive = true
}
