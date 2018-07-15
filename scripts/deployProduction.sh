#!/bin/bash
set -e

# === Build Kubernetes templates === #
yarn build-templates

# === Build images === #
serviceReferralRanksInvitesImgUrl=gcr.io/${GOOGLE_PROJECT_ID}/service-referral-ranks-invites:${CIRCLE_BRANCH}-${CIRCLE_BUILD_NUM}

docker build -t $serviceReferralRanksInvitesImgUrl -f packages/service-referral-ranks-invites/Dockerfile .

node ./scripts/buildTemplates.js

{
  kubectl apply -f ./k8s-generated
} || {
  echo "Did not apply"
}