# Deploy backend to Azure Container Apps

# Variables
$resourceGroup = "fullstack-rg"
$location = "eastus"
$acrName = "fullstackacr"
$containerAppName = "fullstack-backend"
$imageName = "$acrName.azurecr.io/backend:latest"

# Login to Azure (uncomment if needed)
# az login

# Create resource group
az group create --name $resourceGroup --location $location

# Create Azure Container Registry
az acr create --resource-group $resourceGroup --name $acrName --sku Basic

# Login to ACR
az acr login --name $acrName

# Build and push Docker image
docker build -t $imageName ../backend
docker push $imageName

# Create Container App Environment
az containerapp env create --name "fullstack-env" --resource-group $resourceGroup --location $location

# Create Container App
az containerapp create --name $containerAppName --resource-group $resourceGroup --environment "fullstack-env" --image $imageName --target-port 5000 --ingress external --registry-server "$acrName.azurecr.io" --registry-username $acrName --registry-password (az acr credential show --name $acrName --query passwords[0].value -o tsv)

Write-Host "Deployment complete. Backend is running at the URL shown above."