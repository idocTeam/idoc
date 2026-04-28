# Kubernetes Deployment for IDOC

These manifests keep MongoDB external. There is no Kubernetes `mongodb` Deployment or `mongodb` Service in this folder.

## 1. Update secrets

Edit [secret.yaml](/C:/Users/Sisira%20Chandrasiri/Documents/IDOC/k8s/secret.yaml) and replace every `CHANGE_ME_*` value.

Use your existing MongoDB Atlas connection strings for:

- `doctor-mongo-uri`
- `patient-mongo-uri`
- `appointment-mongo-uri`
- `payment-mongo-uri`
- `telemedicine-mongo-uri`
- `notification-mongo-uri`
- `ai-symptoms-mongo-uri`

## 2. Build local Docker images for Docker Desktop Kubernetes

Build these images in the project root:

```powershell
docker build -t idoc/gateway:local .\gateway
docker build -t idoc/admin-service:local .\services\admin-service
docker build -t idoc/doctor-service:local .\services\doctor-service
docker build -t idoc/patient-service:local .\services\patient-service
docker build -t idoc/appointment-service:local .\services\appointment-service
docker build -t idoc/payment-service:local .\services\payment-service
docker build -t idoc/telemedicine-service:local .\services\telemedicine-service
docker build -t idoc/notification-service:local .\services\notification-service
docker build -t idoc/ai-symptoms-service:local .\services\ai-symptoms-service
docker build -t idoc/frontend:local --build-arg VITE_API_BASE_URL=http://localhost:30050/api .\frontend
```

The frontend build argument points the browser app to the Kubernetes gateway `NodePort`.

## 3. Apply manifests

```powershell
kubectl apply -k .\k8s
```

## 4. Check status

```powershell
kubectl get pods -n idoc
kubectl get svc -n idoc
```

## 5. Access the app

- Frontend: `http://localhost:30080`
- Gateway: `http://localhost:30050`

## Notes

- `frontend` and `gateway` are exposed with `NodePort`.
- All other services are internal `ClusterIP` services.
- `patient-service` keeps a persistent volume claim for uploaded files.
- `payment-service` was given `DOCTOR_SERVICE_URL` in Kubernetes because the code uses it in the e-ticket flow.
