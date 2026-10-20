output "api_service_account_email" {
  description = "Runtime identity to attach to the API service after infrastructure approval."
  value       = google_service_account.api.email
}

output "evidence_bucket_name" {
  description = "Private bucket for originals. Never expose object URLs publicly."
  value       = google_storage_bucket.evidence.name
}

output "derivative_bucket_name" {
  description = "Private bucket for separately reviewed public derivatives."
  value       = google_storage_bucket.derivatives.name
}
