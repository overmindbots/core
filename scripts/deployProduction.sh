#!/bin/bash
set -e

# === Build Kubernetes templates === #
node ./scripts/buildTemplates.js

# === Build images === #
serviceReferralRanksInvitesImgUrl=gcr.io/${GOOGLE_PROJECT_ID}/service-referral-ranks-invites:${CIRCLE_BRANCH}-${CIRCLE_BUILD_NUM}

docker build -t $serviceReferralRanksInvitesImgUrl -f packages/service-referral-ranks-invites/Dockerfile .
docker push $serviceReferralRanksInvitesImgUrl

{
  kubectl apply -f ./k8s-generated
} || {
  echo "Did not apply"
}