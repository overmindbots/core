#!/bin/bash
set -e

# Cheap arg handing
argOne=$1

devDeployTimestamp=$(date +%s)
imageBaseUrl=gcr.io/overmindbots

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

# === Generate docker files (TODO: Automate this list) === #
node ./scripts/docker/preparePackagesCopies.js

# === Build images === #
if [[ $argOne == '--no-build' ]] ; then
  echo "=> Skipping docker build"
else
  node ./scripts/docker/buildPackageImage.js service-bot-manager "$imageBaseUrl/core:$devDeployTimestamp"
  node ./scripts/docker/buildPackageImage.js bot-referral-ranks "$imageBaseUrl/core:$devDeployTimestamp"
  node ./scripts/docker/buildPackageImage.js app-referral-ranks-invite-wrapper "$imageBaseUrl/core:$devDeployTimestamp"
  node ./scripts/docker/buildPackageImage.js bot-referral-ranks-fulfillment-service "$imageBaseUrl/core:$devDeployTimestamp"
  node ./scripts/docker/buildPackageImage.js service-naked-domain-redirect "$imageBaseUrl/core:$devDeployTimestamp"
fi

node ./scripts/buildTemplates.js service-bot-manager
node ./scripts/buildTemplates.js bot-referral-ranks
node ./scripts/buildTemplates.js app-referral-ranks-invite-wrapper
node ./scripts/buildTemplates.js bot-referral-ranks-fulfillment-service
node ./scripts/buildTemplates.js service-naked-domain-redirect

{
  kubectl apply -f ./k8s-generated
} || {
  echo "Did not apply"
}

node ./scripts/docker/cleanup.js