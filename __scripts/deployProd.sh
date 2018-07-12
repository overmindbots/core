#!/bin/bash
set -e

# === Build Kubernetes templates === #
yarn build-templates

# === Build Images === #
botManagerImgUrl=gcr.io/${GOOGLE_PROJECT_ID}/bot-manager:${CIRCLE_BRANCH}-${CIRCLE_BUILD_NUM}
botReferralRanksImgUrl=gcr.io/${GOOGLE_PROJECT_ID}/bot-referral-ranks:${CIRCLE_BRANCH}-${CIRCLE_BUILD_NUM}

# bot-manager
docker build ./bot-manager -t $botManagerImgUrl
docker push $botManagerImgUrl
# bot-referral-ranks
docker build ./bot-referral-ranks -t $botReferralRanksImgUrl
docker push $botReferralRanksImgUrl

# === Apply Kubernetes configs === #
{
  kubectl apply -f ./k8s-generated/
} || {
  echo "Did not apply"
}

# === Update Kubernetes images (Is this necessary since we are aleady applying this in the config files?) === #
# bot-manager
{
  kubectl apply deployment bot-manager -p '{"spec":{"template":{"spec":{"containers":[{"name":"bot-alchemy-bot-manager","image":"'"$botManagerImgUrl"'"}]}}}}' -n $GOOGLE_PROJECT_ID
} || {
  echo "bot-manager not updated"
}
# bot-referral-ranks
{
  kubectl apply deployment bot-referral-ranks -p '{"spec":{"template":{"spec":{"containers":[{"name":"bot-alchemy-referral-ranks","image":"'"$botReferralRanksImgUrl"'"}]}}}}' -n $GOOGLE_PROJECT_ID
} || {
  echo "bot-referral-ranks not updated"
}