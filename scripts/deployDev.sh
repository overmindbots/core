#!/bin/bash
set -e

kubectx minikube

rm -rf k8s-generated
mkdir k8s-generated
touch k8s-generated/.gitkeep

{
  helm install --name overmindbots-mongodb stable/mongodb --namespace overmindbots --set mongodbUsername=dev,mongodbPassword=dev,mongodbDatabase=overmindbots
} || {
  echo "Already installed mongodb"
}

{
  kubectl create namespace overmindbots
} || {
  echo "Did not create overmindbots namespace"
}

# === Build images === #

serviceReferralRanksInvites=service-referral-ranks-invites:development

docker build -t $serviceReferralRanksInvites -f packages/service-referral-ranks-invites/Dockerfile .

node ./scripts/buildTemplates.js service-referral-ranks-invites

{
  kubectl apply -f ./k8s-generated
} || {
  echo "Did not apply"
}