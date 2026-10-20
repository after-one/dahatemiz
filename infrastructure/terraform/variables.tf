variable "project_id" {
  description = "Existing GCP project ID. Project creation is outside this configuration."
  type        = string
}

variable "region" {
  description = "Approved data residency region. No default is set pending legal review."
  type        = string
}

variable "evidence_bucket_name" {
  description = "Globally unique private bucket name for original evidence."
  type        = string
}

variable "derivative_bucket_name" {
  description = "Globally unique private bucket name for separately reviewed derivatives."
  type        = string
}
