#!/bin/bash
set -e

kubectx minikube

yarn build-templates

# {
#   kubectl delete namespace bot-alchemy;
# } || {
#   echo "Did nothing with namespace"
# }

{
  helm install --name bot-alchemy-mongodb stable/mongodb --namespace bot-alchemy --set mongodbUsername=dev,mongodbPassword=dev,mongodbDatabase=bot-alchemy
} || {
  echo "Already installed mongodb"
}

{
  kubectl create namespace bot-alchemy
} || {
  echo "Did not create bot-alchemy namespace"
}

# === Build images === #
botManagerImgUrl=bot-manager:develop
botReferralRanksImgUrl=bot-referral-ranks:develop

docker build ../bot-manager -t $botManagerImgUrl &
docker build ../bot-referral-ranks -t $botReferralRanksImgUrl &
wait 

# docker push $botManagerImgUrl &
# docker push $botReferralRanksImgUrl &
# wait

# === Apply Kubernetes configs === #
{
  kubectl apply -f ./k8s-generated/
} || {
  echo "Did not apply"
}

kubectl delete pod -l app=bot-manager
kubectl delete pod -l app=bot-referral-ranks
