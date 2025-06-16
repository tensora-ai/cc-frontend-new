data "azurerm_cosmosdb_account" "count" {
  name                = "cosno-count-${var.customer}-${var.environment}"
  resource_group_name = "rg-count-${var.customer}-${var.environment}-storage"
}

data "azurerm_cosmosdb_sql_database" "count" {
  name                = "cosmos-count-${var.customer}-${var.environment}"
  resource_group_name = "rg-count-${var.customer}-${var.environment}-storage"
  account_name        = data.azurerm_cosmosdb_account.count.name
}

data "azurerm_storage_account" "count" {
  name                = "stcount${var.customer}${var.environment}"
  resource_group_name = "rg-count-${var.customer}-${var.environment}-storage"
}

data "azurerm_container_registry" "count" {
  name                = "acrcount${var.customer}${var.environment}"
  resource_group_name = "rg-count-${var.customer}-${var.environment}-operations"
}

data "azurerm_service_plan" "count" {
  name                = "asp-count-${var.customer}-${var.environment}"
  resource_group_name = "rg-count-${var.customer}-${var.environment}-apps"
}

resource "azurerm_linux_web_app" "count_frontend" {
  name                = "app-count-${var.customer}-${var.environment}-frontend"
  resource_group_name = "rg-count-${var.customer}-${var.environment}-apps"
  location            = var.location
  service_plan_id     = data.azurerm_service_plan.count.id

  logs {
    application_logs {
      file_system_level = "Verbose"
    }
    http_logs {
      file_system {
        retention_in_days = 14
        retention_in_mb   = 100
      }
    }
  }

  site_config {
    application_stack {
      docker_image_name        = "count-${var.customer}-${var.environment}-frontend:latest"
      docker_registry_url      = "https://${data.azurerm_container_registry.count.login_server}"
      docker_registry_username = data.azurerm_container_registry.count.admin_username
      docker_registry_password = data.azurerm_container_registry.count.admin_password
    }

    always_on                         = true
    ftps_state                        = "Disabled"
    health_check_path                 = "/api/v1/health"
    health_check_eviction_time_in_min = 2
  }

  app_settings = {
    WEBSITES_ENABLE_APP_SERVICE_STORAGE = "false"
    WEBSITES_CONTAINER_START_LIMIT      = 1800
    WEBSITES_PORT                       = 3000
    NEXT_PUBLIC_API_BASE_URL            = var.backend_base_url
    NEXT_PUBLIC_API_KEY                 = var.backend_api_key
  }

  lifecycle {
    ignore_changes = [
      app_settings["DOCKER_REGISTRY_SERVER_PASSWORD"],
      site_config[0].application_stack[0].docker_registry_password
    ]
  }

  tags = {
    customer    = var.customer
    environment = var.environment
  }
}
