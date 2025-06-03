variable "subscription_id" {
  type        = string
  description = "The Azure subscription ID"
}

variable "location" {
  type        = string
  description = "The Azure location for all resources"
}

variable "customer" {
  type        = string
  description = "The Name of the customer"
}

variable "environment" {
  type        = string
  description = "Environment to deploy the resources (e.g. pro, dev etc.)"
}

variable "backend_base_url" {
  type    = string
  description = "The URL of the backend service"
}

variable "backend_api_key" {
  type        = string
  description = "The API key for the backend service"
}