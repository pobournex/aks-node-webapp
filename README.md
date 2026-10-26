# aks-node-webapp

A Node.js Express web server containerized with Docker and deployed to **Azure Kubernetes Service (AKS)** through a multi-stage **Azure DevOps** pipeline.

![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Container-2496ED?logo=docker&logoColor=white)
![Azure](https://img.shields.io/badge/Azure-AKS%20%7C%20ACR-0078D4?logo=microsoftazure&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Manifests-326CE5?logo=kubernetes&logoColor=white)
![Azure DevOps](https://img.shields.io/badge/CI%2FCD-Azure%20DevOps-0078D7?logo=azuredevops&logoColor=white)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Azure Resources](#azure-resources)
- [Repository Structure](#repository-structure)
- [CI/CD Workflow](#cicd-workflow)
- [Deployment Verification](#deployment-verification)
- [Project Visuals](#project-visuals)
- [Local Cluster Verification](#local-cluster-verification)
- [Running Locally](#running-locally)
- [Key Learnings & Troubleshooting](#key-learnings--troubleshooting)
- [Future Improvements](#future-improvements)

---

## Overview

This project demonstrates an end-to-end cloud-native delivery workflow:

1. A Node.js Express app serves a simple web page.
2. Azure DevOps builds the Docker image and pushes it to Azure Container Registry (ACR).
3. A second pipeline stage applies Kubernetes manifests to AKS.
4. The app runs as **2 replica pods**, exposed publicly via an **Azure LoadBalancer** service.

The live app returns:

> **Hello from Azure Kubernetes Service! 🚀**

---

## Architecture

```
                        ┌───────────────────────────┐
                        │        Developer          │
                        │      git push (main)      │
                        └─────────────┬─────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │   GitHub Repository       │
                        │  pobournex/aks-node-webapp│
                        └─────────────┬─────────────┘
                                      │ trigger
                                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     Azure DevOps Pipeline                            │
│                     (azure-pipelines.yml)                            │
│                                                                      │
│   ┌──────────────────────────┐      ┌──────────────────────────┐     │
│   │ Stage 1: Build & Push    │ ───▶ │ Stage 2: Deploy          │     │
│   │  • docker build          │      │  • kubectl apply -f K8s/ │     │
│   │  • docker push to ACR    │      │  • rollout to AKS        │     │
│   └────────────┬─────────────┘      └────────────┬─────────────┘     │
└────────────────┼─────────────────────────────────┼───────────────────┘
                 │ push image                      │ apply manifests
                 ▼                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│              Azure Resource Group: rg-k8s-demo                       │
│                                                                      │
│   ┌──────────────────────┐          ┌─────────────────────────────┐  │
│   │ Azure Container      │  pull    │ AKS Cluster: myAKSCluster   │  │
│   │ Registry             │ ───────▶ │                             │  │
│   │ pobouracr123         │          │  ┌───────┐   ┌───────┐      │  │
│   └──────────────────────┘          │  │ Pod 1 │   │ Pod 2 │      │  │
│                                     │  └───┬───┘   └───┬───┘      │  │
│                                     │      └─────┬─────┘          │  │
│                                     │            ▼                │  │
│                                     │   Service (LoadBalancer)    │  │
│                                     └────────────┬────────────────┘  │
└──────────────────────────────────────────────────┼───────────────────┘
                                                   │
                                                   ▼
                                     ┌──────────────────────────┐
                                     │  Public IP 52.147.211.45 │
                                     │  "Hello from Azure       │
                                     │   Kubernetes Service! 🚀"│
                                     └──────────────────────────┘
                                                   ▲
                                                   │ HTTP
                                              ┌────┴─────┐
                                              │  Users   │
                                              └──────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Application | Node.js, Express |
| Containerization | Docker |
| Container Registry | Azure Container Registry (ACR) |
| Orchestration | Azure Kubernetes Service (AKS) |
| Networking | Kubernetes Service type `LoadBalancer` (Azure Load Balancer) |
| CI/CD | Azure DevOps Pipelines (multi-stage YAML) |
| Tooling | Azure CLI, kubectl |

---

## Azure Resources

| Resource | Name |
|---|---|
| Resource Group | `rg-k8s-demo` |
| Container Registry | `pobouracr123` |
| Kubernetes Cluster | `myAKSCluster` |

---

## Repository Structure

```
aks-node-webapp/
├── K8s/                     # Kubernetes manifests (note capital K)
│   ├── deployment.yaml      # 2-replica Deployment
│   └── service.yaml         # LoadBalancer Service
├── Dockerfile               # Container image definition
├── azure-pipelines.yml      # Multi-stage CI/CD pipeline
├── project visuals/         # Deployment screenshots used in this README
│   ├── 1.png                # Terminal: pods + LoadBalancer external IP
│   └── 2.png                # Browser: live app at 52.147.211.45
├── package.json
├── app.js                   # Express application entry point (port 8080)
└── README.md
```

---

## CI/CD Workflow

The pipeline is defined in `azure-pipelines.yml` and runs in two sequential stages.

### Stage 1: Build & Push

- Checks out the source code.
- Builds the Docker image from the `Dockerfile`.
- Tags the image (e.g., with the build ID) and pushes it to ACR (`pobouracr123`).

### Stage 2: Deploy

- Runs only if Stage 1 succeeds.
- Connects to `myAKSCluster` using an Azure service connection.
- Applies the Kubernetes manifests from the `K8s/` folder to the cluster.
- AKS pulls the new image from ACR and rolls out the updated pods.

```
 Commit ──▶ [ Build & Push ] ──▶ [ Deploy to AKS ] ──▶ Live
              Docker → ACR         kubectl apply K8s/
```

### Pipeline Prerequisites

- An Azure DevOps project with a pipeline linked to this repository.
- An **ACR service connection** (Docker Registry) for pushing images.
- An **Azure Resource Manager / Kubernetes service connection** for deploying to AKS.
- AKS granted pull access to ACR, e.g.:

```bash
az aks update -n myAKSCluster -g rg-k8s-demo --attach-acr pobouracr123
```

---

## Deployment Verification

After a successful pipeline run:

- **2 replica pods** are running in `myAKSCluster`.
- A `LoadBalancer` service exposes the app externally at **`52.147.211.45`**.
- Browsing to `http://52.147.211.45` displays:

  **Hello from Azure Kubernetes Service! 🚀**

> The external IP is assigned by Azure and may change if the service is recreated.

---

## Project Visuals

### 1. Cluster verification: running pods and LoadBalancer external IP

`kubectl` output showing the 2 replica pods in `Running` state and the `sample-app-service` LoadBalancer with external IP `52.147.211.45`.

![Terminal verification of running pods and LoadBalancer external IP](project%20visuals/1.png)

### 2. Live application in the browser

The app served at `http://52.147.211.45`, returning "Hello from Azure Kubernetes Service! 🚀".

![Live browser view of the application at 52.147.211.45](project%20visuals/2.png)

---

## Local Cluster Verification

Run these from **Git Bash** (or any terminal with Azure CLI and kubectl installed).

**1. Sign in and pull the cluster context**

```bash
az login
az aks get-credentials --resource-group rg-k8s-demo --name myAKSCluster
```

**2. Confirm the active context and nodes**

```bash
kubectl config current-context
kubectl get nodes
```

**3. Check deployment and pods (expect 2 replicas)**

```bash
kubectl get deployments
kubectl get pods -o wide
```

**4. Check the service and external IP**

```bash
kubectl get svc
```

Expected: the `sample-app-service` `LoadBalancer` service (port 80 → container port 8080) with `EXTERNAL-IP` `52.147.211.45`.

**5. Test the endpoint**

```bash
curl http://52.147.211.45
```

Expected output:

```
Hello from Azure Kubernetes Service! 🚀
```

**6. Inspect logs and rollout status**

```bash
kubectl logs deployment/sample-app-deployment
kubectl rollout status deployment/sample-app-deployment
kubectl describe pod -l app=sample-app
```

---

## Running Locally

```bash
# Install dependencies and start the server
npm install
npm start

# Or with Docker
docker build -t aks-node-webapp .
docker run -p 8080:8080 aks-node-webapp
```

Then open `http://localhost:8080`. The port defaults to `8080` and can be overridden with the `PORT` environment variable.

---

## Key Learnings & Troubleshooting

### 1. Case sensitivity on Linux build runners

**Problem:** The pipeline failed at the deploy stage because it could not find the manifests. The repo folder was `K8s/`, but the pipeline referenced `k8s/`. Windows and macOS file systems are case-insensitive, so it worked locally, but Azure DevOps Linux agents are case-sensitive.

**Fix:** Updated the path in `azure-pipelines.yml` from `k8s/` to `K8s/` to exactly match the folder name in the repository.

**Takeaway:** Always match file and folder casing exactly. Linux treats `k8s/` and `K8s/` as different paths.

### 2. Pulling cluster context locally

**Problem:** `kubectl` commands on a local machine had no cluster to talk to.

**Fix:** Fetch credentials and merge the cluster context into your local kubeconfig:

```bash
az aks get-credentials --resource-group rg-k8s-demo --name myAKSCluster
```

**Takeaway:** `az aks get-credentials` is the bridge between Azure and local `kubectl`. Verify with `kubectl config current-context`.

### Common issues

| Symptom | Likely cause | Fix |
|---|---|---|
| `ImagePullBackOff` | AKS cannot pull from ACR | Run `az aks update --attach-acr` |
| `EXTERNAL-IP` stuck on `<pending>` | Load balancer still provisioning | Wait a few minutes, then `kubectl get svc -w` |
| Pipeline cannot find manifests | Path casing mismatch | Match `K8s/` exactly |
| `kubectl` connects to wrong cluster | Stale context | `kubectl config use-context myAKSCluster` |

---

## Future Improvements

- Add an Ingress controller with TLS (HTTPS)
- Add readiness and liveness probes plus resource limits
- Provision infrastructure with Terraform or Bicep
- Add automated tests and image vulnerability scanning to the pipeline
- Add Horizontal Pod Autoscaler (HPA)
- Add monitoring with Azure Monitor / Prometheus and Grafana

---

## Author

**Philip Obour-Bonsu**
GitHub: [@pobournex](https://github.com/pobournex)
