output "app_service_endpoint" {
  description = "The endpoint of the app service hosting the Count frontend"
  value       = azurerm_linux_web_app.count_frontend.default_hostname
}