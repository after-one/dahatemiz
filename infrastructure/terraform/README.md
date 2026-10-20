# GCP Infrastructure Readiness

Terraform definitions are prepared for review only. Do not run `terraform apply`: cloud regions, data residency,
retention, operating entity, institutional agreements and paid-resource approval are still unresolved. No backend or
credentials are configured in this repository.

The initial module defines two separate, private Cloud Storage buckets and a narrowly scoped API service account. The
evidence bucket has object create/read access for the API so it can sign short-lived uploads and verify object metadata.
The derivative bucket remains private until an explicitly reviewed delivery model is selected. Public access prevention
and uniform bucket access are enabled on both. No retention or deletion policy is guessed before legal review.

The region and globally unique bucket names are required inputs with no defaults. This avoids encoding the previously
suggested Frankfurt region as a legal decision. State must be kept remotely and encrypted before any future planning or
apply. Never commit state, credentials, or `.tfvars` files.

The code has not been initialized, planned, or applied. Terraform is not installed in the current local environment.
