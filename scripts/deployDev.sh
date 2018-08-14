#!/bin/bash
set -e

# Cheap arg handing
argOne=$1

devDeployTimestamp=$(date +%s)
monorepoImageUrl="gcr.io/overmindbots/core:$devDeployTimestamp"

kubectx docker-for-desktop

rm -rf k8s-generated
mkdir k8s-generated
touch k8s-generated/.gitkeep

if [[ $argOne == '--no-build' ]] ; then
  echo "!!!! No build flag used! Only deploying to local kubernetes !!!!"
else
  # We update the .devDeploy version
  {
    rm .devDeploy
  } || {
    echo "Creating .devDeploy file"
  }
  touch .devDeploy
  echo $devDeployTimestamp > .devDeploy
fi

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
if [[ $argOne == '--no-build' ]] ; then
  echo "=> Skipping docker build"
else
  docker build --no-cache -t $monorepoImageUrl -f Dockerfile .
fi

node ./scripts/buildTemplates.js service-referral-ranks-invites
node ./scripts/buildTemplates.js service-bot-manager
node ./scripts/buildTemplates.js bot-referral-ranks
node ./scripts/buildTemplates.js app-referral-ranks-invite-wrapper
node ./scripts/buildTemplates.js bot-referral-ranks-fulfillment-service

{
  kubectl apply -f ./k8s-generated
} || {
  echo "Did not apply"
}