#!/bin/bash
set -e

# === Check if files were generated === #
files=`ls k8s-generated | wc -l`
if [ "$files" -eq 0 ]; then
  echo "Nothing to deploy"
  exit 0
fi

# === Build Image === #
monorepoImageUrl=gcr.io/${GOOGLE_PROJECT_ID}/${CIRCLE_PROJECT_REPONAME}:${CIRCLE_BRANCH}-${CIRCLE_BUILD_NUM}

docker build -t $monorepoImageUrl -f Dockerfile .
docker push $monorepoImageUrl

{
  kubectl apply -f ./k8s-generated
} || {
  echo "Did not apply"
}
