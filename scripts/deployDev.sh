#!/bin/bash
set -e

monorepoImageUrl=gcr.io/overmindbots/core:development

kubectx docker-for-desktop

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

# === Build image === #

docker build -t $monorepoImageUrl -f Dockerfile .

node ./scripts/buildTemplates.js service-referral-ranks-invites
node ./scripts/buildTemplates.js service-bot-manager
node ./scripts/buildTemplates.js bot-referral-ranks

{
  kubectl apply -f ./k8s-generated
} || {
  echo "Did not apply"
}